/**
 * 打印机动画 Demo 测试页面
 * 用于独立测试和查看 PrinterDeviceDemo 组件的效果
 * 
 * 使用方法：
 * 1. 在 App.tsx 中临时替换 PrinterDevice 为 PrinterDeviceDemo
 * 2. 或者创建独立路由访问此页面
 */

import { PrinterDeviceDemo } from './PrinterDeviceDemo';

export function PrinterDemoPage() {
  return (
    <div className="min-h-screen bg-neutral-100 flex items-center justify-center p-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">
            打印机动画 Demo 测试
          </h1>
          <p className="text-sm text-neutral-500">
            拟物化小票叠放动画效果预览
          </p>
        </div>
        
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <PrinterDeviceDemo />
        </div>
        
        <div className="mt-8 p-4 bg-neutral-50 rounded-lg">
          <h2 className="text-sm font-bold text-neutral-700 mb-2">优化特性：</h2>
          <ul className="text-xs text-neutral-600 space-y-1 list-disc list-inside">
            <li>3D 透视效果：纸张从打印机滑出时的自然卷曲（rotateX）</li>
            <li>随机旋转角度：每张小票有轻微随机旋转（-3° 到 +3°），模拟真实堆叠</li>
            <li>层次阴影系统：随着层数增加，阴影深度递增，增强立体感</li>
            <li>纸张纹理：使用 CSS 渐变模拟纸张质感</li>
            <li>边缘高光：模拟纸张厚度和反光效果</li>
            <li>渐进式滑出动画：使用 Spring 动画，带有轻微弹跳效果</li>
            <li>轻微水平偏移：模拟真实堆叠的不对齐效果</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

