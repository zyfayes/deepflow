# 脚本工具

## optimize-videos.js

视频优化脚本，用于压缩 `public/assets/backgrounds/` 目录中的 MP4 视频文件。

### 功能特性

- 🎬 自动压缩视频文件大小
- 📦 自动创建原始文件备份
- ⚙️ 可配置的优化参数
- 📊 显示优化前后的文件大小对比
- ✅ 移除音频轨道（背景视频通常不需要）
- 🖼️ 可选的分辨率限制

### 使用方法

#### 方法一：使用 npm 脚本（推荐）

```bash
npm run optimize-videos
```

#### 方法二：直接运行

```bash
node scripts/optimize-videos.js
```

### 前置要求

需要安装 [ffmpeg](https://ffmpeg.org/)：

**macOS:**
```bash
brew install ffmpeg
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ffmpeg
```

**Windows:**
从 [ffmpeg.org/download.html](https://ffmpeg.org/download.html) 下载并添加到 PATH

### 优化参数

脚本使用以下默认参数：

- **CRF (质量因子)**: 28
  - 范围：18-30
  - 数值越大，文件越小，质量越低
  - 28 是质量和文件大小的良好平衡

- **编码预设**: medium
  - 选项：ultrafast, fast, medium, slow, slower
  - medium 是速度和质量的良好平衡

- **最大分辨率**: 1920x1080
  - 如果视频超过此分辨率，会自动缩放

- **移除音频**: 是
  - 背景视频通常不需要音频轨道

### 自定义优化参数

如需修改优化参数，编辑 `scripts/optimize-videos.js` 文件中的 `optimizeOptions` 对象：

```javascript
const optimizeOptions = {
  crf: 28,              // 调整为 24-30 之间
  preset: 'medium',     // 可选: ultrafast, fast, medium, slow, slower
  removeAudio: true,    // true 或 false
  maxWidth: 1920,       // 最大宽度（像素）
  maxHeight: 1080,      // 最大高度（像素）
};
```

### 备份文件

脚本会自动在 `public/assets/backgrounds/backup/` 目录中创建原始文件的备份。

如果优化结果不满意，可以从备份目录恢复原始文件。

### 输出示例

```
🎬 视频优化脚本
================

找到 2 个视频文件

💡 提示：将自动创建原始文件的备份
   优化参数：
   - 质量因子 (CRF): 28
   - 编码预设: medium
   - 最大分辨率: 1920x1080
   - 移除音频: 是

📦 创建备份...
   ✅ city-night-snow.mp4 已备份到 backup/
   ✅ library-warm.mp4 已备份到 backup/

📹 正在优化: city-night-snow.mp4
   原始大小: 36.00 MB
   正在编码...
   ✅ 优化完成: 12.50 MB (减少 65.3%)

📹 正在优化: library-warm.mp4
   原始大小: 40.00 MB
   正在编码...
   ✅ 优化完成: 14.20 MB (减少 64.5%)

📊 优化总结
==========
city-night-snow.mp4: 36.00 MB → 12.50 MB (减少 65.3%)
library-warm.mp4: 40.00 MB → 14.20 MB (减少 64.5%)

✨ 平均减少: 64.9%

💾 备份文件保存在: public/assets/backgrounds/backup
   如果优化结果不满意，可以从备份目录恢复原始文件
```

