import type { VercelRequest, VercelResponse } from '@vercel/node';
import { IncomingForm, File as FormidableFile } from 'formidable';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';
import { promptManager } from './prompts/index.js';
import fs from 'fs';
import mammoth from 'mammoth';
import { createRequire } from 'module';
import os from 'os';
import path from 'path';

const require = createRequire(import.meta.url);
const WordExtractor = require('word-extractor');

// Helper to wait for file to be processed with timeout
async function waitForFileActive(fileManager: GoogleAIFileManager, name: string, timeoutMs: number = 30000) {
  const startTime = Date.now();
  let file = await fileManager.getFile(name);
  
  while (file.state === "PROCESSING") {
    // Check timeout
    if (Date.now() - startTime > timeoutMs) {
      throw new Error(`File ${file.name} processing timeout after ${timeoutMs}ms`);
    }
    
    // Wait before checking again
    await new Promise((resolve) => setTimeout(resolve, 2000));
    file = await fileManager.getFile(name);
  }
  
  if (file.state !== "ACTIVE") {
    throw new Error(`File ${file.name} failed to process. State: ${file.state}`);
  }
  
  return file;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestStartTime = Date.now();
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VUE_APP_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Server API Key not configured" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const fileManager = new GoogleAIFileManager(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-preview" });

  try {
    console.log(`[${new Date().toISOString()}] Request started`);
    // Parse form data
    const form = new IncomingForm({
      uploadDir: os.tmpdir(),
      keepExtensions: true,
      maxFileSize: 50 * 1024 * 1024, // 50MB
    });

    const [fields, files] = await form.parse(req);
    const fileArray: FormidableFile[] = Array.isArray(files.files) 
      ? files.files 
      : (files.files ? [files.files] : []);

    if (fileArray.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    console.log(`Received ${fileArray.length} files for analysis...`);
    const uploadResponses = [];

    // Process files
    for (const file of fileArray) {
      const filePath = file.filepath;
      const originalName = file.originalFilename || 'unknown';
      const mimetype = file.mimetype || 'application/octet-stream';

      console.log(`Processing ${originalName} (${mimetype})...`);

      // Handle Word Documents
      if (
        mimetype === 'application/msword' ||
        mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ) {
        try {
          let textContent = '';
          const isDocx = originalName.toLowerCase().endsWith('.docx') || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

          if (isDocx) {
            const result = await mammoth.extractRawText({ path: filePath });
            textContent = result.value;
          } else {
            const extractor = new WordExtractor();
            const extracted = await extractor.extract(filePath);
            textContent = extracted.getBody();
          }

          if (!textContent) {
            throw new Error('No text content extracted from document');
          }

          const txtPath = filePath + '.txt';
          fs.writeFileSync(txtPath, textContent);

          try {
            const uploadResponse = await fileManager.uploadFile(txtPath, {
              mimeType: 'text/plain',
              displayName: originalName + '.txt',
            });

            console.log(`Uploaded converted text for ${originalName}`);
            uploadResponses.push(uploadResponse);

            // Clean up
            fs.unlinkSync(txtPath);
            fs.unlinkSync(filePath);
            continue;
          } catch (uploadError: any) {
            if (fs.existsSync(txtPath)) fs.unlinkSync(txtPath);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            throw uploadError;
          }
        } catch (conversionError) {
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          throw new Error(`Failed to process Word document: ${originalName}`);
        }
      }

      // Standard upload
      try {
        const uploadResponse = await fileManager.uploadFile(filePath, {
          mimeType: mimetype,
          displayName: originalName,
        });

        console.log(`Uploaded ${originalName}`);
        uploadResponses.push(uploadResponse);
        fs.unlinkSync(filePath);
      } catch (uploadError: any) {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        const errorMessage = uploadError?.message || String(uploadError);
        if (errorMessage.includes('fetch failed') || errorMessage.includes('timeout')) {
          throw new Error(`无法连接到 Google API 服务器。请检查 API Key 是否有效。\n\n原始错误: ${errorMessage}`);
        }
        throw uploadError;
      }
    }

    // Wait for processing (with timeout to leave time for content generation)
    // Files are uploaded, now wait for Gemini to process them
    console.log("Waiting for files to be processed...");
    const processingTimeout = 25000; // 25 seconds max for processing (leave 35s for generation)
    
    for (const response of uploadResponses) {
      try {
        await waitForFileActive(fileManager, response.file.name, processingTimeout);
      } catch (timeoutError: any) {
        // Check current state - might be ready despite timeout
        const currentFile = await fileManager.getFile(response.file.name);
        if (currentFile.state === "ACTIVE") {
          console.log(`File ${response.file.name} is ready despite timeout warning`);
          continue;
        }
        // If still processing or failed, throw error
        throw new Error(`文件处理超时：${response.file.name} 仍在处理中（状态：${currentFile.state}）。\n\n建议：\n1. 使用较小的文件\n2. 稍后重试\n3. 检查网络连接`);
      }
    }
    console.log("All files ready.");

    // Generate content
    const fileParts = uploadResponses.map(response => ({
      fileData: {
        mimeType: response.file.mimeType,
        fileUri: response.file.uri,
      },
    }));

    const totalSize = fileArray.reduce((acc: number, file: FormidableFile) => {
      return acc + (file.size || 0);
    }, 0);
    const types = [...new Set(fileArray.map((file: FormidableFile) => file.mimetype || 'application/octet-stream'))];

    const fileStats = {
      totalSize,
      fileCount: fileArray.length,
      types
    };

    let preferences;
    try {
      const preferencesField = fields.preferences;
      const preferencesStr = Array.isArray(preferencesField) ? preferencesField[0] : preferencesField;
      if (preferencesStr && typeof preferencesStr === 'string') {
        preferences = JSON.parse(preferencesStr);
      }
    } catch (e) {
      console.warn("Failed to parse preferences:", e);
    }

    const promptTemplate = promptManager.getBestMatch({
      fileStats,
      preferences
    });

    const prompt = promptTemplate.generate({
      fileStats,
      preferences
    });

    // Generate content with retry mechanism
    // Files are already uploaded and processed, so we can retry generation without re-uploading
    console.log("Generating content...");
    const generationStartTime = Date.now();
    
    let result;
    let lastError: any = null;
    const maxRetries = 2; // Retry up to 2 times
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`Retrying content generation (attempt ${attempt + 1}/${maxRetries + 1})...`);
          // Wait a bit before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        result = await model.generateContent([prompt, ...fileParts]);
        const elapsed = Date.now() - generationStartTime;
        console.log(`Generation successful on attempt ${attempt + 1} (took ${Math.round(elapsed/1000)}s)`);
        break; // Success, exit retry loop
      } catch (error: any) {
        lastError = error;
        const elapsed = Date.now() - generationStartTime;
        console.warn(`Generation attempt ${attempt + 1} failed after ${Math.round(elapsed/1000)}s:`, error.message);
        
        // If this was the last attempt, throw the error
        if (attempt === maxRetries) {
          throw new Error(`内容生成失败（已重试 ${maxRetries} 次，总耗时 ${Math.round(elapsed/1000)}秒）。\n\n错误：${error.message}\n\n文件已上传并处理完成，可以稍后重试生成。`);
        }
        
        // Check if error is retryable (not a timeout from Vercel itself)
        if (error.message && (error.message.includes('504') || error.message.includes('Gateway Timeout'))) {
          // Vercel timeout - don't retry, throw immediately
          throw new Error(`请求超时（${Math.round(elapsed/1000)}秒）。文件已上传并处理完成，请稍后重试生成内容。`);
        }
      }
    }
    
    if (!result) {
      throw lastError || new Error('内容生成失败：未知错误');
    }
    
    const responseText = result.response.text();
    console.log("Generation complete.");

    // Parse JSON
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

    const totalTime = Date.now() - requestStartTime;
    console.log(`[${new Date().toISOString()}] Request completed in ${totalTime}ms`);
    res.json(parsedData);
  } catch (error: any) {
    const totalTime = Date.now() - requestStartTime;
    console.error(`[${new Date().toISOString()}] Error after ${totalTime}ms:`, error);
    console.error("Error stack:", error?.stack);
    
    // Provide more detailed error information
    let errorMessage = error?.message || String(error) || "Internal Server Error";
    
    // Check for timeout errors
    if (totalTime > 55000) {
      errorMessage = `请求超时（耗时 ${Math.round(totalTime/1000)}秒）。\n\nVercel Serverless Functions 最大执行时间为 60 秒。\n\n建议：\n1. 使用较小的文件（<10MB）\n2. 减少文件数量\n3. 稍后重试`;
    } else if (errorMessage.includes('promptManager') || errorMessage.includes('prompt')) {
      errorMessage = `配置错误：无法加载提示模板管理器。请检查 prompts 目录是否存在。\n\n原始错误: ${errorMessage}`;
    } else if (errorMessage.includes('GEMINI_API_KEY') || errorMessage.includes('API Key')) {
      errorMessage = `配置错误：Gemini API Key 未配置。请在 Vercel 环境变量中设置 GEMINI_API_KEY。\n\n原始错误: ${errorMessage}`;
    } else if (errorMessage.includes('fetch failed') || errorMessage.includes('timeout')) {
      errorMessage = `网络错误：无法连接到 Google API 服务器。\n\n原始错误: ${errorMessage}`;
    }
    
    res.status(500).json({ 
      error: errorMessage,
      elapsedTime: Math.round(totalTime/1000),
      details: process.env.NODE_ENV === 'development' ? error?.stack : undefined
    });
  }
}

