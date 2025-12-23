import { useState, useRef, useCallback } from 'react';
import { floatTo16BitPCM, arrayBufferToBase64, base64ToArrayBuffer } from '../utils/audio-utils';
import { WS_URL } from '../utils/api-config';

export function useLiveSession(
    script: string, 
    knowledgeCards: any[],
    onConnect?: () => void,
    onDisconnect?: () => void,
    onError?: (error: any) => void
) {
    const [isConnected, setIsConnected] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const nextStartTimeRef = useRef<number>(0);

    const playAudioChunk = (base64Data: string) => {
        if (!audioContextRef.current) return;
        const ctx = audioContextRef.current;
        const arrayBuffer = base64ToArrayBuffer(base64Data);
        const float32Data = new Float32Array(arrayBuffer.byteLength / 2);
        const dataView = new DataView(arrayBuffer);

        for (let i = 0; i < float32Data.length; i++) {
            const int16 = dataView.getInt16(i * 2, true); // Little endian
            float32Data[i] = int16 < 0 ? int16 / 0x8000 : int16 / 0x7FFF;
        }

        // Gemini 2.0 Flash Exp output is typically 24kHz
        const buffer = ctx.createBuffer(1, float32Data.length, 24000); 
        buffer.getChannelData(0).set(float32Data);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);

        const currentTime = ctx.currentTime;
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime;
        }
        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += buffer.duration;
    };

    const connect = useCallback(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
            
            // Send Setup Message
            const setupMsg = {
                setup: {
                    model: "models/gemini-2.5-flash-native-audio-preview-12-2025",
                    generation_config: {
                        response_modalities: ["AUDIO"]
                    },
                    system_instruction: {
                        parts: [
                            { text: "You are an AI tutor helping the user practice. Here is the context:" },
                            { text: script },
                            { text: "Here are key knowledge points:" },
                            { text: JSON.stringify(knowledgeCards) },
                            { text: "Conduct a natural conversation to help the user master these points. Be encouraging but correct mistakes. Do not be too verbose." }
                        ]
                    }
                }
            };
            ws.send(JSON.stringify(setupMsg));
            onConnect?.();
        };

        ws.onerror = (error) => {
            console.error("WebSocket Error", error);
        };

        ws.onmessage = async (event) => {
            let data;
            try {
                if (event.data instanceof Blob) {
                    data = JSON.parse(await event.data.text());
                } else {
                    data = JSON.parse(event.data as string);
                }
            } catch (e) {
                console.error("Failed to parse msg", e);
                return;
            }

            // Handle Server Content (Audio)
            if (data.serverContent?.modelTurn?.parts) {
                for (const part of data.serverContent.modelTurn.parts) {
                    if (part.inlineData && part.inlineData.mimeType.startsWith('audio/pcm')) {
                        playAudioChunk(part.inlineData.data);
                    }
                }
            }
        };

        ws.onclose = (event) => {
            console.log("WS Closed", event.code, event.reason);
            setIsConnected(false);
            onDisconnect?.();
        };
    }, [script, knowledgeCards, onConnect, onDisconnect, onError]);

    const startRecording = async () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        } else if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
        }
        
        const ctx = audioContextRef.current;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: {
                channelCount: 1,
                sampleRate: 16000
            } });
            streamRef.current = stream;

            const source = ctx.createMediaStreamSource(stream);
            // Buffer size 4096 gives ~0.25s latency at 16k
            const processor = ctx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                // Convert to PCM 16-bit
                const pcmData = floatTo16BitPCM(inputData);
                const base64 = arrayBufferToBase64(pcmData.buffer as ArrayBuffer);

                if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({
                        realtime_input: {
                            media_chunks: [{
                                mime_type: "audio/pcm",
                                data: base64
                            }]
                        }
                    }));
                }
            };

            source.connect(processor);
            processor.connect(ctx.destination); // ScriptProcessor needs connection to destination to work in some browsers
            setIsSpeaking(true);
        } catch (e) {
            console.error("Mic Error", e);
        }
    };

    const stopRecording = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        setIsSpeaking(false);
    };

    const disconnect = () => {
        stopRecording();
        if (wsRef.current) {
            wsRef.current.onclose = null; // Prevent callback from firing on manual disconnect
            wsRef.current.close();
            wsRef.current = null;
        }
        // Don't close AudioContext immediately as it might cut off playback, 
        // but for "End Session" it's fine.
        audioContextRef.current?.close();
        audioContextRef.current = null;
        setIsConnected(false);
    };

    return {
        connect,
        disconnect,
        startRecording,
        stopRecording,
        isConnected,
        isSpeaking
    };
}
