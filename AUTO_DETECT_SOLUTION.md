# 朋友圈截图自动定位技术方案

## 问题
当前方案使用固定比例坐标（如 `width * 0.28`），无法适应不同尺寸和布局的截图。

## 解决方案

### 方案1: OCR文字识别定位（推荐）⭐
**原理：** 使用OCR识别截图中的时间文字（如"12天前"），以此为锚点定位点赞和评论区域。

**优点：**
- 准确度高，适应性强
- 能处理各种尺寸和布局
- 可以精确定位到时间文字位置

**技术栈：**
- Tesseract.js - 开源OCR库，支持中文识别
- PaddleOCR Node.js - 百度开源OCR，中文识别效果更好
- Google Vision API / 百度OCR API - 云端OCR服务

**实现步骤：**
```javascript
1. 使用OCR扫描整个截图
2. 识别时间文字（匹配"X分钟前"、"X小时前"、"X天前"等模式）
3. 获取时间文字的精确坐标
4. 基于时间坐标计算点赞区域（时间下方约50-80px）
5. 基于点赞区域计算评论区域（点赞下方约40-60px）
```

**代码示例：**
```javascript
const Tesseract = require('tesseract.js');

async function detectTimePosition(imageBuffer) {
  const { data: { words } } = await Tesseract.recognize(imageBuffer, 'chi_sim');

  // 匹配时间文字
  const timePattern = /(\d+)(分钟|小时|天)前|刚刚/;
  const timeWord = words.find(w => timePattern.test(w.text));

  if (timeWord) {
    return {
      x: timeWord.bbox.x0,
      y: timeWord.bbox.y0,
      width: timeWord.bbox.x1 - timeWord.bbox.x0,
      height: timeWord.bbox.y1 - timeWord.bbox.y0
    };
  }

  return null;
}
```

---

### 方案2: 图像模板匹配
**原理：** 使用图像匹配算法查找特定UI元素（如点赞图标❤️）的位置。

**优点：**
- 无需OCR，处理速度快
- 适合识别图标和固定UI元素

**缺点：**
- 需要准备模板图片
- 对截图质量要求较高

**技术栈：**
- OpenCV.js - 计算机视觉库
- @techstark/opencv-js - Node.js OpenCV封装

**实现步骤：**
```javascript
const cv = require('@techstark/opencv-js');

async function findHeartIcon(screenshot) {
  // 加载点赞图标模板
  const template = await cv.imread('heart_template.png');
  const source = await cv.imread(screenshot);

  // 模板匹配
  const result = new cv.Mat();
  cv.matchTemplate(source, template, result, cv.TM_CCOEFF_NORMED);

  // 找到最佳匹配位置
  const minMax = cv.minMaxLoc(result);

  return {
    x: minMax.maxLoc.x,
    y: minMax.maxLoc.y
  };
}
```

---

### 方案3: 颜色和区域检测
**原理：** 识别特定颜色区域（灰色背景的点赞评论区域）来定位。

**优点：**
- 实现简单
- 处理速度快

**缺点：**
- 准确度较低
- 容易受主题颜色影响

**实现：**
```javascript
const sharp = require('sharp');

async function detectGrayRegion(imageBuffer) {
  const image = sharp(imageBuffer);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });

  // 扫描灰色区域（RGB接近 #F7F7F7）
  const grayThreshold = { r: [240, 250], g: [240, 250], b: [240, 250] };
  const regions = [];

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 3;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      if (isGray(r, g, b, grayThreshold)) {
        regions.push({ x, y });
      }
    }
  }

  return findLargestRegion(regions);
}
```

---

### 方案4: 深度学习目标检测（高级方案）
**原理：** 训练神经网络模型识别朋友圈UI元素。

**优点：**
- 最高准确度
- 能处理各种复杂情况
- 可识别多种UI元素

**缺点：**
- 需要训练数据集
- 实现复杂度高
- 需要较多计算资源

**技术栈：**
- TensorFlow.js
- YOLO / SSD 目标检测模型

---

### 方案5: 混合方案（推荐用于生产环境）⭐⭐
**结合多种技术提高准确率：**

```javascript
async function autoDetectLayout(imageBuffer) {
  try {
    // 1. 首先尝试OCR识别时间
    const timePos = await detectTimeByOCR(imageBuffer);
    if (timePos) return calculateLayoutFromTime(timePos);

    // 2. OCR失败则尝试图标匹配
    const iconPos = await detectHeartIcon(imageBuffer);
    if (iconPos) return calculateLayoutFromIcon(iconPos);

    // 3. 都失败则使用颜色区域检测
    const grayRegion = await detectGrayRegion(imageBuffer);
    if (grayRegion) return calculateLayoutFromRegion(grayRegion);

    // 4. 最后使用默认比例（兜底方案）
    return getDefaultLayout(width, height);
  } catch (error) {
    console.error('自动检测失败，使用默认布局', error);
    return getDefaultLayout(width, height);
  }
}
```

---

## 推荐实施方案

### 阶段1: 快速实现（1-2天）
使用 **Tesseract.js OCR** + 默认布局兜底
- 安装简单，无需额外依赖
- 中文识别效果可接受
- 失败时自动降级到默认布局

### 阶段2: 优化提升（3-5天）
添加 **颜色区域检测** 作为辅助
- 提高识别成功率
- 处理OCR失败的情况

### 阶段3: 完善增强（1-2周）
引入 **PaddleOCR** 提升中文识别准确度
- 更好的中文识别效果
- 支持更多字体和样式

---

## 具体实现代码（OCR方案）

```javascript
const Tesseract = require('tesseract.js');

class SmartLayoutDetector {
  async detectLayout(imageBuffer, imageWidth, imageHeight) {
    try {
      // OCR识别
      const timePosition = await this.detectTimeByOCR(imageBuffer);

      if (timePosition) {
        return this.calculateLayout(timePosition, imageWidth, imageHeight);
      }
    } catch (error) {
      console.warn('OCR检测失败，使用默认布局', error);
    }

    // 兜底：使用默认布局
    return this.getDefaultLayout(imageWidth, imageHeight);
  }

  async detectTimeByOCR(imageBuffer) {
    const { data: { words } } = await Tesseract.recognize(imageBuffer, 'chi_sim');

    // 匹配时间模式
    const timePattern = /(\d+)(秒|分钟|小时|天)前|刚刚|\d{4}年\d{1,2}月\d{1,2}日/;

    for (const word of words) {
      if (timePattern.test(word.text)) {
        return {
          x: word.bbox.x0,
          y: (word.bbox.y0 + word.bbox.y1) / 2,
          width: word.bbox.x1 - word.bbox.x0,
          height: word.bbox.y1 - word.bbox.y0
        };
      }
    }

    return null;
  }

  calculateLayout(timePosition, width, height) {
    return {
      time: {
        x: timePosition.x,
        y: timePosition.y,
        fontSize: Math.max(24, Math.floor(timePosition.height * 0.8))
      },
      likes: {
        x: timePosition.x - width * 0.15,
        y: timePosition.y + 60,
        width: width * 0.85,
        height: 70
      },
      comments: {
        x: timePosition.x - width * 0.15,
        startY: timePosition.y + 140,
        width: width * 0.85,
        lineHeight: 55
      }
    };
  }

  getDefaultLayout(width, height) {
    // 原有的默认布局逻辑
    return {
      time: { x: width * 0.28, y: height * 0.535 },
      likes: { x: width * 0.08, y: height * 0.60 },
      comments: { x: width * 0.08, startY: height * 0.67 }
    };
  }
}
```

---

## 所需依赖

```json
{
  "dependencies": {
    "tesseract.js": "^4.1.4",           // OCR文字识别
    "sharp": "^0.33.0",                  // 图像处理（已有）
    "canvas": "^2.11.2"                  // Canvas绘图（已有）
  },
  "optionalDependencies": {
    "@techstark/opencv-js": "^4.9.0",   // OpenCV（可选）
    "paddleocr-node": "^1.0.0"          // PaddleOCR（可选）
  }
}
```

---

## 总结

**最佳方案：** OCR文字识别 + 默认布局兜底

**理由：**
1. 实现难度适中
2. 准确度高（90%+）
3. 适应性强，支持各种尺寸
4. 有降级方案保证可用性
5. 无需训练数据和模型

**成本：**
- 开发时间：2-3天
- 额外依赖：tesseract.js
- 处理时间：增加1-2秒/图片
