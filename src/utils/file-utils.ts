/**
 * 文件工具函数
 * 用于生成文件 hash 和 script hash
 */

/**
 * 基于文件名 + 大小 + 修改时间生成 hash
 */
export async function generateFileHash(file: File): Promise<string> {
  const data = `${file.name}_${file.size}_${file.lastModified}`;
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 基于 script 内容生成 hash（用于音频缓存）
 */
export async function generateScriptHash(script: Array<{speaker: string; text: string}>): Promise<string> {
  const content = JSON.stringify(script);
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * 生成缓存 key（用于 FlowItem）
 */
export function generateFlowItemCacheKey(fileHash: string, preset: string): string {
  return `flowitem_${fileHash}_${preset}`;
}

/**
 * 生成音频缓存 key
 */
export function generateAudioCacheKey(scriptHash: string, preset: string): string {
  return `audio_${scriptHash}_${preset}`;
}

