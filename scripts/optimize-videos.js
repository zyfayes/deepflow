#!/usr/bin/env node

/**
 * 视频优化脚本
 * 用于压缩 public/assets/backgrounds/ 目录中的 MP4 视频文件
 * 
 * 使用方法：
 *   node scripts/optimize-videos.js
 * 
 * 要求：需要安装 ffmpeg
 *   macOS: brew install ffmpeg
 *   Ubuntu: sudo apt-get install ffmpeg
 *   Windows: 从 https://ffmpeg.org/download.html 下载
 */

import { spawn } from 'child_process';
import { existsSync, statSync, copyFileSync, mkdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');
const backgroundsDir = join(projectRoot, 'public', 'assets', 'backgrounds');

// 检查 ffmpeg 是否安装
function checkFFmpeg() {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn('ffmpeg', ['-version'], { stdio: 'ignore' });
    ffmpeg.on('close', (code) => {
      if (code === 0) {
        resolve(true);
      } else {
        console.error('❌ 错误：未找到 ffmpeg，请先安装：');
        console.error('   macOS: brew install ffmpeg');
        console.error('   Ubuntu: sudo apt-get install ffmpeg');
        console.error('   Windows: 从 https://ffmpeg.org/download.html 下载');
        reject(new Error('ffmpeg not found'));
      }
    });
    ffmpeg.on('error', () => {
      console.error('❌ 错误：未找到 ffmpeg，请先安装：');
      console.error('   macOS: brew install ffmpeg');
      console.error('   Ubuntu: sudo apt-get install ffmpeg');
      console.error('   Windows: 从 https://ffmpeg.org/download.html 下载');
      reject(new Error('ffmpeg not found'));
    });
  });
}

// 获取文件大小（MB）
function getFileSizeMB(filePath) {
  const stats = statSync(filePath);
  return (stats.size / (1024 * 1024)).toFixed(2);
}

// 优化单个视频文件
function optimizeVideo(inputPath, outputPath, options = {}) {
  const {
    crf = 28,           // 质量因子（18-28，数值越大文件越小，质量越低）
    preset = 'medium',  // 编码预设（ultrafast, fast, medium, slow, slower）
    removeAudio = true, // 是否移除音频
    maxWidth = 1920,    // 最大宽度
    maxHeight = 1080,   // 最大高度
  } = options;

  console.log(`\n📹 正在优化: ${basename(inputPath)}`);
  const originalSize = getFileSizeMB(inputPath);
  console.log(`   原始大小: ${originalSize} MB`);

  return new Promise((resolve) => {
    // 构建 ffmpeg 参数
    const ffmpegArgs = [
      '-i', inputPath,
      '-c:v', 'libx264',           // 使用 H.264 编码
      '-crf', String(crf),         // 质量因子
      '-preset', preset,           // 编码预设
      '-pix_fmt', 'yuv420p',       // 像素格式（兼容性好）
      '-movflags', '+faststart',   // 优化网络播放
    ];

    // 如果需要调整分辨率
    if (maxWidth || maxHeight) {
      ffmpegArgs.push(
        '-vf', `scale='if(gt(iw,${maxWidth}),${maxWidth},iw)':'if(gt(ih,${maxHeight}),${maxHeight},ih)':force_original_aspect_ratio=decrease`
      );
    }

    // 处理音频
    if (removeAudio) {
      ffmpegArgs.push('-an');  // 移除音频
    } else {
      ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k');
    }

    // 输出文件（-y 覆盖输出文件）
    ffmpegArgs.push('-y', outputPath);

    console.log(`   正在编码...`);
    
    const ffmpeg = spawn('ffmpeg', ffmpegArgs, {
      stdio: ['ignore', 'pipe', 'pipe']
    });

    let errorOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      // ffmpeg 将进度信息输出到 stderr
      errorOutput += data.toString();
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) {
        const newSize = getFileSizeMB(outputPath);
        const reduction = ((1 - parseFloat(newSize) / parseFloat(originalSize)) * 100).toFixed(1);
        console.log(`   ✅ 优化完成: ${newSize} MB (减少 ${reduction}%)`);
        resolve({ success: true, originalSize, newSize, reduction });
      } else {
        console.error(`   ❌ 优化失败: ffmpeg 退出码 ${code}`);
        resolve({ success: false, error: `ffmpeg exited with code ${code}` });
      }
    });

    ffmpeg.on('error', (error) => {
      console.error(`   ❌ 优化失败: ${error.message}`);
      resolve({ success: false, error: error.message });
    });
  });
}

// 创建备份
function createBackup(filePath, backupDir) {
  if (!existsSync(backupDir)) {
    mkdirSync(backupDir, { recursive: true });
  }
  const backupPath = join(backupDir, basename(filePath));
  copyFileSync(filePath, backupPath);
  return backupPath;
}

// 主函数
async function main() {
  console.log('🎬 视频优化脚本');
  console.log('================\n');

  // 检查 ffmpeg
  try {
    await checkFFmpeg();
  } catch (error) {
    process.exit(1);
  }

  // 检查目录是否存在
  if (!existsSync(backgroundsDir)) {
    console.error(`❌ 错误：目录不存在: ${backgroundsDir}`);
    process.exit(1);
  }

  // 查找所有 MP4 文件
  const videoFiles = [
    join(backgroundsDir, 'city-night-snow.mp4'),
    join(backgroundsDir, 'library-warm.mp4'),
  ].filter(file => existsSync(file));

  if (videoFiles.length === 0) {
    console.log('⚠️  未找到视频文件');
    return;
  }

  console.log(`找到 ${videoFiles.length} 个视频文件\n`);

  // 优化选项
  const optimizeOptions = {
    crf: 28,              // 质量因子（可以调整：24-30 之间，数值越大文件越小）
    preset: 'medium',     // 编码预设（medium 是质量和速度的平衡）
    removeAudio: true,    // 移除音频（背景视频通常不需要音频）
    maxWidth: 1920,       // 最大宽度
    maxHeight: 1080,      // 最大高度
  };

  // 创建备份目录
  const backupDir = join(backgroundsDir, 'backup');
  console.log('💡 提示：将自动创建原始文件的备份');
  console.log('   优化参数：');
  console.log(`   - 质量因子 (CRF): ${optimizeOptions.crf}`);
  console.log(`   - 编码预设: ${optimizeOptions.preset}`);
  console.log(`   - 最大分辨率: ${optimizeOptions.maxWidth}x${optimizeOptions.maxHeight}`);
  console.log(`   - 移除音频: ${optimizeOptions.removeAudio ? '是' : '否'}\n`);

  // 创建备份
  console.log('📦 创建备份...');
  const backups = [];
  for (const videoPath of videoFiles) {
    const backupPath = createBackup(videoPath, backupDir);
    backups.push({ original: videoPath, backup: backupPath });
    console.log(`   ✅ ${basename(videoPath)} 已备份到 backup/`);
  }

  // 优化每个视频
  const results = [];
  for (const { original } of backups) {
    const result = await optimizeVideo(original, original, optimizeOptions);
    results.push({ file: basename(original), ...result });
  }

  // 显示总结
  console.log('\n📊 优化总结');
  console.log('==========');
  results.forEach(result => {
    if (result.success) {
      console.log(`${result.file}: ${result.originalSize} MB → ${result.newSize} MB (减少 ${result.reduction}%)`);
    } else {
      console.log(`${result.file}: ❌ 失败（可从 backup/ 目录恢复）`);
    }
  });

  const successfulResults = results.filter(r => r.success);
  if (successfulResults.length > 0) {
    const totalReduction = successfulResults
      .reduce((sum, r) => sum + parseFloat(r.reduction), 0) / successfulResults.length;
    console.log(`\n✨ 平均减少: ${totalReduction.toFixed(1)}%`);
  }

  console.log(`\n💾 备份文件保存在: ${backupDir}`);
  console.log('   如果优化结果不满意，可以从备份目录恢复原始文件');
}

// 运行脚本
main().catch(error => {
  console.error('❌ 发生错误:', error);
  process.exit(1);
});

