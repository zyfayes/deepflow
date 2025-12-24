import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getGeminiApiKey } from './config-helper.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return res.status(500).json({ error: "Server API Key not configured" });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  // Helper for retry logic
  const generateWithRetry = async (prompt: string, maxRetries = 3) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await model.generateContent(prompt);
      } catch (error: any) {
        const isRateLimit = error.status === 429 || 
                          error.message?.includes('429') || 
                          error.message?.includes('quota') ||
                          error.message?.includes('Too Many Requests');
        
        if (i < maxRetries - 1 && isRateLimit) {
          // Exponential backoff: 5s, 10s, 15s
          const delay = 5000 * (i + 1);
          console.log(`[Gemini] Rate limit hit (429). Retrying in ${delay/1000}s... (Attempt ${i + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }
    throw new Error('Max retries exceeded');
  };

  try {
    const { conversationHistory } = req.body;

    if (!conversationHistory || !Array.isArray(conversationHistory) || conversationHistory.length === 0) {
      return res.status(400).json({ error: "conversationHistory is required and must be a non-empty array" });
    }

    // 构建对话文本
    const conversationText = conversationHistory.map((entry: { source: string; text: string }) => {
      const speaker = entry.source === 'input' ? '用户' : 'AI';
      return `${speaker}: ${entry.text}`;
    }).join('\n');

    const prompt = `你是一位学习助手。请总结以下最近的对话内容，生成一张简洁的知识小票。

对话内容：
${conversationText}

要求：
1. 提取对话中的核心知识点或重要信息
2. 格式化为知识小票格式（title + content）
3. 内容简洁明了，适合小票显示（不超过200字）
4. 如果对话中没有明确的知识点，可以总结对话的主要话题或关键信息
5. 返回 JSON 格式：
{
  "title": "知识小票标题（简短，不超过20字）",
  "content": "内容总结（简洁，重点突出）",
  "tags": ["标签1", "标签2"]
}

请直接返回 JSON，不要包含其他文字。`;

    console.log("Generating conversation summary...");
    
    const result = await generateWithRetry(prompt);
    const response = await result.response;
    const text = response.text();

    // 解析 JSON 响应
    let summaryData: any;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        summaryData = JSON.parse(jsonMatch[0]);
      } else {
        summaryData = JSON.parse(text);
      }
    } catch (parseError) {
      console.error("Failed to parse summary response:", parseError);
      console.log("Raw response:", text);
      // 如果解析失败，创建一个默认的总结内容
      summaryData = {
        title: "对话总结",
        content: conversationHistory.length > 0 
          ? `最近的对话包含 ${conversationHistory.length} 轮交流，主要讨论了相关话题。`
          : "暂无总结内容",
        tags: ["对话", "总结"]
      };
    }

    // 确保返回格式正确
    if (!summaryData.title) {
      summaryData.title = "对话总结";
    }
    if (!summaryData.content) {
      summaryData.content = "暂无总结内容";
    }
    if (!summaryData.tags || !Array.isArray(summaryData.tags)) {
      summaryData.tags = ["对话", "总结"];
    }

    res.json({
      title: summaryData.title,
      content: summaryData.content,
      tags: summaryData.tags
    });

  } catch (error: any) {
    console.error("Conversation summary generation error:", error);
    res.status(500).json({ 
      error: error.message || "对话总结失败",
      details: error.toString()
    });
  }
}