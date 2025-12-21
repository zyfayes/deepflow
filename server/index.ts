import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import * as googleTTS from 'google-tts-api';
import axios from 'axios';
import { promptManager } from './prompts/index.js';
import { config } from './config.js';

import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { setupLiveSession } from './live-session.js';

const app = express();
const port = config.port;

// Create HTTP server
const server = createServer(app);
// Create WebSocket server
const wss = new WebSocketServer({ server });

setupLiveSession(wss);

// Configure CORS
app.use(cors());
app.use(express.json());

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Initialize Gemini
// Config loaded from config.ts
const apiKey = config.geminiApiKey;

const genAI = new GoogleGenerativeAI(apiKey || '');
const fileManager = new GoogleAIFileManager(apiKey || '');
const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

// Helper to wait for file to be processed
async function waitForFileActive(name: string) {
  let file = await fileManager.getFile(name);
  while (file.state === "PROCESSING") {
    process.stdout.write(".");
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(name);
  }
  if (file.state !== "ACTIVE") {
    throw new Error(`File ${file.name} failed to process`);
  }
  return file;
}

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'DeepFlow Server is running' });
});

// TTS Endpoint
app.post('/api/tts', async (req, res): Promise<any> => {
    const { text } = req.body;
    if (!text) {
        return res.status(400).json({ error: "Text is required" });
    }
    try {
        const urls = googleTTS.getAllAudioUrls(text, {
            lang: 'zh-CN',
            slow: false,
            host: 'https://translate.google.com',
        });
        res.json({ urls });
    } catch (error: any) {
        console.error("TTS Error:", error);
        res.status(500).json({ error: error.message || "TTS failed" });
    }
});

// Audio Proxy Endpoint
app.get('/api/proxy-audio', async (req, res): Promise<any> => {
    const { url } = req.query;
    if (!url || typeof url !== 'string') {
        return res.status(400).send("Missing url parameter");
    }

    try {
        const response = await axios({
            method: 'get',
            url: url,
            responseType: 'stream'
        });

        res.set('Content-Type', 'audio/mpeg');
        response.data.pipe(res);
    } catch (error: any) {
        console.error("Proxy Error:", error.message);
        res.status(500).send("Failed to fetch audio");
    }
});

// Analyze endpoint
app.post('/api/analyze', upload.array('files'), async (req, res): Promise<any> => {
  if (!apiKey) {
    return res.status(500).json({ error: "Server API Key not configured" });
  }

  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`Received ${files.length} files for analysis...`);
    const uploadResponses = [];

    // 1. Upload files to Gemini
    for (const file of files) {
      console.log(`Uploading ${file.originalname} (${file.mimetype})...`);
      
      const uploadResponse = await fileManager.uploadFile(file.path, {
        mimeType: file.mimetype,
        displayName: file.originalname,
      });
      
      console.log(`Uploaded ${file.originalname} as ${uploadResponse.file.name}`);
      uploadResponses.push(uploadResponse);

      // Clean up local file immediately after upload
      fs.unlinkSync(file.path);
    }

    // 2. Wait for processing
    console.log("Waiting for files to be processed...");
    for (const response of uploadResponses) {
      await waitForFileActive(response.file.name);
    }
    console.log("All files ready.");

    // 3. Generate Content
    const fileParts = uploadResponses.map(response => ({
      fileData: {
        mimeType: response.file.mimeType,
        fileUri: response.file.uri,
      },
    }));

    // Calculate context for prompt selection
    const totalSize = files.reduce((acc, file) => acc + file.size, 0);
    const types = [...new Set(files.map(file => file.mimetype))];
    
    const fileStats = {
        totalSize,
        fileCount: files.length,
        types
    };

    let preferences;
    try {
        if (req.body.preferences) {
            preferences = JSON.parse(req.body.preferences);
            console.log("Using user preferences:", preferences);
        }
    } catch (e) {
        console.warn("Failed to parse preferences:", e);
    }

    const promptTemplate = promptManager.getBestMatch({
        fileStats,
        preferences
    });

    console.log(`Selected prompt template: ${promptTemplate.name} (${promptTemplate.id})`);

    const prompt = promptTemplate.generate({
        fileStats,
        preferences
    });

    console.log("Generating content...");
    const result = await model.generateContent([
      prompt,
      ...fileParts
    ]);

    const responseText = result.response.text();
    console.log("Generation complete.");
    
    // Clean up: Delete files from Gemini to save storage (optional, but good practice)
    // for (const response of uploadResponses) {
    //   await fileManager.deleteFile(response.file.name);
    // }

    // Parse JSON safely
    let parsedData;
    try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            parsedData = JSON.parse(jsonMatch[0]);
        } else {
            parsedData = { raw: responseText };
        }
    } catch (e) {
        parsedData = { raw: responseText, error: "Failed to parse JSON" };
    }

    res.json(parsedData);

  } catch (error: any) {
    console.error("Error processing request:", error);
    res.status(500).json({ error: error.message || "Internal Server Error" });
  }
});

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`API Key configured: ${!!apiKey}`);
});
