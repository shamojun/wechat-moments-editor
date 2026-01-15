const sharp = require('sharp');

/**
 * 自适应布局检测器 - 基于图像分析，不依赖OCR
 * 通过分析像素颜色、灰色背景区域来定位点赞和评论位置
 */
class AdaptiveLayoutDetector {
  constructor() {
    // 微信朋友圈灰色背景色值范围 (RGB)
    this.grayBgColor = {
      r: { min: 240, max: 252 },
      g: { min: 240, max: 252 },
      b: { min: 240, max: 252 }
    };

    // 常见手机屏幕尺寸配置
    this.knownLayouts = [
      // iPhone 系列
      { width: 1170, height: 2532, name: 'iPhone 13 Pro', scale: 1.0 },
      { width: 1125, height: 2436, name: 'iPhone X/XS', scale: 1.0 },
      { width: 828, height: 1792, name: 'iPhone 11/XR', scale: 1.0 },
      { width: 1080, height: 2340, name: 'iPhone 12/13', scale: 1.0 },

      // Android 主流尺寸
      { width: 1080, height: 2400, name: 'Android 2400', scale: 1.0 },
      { width: 1080, height: 2340, name: 'Android 2340', scale: 1.0 },
      { width: 1080, height: 2280, name: 'Android 2280', scale: 1.0 },
      { width: 1440, height: 3200, name: 'Android 2K', scale: 1.333 },
      { width: 720, height: 1600, name: 'Android 720p', scale: 0.667 },
      { width: 1080, height: 1920, name: 'Android Full HD', scale: 1.0 }
    ];
  }

  /**
   * 主检测方法
   */
  async detectLayout(imageBuffer, imageWidth, imageHeight, screenshotType) {
    try {
      console.log(`🔍 开始自适应布局检测: ${imageWidth}x${imageHeight}, 类型: ${screenshotType}`);

      // 方案1: 匹配已知设备尺寸
      const knownLayout = this.matchKnownDevice(imageWidth, imageHeight, screenshotType);
      if (knownLayout) {
        console.log(`✅ 匹配到已知设备: ${knownLayout.deviceName}`);
        return knownLayout.layout;
      }

      // 方案2: 分析灰色背景区域
      const grayRegion = await this.detectGrayRegion(imageBuffer, imageWidth, imageHeight);
      if (grayRegion && grayRegion.found) {
        console.log(`✅ 检测到灰色背景区域: y=${grayRegion.y}, height=${grayRegion.height}`);
        return this.calculateLayoutFromGrayRegion(grayRegion, imageWidth, imageHeight, screenshotType);
      }

      // 方案3: 基于比例的智能估算
      console.log('📐 使用智能比例估算');
      return this.calculateProportionalLayout(imageWidth, imageHeight, screenshotType);

    } catch (error) {
      console.warn('⚠️ 自适应检测失败，使用默认布局:', error.message);
      return this.getDefaultLayout(imageWidth, imageHeight, screenshotType);
    }
  }

  /**
   * 匹配已知设备尺寸
   */
  matchKnownDevice(width, height, screenshotType) {
    // 精确匹配
    let matched = this.knownLayouts.find(
      layout => layout.width === width && layout.height === height
    );

    // 如果没有精确匹配，尝试相近尺寸（±50px容差）
    if (!matched) {
      matched = this.knownLayouts.find(layout =>
        Math.abs(layout.width - width) <= 50 &&
        Math.abs(layout.height - height) <= 50
      );
    }

    if (matched) {
      return {
        deviceName: matched.name,
        layout: this.getLayoutForDevice(width, height, matched.scale, screenshotType)
      };
    }

    return null;
  }

  /**
   * 为已知设备生成布局
   */
  getLayoutForDevice(width, height, scale, screenshotType) {
    const isDetail = screenshotType === 'detail';

    if (isDetail) {
      // 详情页布局 - 基于设备缩放比例调整
      return {
        time: {
          x: width * 0.28,
          y: height * 0.535,
          fontSize: Math.round(28 * scale),
          clearWidth: Math.round(300 * scale),
          clearHeight: Math.round(45 * scale)
        },
        likes: {
          x: width * 0.08,
          y: height * 0.60,
          width: width * 0.86,
          height: Math.round(70 * scale),
          fontSize: Math.round(28 * scale),
          iconOffset: Math.round(50 * scale)
        },
        comments: {
          x: width * 0.08,
          startY: height * 0.67,
          width: width * 0.86,
          lineHeight: Math.round(60 * scale),
          fontSize: Math.round(28 * scale)
        }
      };
    } else {
      // 时间线布局
      return {
        time: {
          x: width * 0.28,
          y: height * 0.505,
          fontSize: Math.round(26 * scale),
          clearWidth: Math.round(280 * scale),
          clearHeight: Math.round(40 * scale)
        },
        likes: {
          x: width * 0.28,
          y: height * 0.545,
          width: width * 0.65,
          height: Math.round(65 * scale),
          fontSize: Math.round(26 * scale),
          iconOffset: Math.round(45 * scale)
        },
        comments: {
          x: width * 0.28,
          startY: height * 0.595,
          width: width * 0.65,
          lineHeight: Math.round(55 * scale),
          fontSize: Math.round(26 * scale)
        }
      };
    }
  }

  /**
   * 检测灰色背景区域（点赞评论区）
   */
  async detectGrayRegion(imageBuffer, width, height) {
    try {
      // 只扫描图片下半部分（提高性能）
      const scanStartY = Math.floor(height * 0.4);
      const scanHeight = Math.floor(height * 0.5);

      // 使用 sharp 提取扫描区域的像素数据
      const { data, info } = await sharp(imageBuffer)
        .extract({
          left: 0,
          top: scanStartY,
          width: width,
          height: scanHeight
        })
        .raw()
        .toBuffer({ resolveWithObject: true });

      // 按行扫描，查找连续的灰色像素行
      const grayRows = [];
      const minGrayWidth = width * 0.7; // 至少70%宽度是灰色

      for (let y = 0; y < scanHeight; y++) {
        let grayPixelCount = 0;

        // 采样：每隔10个像素检查一次（提高性能）
        for (let x = 0; x < width; x += 10) {
          const idx = (y * width + x) * 3;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          if (this.isGrayBackground(r, g, b)) {
            grayPixelCount += 10;
          }
        }

        if (grayPixelCount >= minGrayWidth) {
          grayRows.push(scanStartY + y);
        }
      }

      // 找到连续的灰色区域
      if (grayRows.length > 10) {
        const firstGrayY = grayRows[0];
        const lastGrayY = grayRows[grayRows.length - 1];
        const regionHeight = lastGrayY - firstGrayY;

        return {
          found: true,
          y: firstGrayY,
          height: regionHeight,
          confidence: grayRows.length / scanHeight
        };
      }

      return { found: false };

    } catch (error) {
      console.error('检测灰色区域失败:', error.message);
      return { found: false };
    }
  }

  /**
   * 判断是否为微信灰色背景
   */
  isGrayBackground(r, g, b) {
    return (
      r >= this.grayBgColor.r.min && r <= this.grayBgColor.r.max &&
      g >= this.grayBgColor.g.min && g <= this.grayBgColor.g.max &&
      b >= this.grayBgColor.b.min && b <= this.grayBgColor.b.max
    );
  }

  /**
   * 根据检测到的灰色区域计算布局
   */
  calculateLayoutFromGrayRegion(grayRegion, width, height, screenshotType) {
    const isDetail = screenshotType === 'detail';

    // 灰色区域的顶部就是点赞区域的起始位置
    const likesY = grayRegion.y + 20; // 留一些边距
    const commentsY = likesY + 80;    // 评论在点赞下方

    // 时间位置在灰色区域上方
    const timeY = grayRegion.y - 60;

    const baseFontSize = Math.max(24, Math.floor(width / 40));

    return {
      time: {
        x: width * 0.28,
        y: Math.max(timeY, height * 0.4),
        fontSize: baseFontSize,
        clearWidth: Math.floor(width * 0.25),
        clearHeight: Math.floor(baseFontSize * 1.6)
      },
      likes: {
        x: width * (isDetail ? 0.08 : 0.28),
        y: likesY,
        width: width * (isDetail ? 0.86 : 0.65),
        height: Math.floor(baseFontSize * 2.5),
        fontSize: baseFontSize,
        iconOffset: Math.floor(baseFontSize * 1.8)
      },
      comments: {
        x: width * (isDetail ? 0.08 : 0.28),
        startY: commentsY,
        width: width * (isDetail ? 0.86 : 0.65),
        lineHeight: Math.floor(baseFontSize * 2.2),
        fontSize: baseFontSize
      }
    };
  }

  /**
   * 基于比例的智能估算
   */
  calculateProportionalLayout(width, height, screenshotType) {
    const isDetail = screenshotType === 'detail';
    const aspectRatio = height / width;

    // 根据宽高比动态调整
    let timeYRatio, likesYRatio, commentsYRatio;

    if (aspectRatio > 2.3) {
      // 超长屏（如 20:9）
      timeYRatio = 0.52;
      likesYRatio = isDetail ? 0.58 : 0.54;
      commentsYRatio = isDetail ? 0.65 : 0.59;
    } else if (aspectRatio > 2.1) {
      // 长屏（如 19.5:9）
      timeYRatio = 0.535;
      likesYRatio = isDetail ? 0.60 : 0.545;
      commentsYRatio = isDetail ? 0.67 : 0.595;
    } else {
      // 普通屏（16:9等）
      timeYRatio = 0.545;
      likesYRatio = isDetail ? 0.62 : 0.56;
      commentsYRatio = isDetail ? 0.69 : 0.61;
    }

    // 根据分辨率动态调整字体大小
    const baseFontSize = Math.max(22, Math.min(32, Math.floor(width / 38)));

    return {
      time: {
        x: width * 0.28,
        y: height * timeYRatio,
        fontSize: baseFontSize,
        clearWidth: Math.floor(baseFontSize * 10.5),
        clearHeight: Math.floor(baseFontSize * 1.6)
      },
      likes: {
        x: width * (isDetail ? 0.08 : 0.28),
        y: height * likesYRatio,
        width: width * (isDetail ? 0.86 : 0.65),
        height: Math.floor(baseFontSize * 2.5),
        fontSize: baseFontSize,
        iconOffset: Math.floor(baseFontSize * 1.8)
      },
      comments: {
        x: width * (isDetail ? 0.08 : 0.28),
        startY: height * commentsYRatio,
        width: width * (isDetail ? 0.86 : 0.65),
        lineHeight: Math.floor(baseFontSize * 2.2),
        fontSize: baseFontSize
      }
    };
  }

  /**
   * 默认布局（最后的兜底方案）
   */
  getDefaultLayout(width, height, screenshotType) {
    const isDetail = screenshotType === 'detail';

    if (isDetail) {
      return {
        time: {
          x: width * 0.28,
          y: height * 0.535,
          fontSize: 28,
          clearWidth: 300,
          clearHeight: 45
        },
        likes: {
          x: width * 0.08,
          y: height * 0.60,
          width: width * 0.86,
          height: 70,
          fontSize: 28,
          iconOffset: 50
        },
        comments: {
          x: width * 0.08,
          startY: height * 0.67,
          width: width * 0.86,
          lineHeight: 60,
          fontSize: 28
        }
      };
    } else {
      return {
        time: {
          x: width * 0.28,
          y: height * 0.505,
          fontSize: 26,
          clearWidth: 280,
          clearHeight: 40
        },
        likes: {
          x: width * 0.28,
          y: height * 0.545,
          width: width * 0.65,
          height: 65,
          fontSize: 26,
          iconOffset: 45
        },
        comments: {
          x: width * 0.28,
          startY: height * 0.595,
          width: width * 0.65,
          lineHeight: 55,
          fontSize: 26
        }
      };
    }
  }

  /**
   * 添加新的已知设备配置
   */
  addKnownLayout(width, height, name, scale = 1.0) {
    this.knownLayouts.push({ width, height, name, scale });
    console.log(`✅ 添加新设备配置: ${name} (${width}x${height})`);
  }
}

module.exports = AdaptiveLayoutDetector;
