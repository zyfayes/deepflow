import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generateTaskId,
  createTask,
  getTask,
  type TTSTask
} from './tts-task-manager.js';
import { processTTSAsync } from './tts-processor.js';

/**
 * TTS API 端点
 * 支持异步任务模式，避免 Vercel 60 秒超时限制
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 处理 CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET: 查询任务状态
  if (req.method === 'GET') {
    const { taskId } = req.query;
    
    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'taskId is required' });
    }

    const task = getTask(taskId);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    return res.json({
      taskId: task.taskId,
      status: task.status,
      progress: task.progress,
      result: task.result,
      error: task.error
    });
  }

  // POST: 创建任务
  if (req.method === 'POST') {
    // Parse body - Vercel may not auto-parse JSON
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON body" });
      }
    }

    const { script, preset, contentType } = body || {};

    // 验证输入
    if (!script || !Array.isArray(script) || script.length === 0) {
      return res.status(400).json({ error: "Script is required and must be a non-empty array" });
    }

    // 验证 script 格式
    const isValidScript = script.every((item: any) => 
      item && typeof item.speaker === 'string' && typeof item.text === 'string'
    );
    if (!isValidScript) {
      return res.status(400).json({ error: "Invalid script format. Each item must have 'speaker' and 'text' fields" });
    }

    try {
      // 创建任务
      const taskId = generateTaskId();
      createTask(taskId);

      // 异步处理（不等待完成）
      processTTSAsync(taskId, script, preset || '', contentType || '').catch((err) => {
        console.error(`Task ${taskId} processing error:`, err);
      });

      // 立即返回任务 ID
      return res.json({
        taskId,
        status: 'pending',
        message: 'Task created, use GET /api/tts?taskId=' + taskId + ' to check status'
      });
    } catch (error: any) {
      console.error("TTS Task Creation Error:", error);
      return res.status(500).json({ error: error.message || "Failed to create TTS task" });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

