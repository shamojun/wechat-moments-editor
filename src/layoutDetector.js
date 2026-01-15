const Tesseract = require('tesseract.js');

/**
 * 智能布局检测器 - 自动识别朋友圈截图中的时间位置
 */
class SmartLayoutDetector {
  constructor() {
    this.ocrWorker = null;
    this.cacheEnabled = true;
  }

  /**
   * 初始化OCR工作器
   */
  async initOCR() {
    if (!this.ocrWorker) {
      this.ocrWorker = await Tesseract.createWorker('chi_sim', 1, {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR进度: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
    }
    return this.ocrWorker;
  }

  /**
   * 检测布局 - 主入口
   */
  async detectLayout(imageBuffer, imageWidth, imageHeight, screenshotType) {
    try {
      console.log('开始智能布局检测...');

      // 先尝试OCR检测时间位置
      const timePosition = await this.detectTimeByOCR(imageBuffer, imageWidth, imageHeight);

      if (timePosition) {
        console.log('OCR检测成功，使用智能布局');
        return this.calculateLayoutFromTime(timePosition, imageWidth, imageHeight, screenshotType);
      } else {
        console.log('OCR未找到时间，尝试颜色区域检测');
        const grayRegion = await this.detectByColorRegion(imageBuffer, imageWidth, imageHeight);

        if (grayRegion) {
          console.log('颜色区域检测成功');
          return this.calculateLayoutFromRegion(grayRegion, imageWidth, imageHeight, screenshotType);
        }
      }
    } catch (error) {
      console.warn('智能检测失败，使用默认布局:', error.message);
    }

    // 兜底：使用默认布局
    console.log('使用默认布局');
    return this.getDefaultLayout(imageWidth, imageHeight, screenshotType);
  }

  /**
   * 使用OCR检测时间位置
   */
  async detectTimeByOCR(imageBuffer, width, height) {
    try {
      await this.initOCR();

      // 只扫描中下部区域（提高速度和准确度）
      const scanRegion = {
        top: Math.floor(height * 0.3),
        left: 0,
        width: width,
        height: Math.floor(height * 0.5)
      };

      console.log('执行OCR识别...');
      const { data } = await this.ocrWorker.recognize(imageBuffer, {
        rectangle: scanRegion
      });

      // 匹配时间模式
      const timePatterns = [
        /\d+秒前/,
        /\d+分钟前/,
        /\d+小时前/,
        /\d+天前/,
        /刚刚/,
        /\d{4}年\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2}/,
        /\d{1,2}月\d{1,2}日\s*\d{1,2}:\d{2}/
      ];

      // 查找时间文字
      for (const word of data.words) {
        const text = word.text.trim();

        for (const pattern of timePatterns) {
          if (pattern.test(text)) {
            console.log(`找到时间文字: "${text}" 位置: (${word.bbox.x0}, ${word.bbox.y0})`);

            return {
              text: text,
              x: word.bbox.x0,
              y: word.bbox.y0 + scanRegion.top, // 加上偏移
              width: word.bbox.x1 - word.bbox.x0,
              height: word.bbox.y1 - word.bbox.y0,
              baseline: (word.bbox.y0 + word.bbox.y1) / 2 + scanRegion.top
            };
          }
        }
      }

      console.log('OCR未识别到时间文字');
      return null;
    } catch (error) {
      console.error('OCR检测出错:', error);
      return null;
    }
  }

  /**
   * 通过颜色区域检测（辅助方案）
   */
  async detectByColorRegion(imageBuffer, width, height) {
    // 简化实现：查找灰色背景区域的大致位置
    // 这里可以使用sharp进行像素分析
    // 由于实现复杂度，暂时返回null，后续可扩展
    return null;
  }

  /**
   * 根据检测到的时间位置计算布局
   */
  calculateLayoutFromTime(timePosition, width, height, screenshotType) {
    const isDetail = screenshotType === 'detail';

    // 基于检测到的时间位置计算其他元素位置
    const timeX = timePosition.x;
    const timeY = timePosition.baseline;

    // 计算左边距（时间到屏幕左边的距离，用于对齐其他元素）
    const leftMargin = Math.max(width * 0.08, timeX - width * 0.2);

    return {
      time: {
        x: timeX,
        y: timeY,
        fontSize: Math.max(24, Math.floor(timePosition.height * 0.9)),
        clearWidth: Math.max(250, timePosition.width + 80),
        clearHeight: Math.max(40, timePosition.height + 10)
      },
      likes: {
        x: leftMargin,
        y: timeY + (isDetail ? 70 : 60),
        width: width * (isDetail ? 0.86 : 0.70),
        height: isDetail ? 70 : 65,
        fontSize: Math.max(24, Math.floor(timePosition.height * 0.85)),
        iconOffset: 50
      },
      comments: {
        x: leftMargin,
        startY: timeY + (isDetail ? 140 : 125),
        width: width * (isDetail ? 0.86 : 0.70),
        lineHeight: isDetail ? 60 : 55,
        fontSize: Math.max(24, Math.floor(timePosition.height * 0.85))
      }
    };
  }

  /**
   * 根据颜色区域计算布局
   */
  calculateLayoutFromRegion(region, width, height, screenshotType) {
    // 基于检测到的灰色区域计算布局
    // 这里简化处理
    return this.getDefaultLayout(width, height, screenshotType);
  }

  /**
   * 获取默认布局（兜底方案）
   */
  getDefaultLayout(width, height, screenshotType) {
    const isDetail = screenshotType === 'detail';

    if (isDetail) {
      // 详情页布局 - 适配1080x2400等竖屏截图
      return {
        time: {
          x: width * 0.28,
          y: height * 0.535,  // 时间位置：约1284px (at 2400px height)
          fontSize: 28,
          clearWidth: 300,
          clearHeight: 45
        },
        likes: {
          x: width * 0.08,
          y: height * 0.60,   // 点赞位置：约1440px (at 2400px height)
          width: width * 0.86,
          height: 70,
          fontSize: 28,
          iconOffset: 50
        },
        comments: {
          x: width * 0.08,
          startY: height * 0.67,  // 评论起始：约1608px (at 2400px height)
          width: width * 0.86,
          lineHeight: 60,
          fontSize: 28
        }
      };
    } else {
      // 时间线布局
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
   * 清理资源
   */
  async cleanup() {
    if (this.ocrWorker) {
      await this.ocrWorker.terminate();
      this.ocrWorker = null;
    }
  }
}

module.exports = SmartLayoutDetector;
