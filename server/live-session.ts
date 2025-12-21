import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { config } from './config.js';

const GEMINI_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent';

export function setupLiveSession(wss: any) {
    wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        console.log('Client connected to Live Session');

        const apiKey = config.geminiApiKey;
        if (!apiKey) {
            console.error('API Key missing');
            ws.close(1008, 'API Key missing');
            return;
        }

        const targetUrl = `${GEMINI_URL}?key=${apiKey}`;
        console.log('Connecting to Gemini:', GEMINI_URL);
        const geminiWs = new WebSocket(targetUrl);
        
        const messageQueue: Buffer[] = [];
        let isGeminiOpen = false;

        geminiWs.on('open', () => {
            console.log('Connected to Gemini Live API');
            isGeminiOpen = true;
            // Flush queue
            while (messageQueue.length > 0) {
                const msg = messageQueue.shift();
                if (msg) geminiWs.send(msg);
            }
        });

        geminiWs.on('message', (data: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(data);
            }
        });

        geminiWs.on('error', (err) => {
            console.error('Gemini WebSocket Error:', err);
            ws.close(1011, 'Gemini Error');
        });

        geminiWs.on('close', (code, reason) => {
            console.log('Gemini Connection Closed:', code, reason.toString());
            ws.close();
        });

        ws.on('message', (data: Buffer) => {
            if (isGeminiOpen) {
                geminiWs.send(data);
            } else {
                console.log('Buffering message for Gemini...');
                messageQueue.push(data);
            }
        });

        ws.on('close', () => {
            console.log('Client Connection Closed');
            if (geminiWs.readyState === WebSocket.OPEN) {
                geminiWs.close();
            }
        });

        ws.on('error', (err) => {
            console.error('Client WebSocket Error:', err);
            if (geminiWs.readyState === WebSocket.OPEN) {
                geminiWs.close();
            }
        });
    });
}
