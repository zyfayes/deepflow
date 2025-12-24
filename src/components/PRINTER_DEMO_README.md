# 打印机动画 Demo 使用说明

## 文件说明

- `PrinterDeviceDemo.tsx` - 优化后的打印机组件 Demo，包含拟物化动画效果
- `PrinterDemoPage.tsx` - 独立的测试页面，用于查看 Demo 效果

## 主要优化特性

### 1. 3D 透视效果
- 使用 `perspective` 和 `rotateX` 模拟纸张从打印机滑出时的自然卷曲
- 初始状态：纸张略微向后倾斜（rotateX: -20°）
- 最终状态：纸张平铺（rotateX: 0°）

### 2. 随机旋转角度
- 每张小票有轻微的随机旋转（-2.5° 到 +2.5°）
- 使用伪随机算法确保每次渲染时角度一致
- 模拟真实纸张堆叠的自然不规整

### 3. 层次阴影系统
- 多层阴影叠加，模拟真实纸张堆叠
- 阴影深度随层数递增（最多 1.4）
- 包含方向性阴影（根据水平偏移调整）

### 4. 纸张纹理和质感
- 使用 CSS 渐变模拟纸张的点状纹理
- 添加顶部高光渐变，模拟光线反射
- 纸张边缘有细微的高光和内阴影

### 5. 渐进式滑出动画
- 使用 Framer Motion 的 Spring 动画
- 带有轻微的弹跳效果（bounce: 0.2）
- 从打印机出口平滑滑出

### 6. 改进的堆叠算法
- 垂直间距：140px（可配置）
- 轻微的水平偏移（-6px 到 +6px）模拟不对齐
- 间距轻微压缩，模拟重力挤压效果

## 使用方法

### 方法 1：使用独立测试页面

在 `App.tsx` 中临时替换：

```tsx
import { PrinterDemoPage } from './components/PrinterDemoPage';

// 在 App 组件中返回
return <PrinterDemoPage />;
```

### 方法 2：替换原有组件

在 `App.tsx` 中临时替换 PrinterDevice：

```tsx
import { PrinterDeviceDemo } from './components/PrinterDeviceDemo';

// 在 HardwareCard 中使用
<PrinterDeviceDemo printedContents={printedContents} transcription={transcription} />
```

### 方法 3：独立测试（自动演示）

```tsx
import { PrinterDeviceDemo } from './components/PrinterDeviceDemo';

// 不传入 printedContents，组件会使用内置测试数据自动演示
<PrinterDeviceDemo />
```

## 技术实现细节

### 动画参数
- **Spring 配置**：
  - stiffness: 70（弹性系数）
  - damping: 18（阻尼系数）
  - mass: 0.9（质量）
  - bounce: 0.2（弹跳效果）

### 3D 变换
- 使用 `transformStyle: 'preserve-3d'` 保持 3D 变换
- 父容器设置 `perspective: 1000px` 建立 3D 空间

### 阴影计算
```typescript
boxShadow: `
  ${horizontalOffset * 0.4}px ${verticalOffset * 0.25}px ${shadowDepth * 10}px rgba(0, 0, 0, ${0.12 + shadowDepth * 0.08}),
  0 1px 3px rgba(0, 0, 0, 0.08),
  inset 0 1px 0 rgba(255, 255, 255, 0.95),
  inset 0 -1px 0 rgba(0, 0, 0, 0.02)
`
```

### 纸张纹理
```css
backgroundImage: `
  radial-gradient(circle at 1px 1px, rgba(0,0,0,0.015) 1px, transparent 0),
  linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 30%, rgba(0,0,0,0.015) 100%)
`;
backgroundSize: '8px 8px, 100% 100%';
```

## 与原版本的对比

| 特性 | 原版本 | Demo 版本 |
|------|--------|-----------|
| 垂直堆叠 | 固定 160px 间距 | 140px，带压缩效果 |
| 旋转角度 | 0°（无旋转） | -2.5° 到 +2.5° |
| 水平偏移 | 0px | -6px 到 +6px |
| 3D 效果 | 无 | 有（perspective + rotateX） |
| 阴影 | 单一阴影 | 多层阴影，深度递增 |
| 纸张纹理 | 纯色背景 | 渐变纹理 + 高光 |
| 滑出动画 | 简单 spring | 增强 spring + 卷曲效果 |

## 下一步：Merge 到主干

当 Demo 效果满意后，可以：

1. 对比 `PrinterDevice.tsx` 和 `PrinterDeviceDemo.tsx` 的差异
2. 将优化后的动画代码应用到 `PrinterDevice.tsx`
3. 保留接口兼容性，确保现有功能不受影响
4. 测试真实场景下的打印效果

## 注意事项

- Demo 组件支持外部传入 `printedContents`，也可以独立运行（使用内置测试数据）
- 动画性能良好，适合实际使用
- 所有样式使用 Tailwind CSS + 内联样式，便于调整

