# Vercel 部署检查清单

## ✅ 已完成的配置

### 1. API 路由（Serverless Functions）
- ✅ `/api/health.ts` - 健康检查端点
- ✅ `/api/tts.ts` - 文本转语音
- ✅ `/api/proxy-audio.ts` - 音频代理
- ✅ `/api/analyze.ts` - 文件分析和内容生成（主要功能）

### 2. 配置文件
- ✅ `vercel.json` - Vercel 部署配置
- ✅ `.vercelignore` - 排除不需要的文件
- ✅ `package.json` - 已添加所有必要依赖

### 3. 前端配置
- ✅ `src/utils/api-config.ts` - 自动检测环境，生产环境使用相对路径
- ✅ 所有 API 调用已更新为使用 `getApiUrl()` 函数

### 4. 依赖安装
- ✅ `@vercel/node` - Vercel Serverless Functions 支持
- ✅ `formidable` - 文件上传处理
- ✅ `@google/generative-ai` - Gemini API
- ✅ `mammoth`, `word-extractor` - Word 文档处理
- ✅ `google-tts-api`, `axios` - TTS 和 HTTP 请求

## 📝 部署前检查

### Vercel 环境变量
确保在 Vercel 项目设置中配置：
```
GEMINI_API_KEY=your_api_key_here
```

### Git 提交
```bash
git add .
git commit -m "Configure Vercel deployment with Serverless Functions"
git push
```

### Vercel 部署设置
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 🚀 部署后验证

1. **健康检查**
   ```
   https://your-domain.vercel.app/api/health
   ```
   应该返回：`{"status":"ok","message":"DeepFlow Server is running"}`

2. **前端应用**
   ```
   https://your-domain.vercel.app
   ```
   应该正常加载前端界面

3. **文件上传测试**
   - 上传一个文件
   - 检查是否能正常分析和生成内容

## ⚠️ 已知限制

1. **WebSocket 不支持**
   - Vercel Serverless Functions 不支持 WebSocket
   - Live Session 功能需要单独部署 WebSocket 服务器
   - 当前代码中的 WebSocket 连接在生产环境会失败

2. **执行时间限制**
   - 最大执行时间：60秒（已在 vercel.json 中配置）
   - 大文件处理可能需要更长时间

3. **文件大小限制**
   - 当前限制：50MB（可在 `api/analyze.ts` 中调整）
   - Vercel 限制：取决于你的计划

## 🔧 如果遇到问题

### API 404 错误
- 检查 `vercel.json` 中的路由配置
- 确认 API 文件在 `api/` 目录下
- 检查 Vercel 部署日志

### API 500 错误
- 检查 Vercel 函数日志
- 确认 `GEMINI_API_KEY` 环境变量已配置
- 检查文件格式和大小

### 文件上传失败
- 检查文件大小（最大 50MB）
- 检查文件格式是否支持
- 查看 Vercel 函数日志获取详细错误

## 📚 相关文档

- `VERCEL_DEPLOYMENT.md` - 详细部署指南
- `DEPLOYMENT.md` - 通用部署说明

