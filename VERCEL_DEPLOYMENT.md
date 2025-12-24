# Vercel 部署配置指南

## ✅ 已完成的配置

1. **创建了 Vercel Serverless Functions API 路由**
   - `/api/health.ts` - 健康检查
   - `/api/tts.ts` - 文本转语音
   - `/api/proxy-audio.ts` - 音频代理
   - `/api/analyze.ts` - 文件分析和内容生成

2. **配置了 vercel.json**
   - API 路由重写规则
   - 前端静态文件服务
   - Serverless Functions 超时设置（60秒）

3. **更新了依赖**
   - 所有必要的依赖已添加到根目录 `package.json`
   - 包括 `@google/generative-ai`, `formidable`, `mammoth` 等

4. **前端 API 配置**
   - 生产环境自动使用相对路径（同域名）
   - 开发环境使用 `localhost:3000`

## 📋 Vercel 环境变量配置

在 Vercel 项目设置中配置以下环境变量：

### 必需的环境变量：
```
GEMINI_API_KEY=your_gemini_api_key_here
```

### 可选的环境变量：
#### ListenHub / MarsWave（用于更高质量 TTS，未配置则自动 fallback 到 Google TTS）
```
LISTENHUB_API_KEY=your_listenhub_api_key_here
# 或者（兼容旧命名）
MARSWAVE_API_KEY=your_listenhub_api_key_here
```

```
VITE_API_BASE_URL=  # 留空，使用相对路径（推荐）
VITE_WS_URL=        # WebSocket URL（如果需要）
```

## 🚀 部署步骤

1. **推送代码到 Git 仓库**
   ```bash
   git add .
   git commit -m "Configure Vercel deployment"
   git push
   ```

2. **在 Vercel 中部署**
   - Vercel 会自动检测项目
   - 确保构建命令：`npm run build`
   - 确保输出目录：`dist`

3. **配置环境变量**
   - 在 Vercel 项目设置中添加 `GEMINI_API_KEY`
   - 重新部署以应用环境变量

## 🔍 验证部署

部署成功后，访问以下 URL 验证：

- 健康检查：`https://your-domain.vercel.app/api/health`
- 前端应用：`https://your-domain.vercel.app`

## ⚠️ 注意事项

1. **文件上传限制**
   - Vercel Serverless Functions 最大执行时间：60秒
   - 文件大小限制：50MB（可在 `api/analyze.ts` 中调整）

2. **临时文件**
   - 文件上传到 `/tmp` 目录（Vercel 提供的临时存储）
   - 处理完成后会自动清理

3. **WebSocket 支持**
   - Vercel Serverless Functions 不支持 WebSocket
   - Live Session 功能需要单独部署 WebSocket 服务器

## 🐛 故障排查

### API 返回 404
- 检查 `vercel.json` 配置是否正确
- 确认 API 路由文件在 `api/` 目录下

### API 返回 500
- 检查 Vercel 函数日志
- 确认 `GEMINI_API_KEY` 环境变量已配置
- 检查文件大小是否超过限制

### 文件上传失败
- 检查文件大小（最大 50MB）
- 检查文件格式是否支持
- 查看 Vercel 函数日志获取详细错误
