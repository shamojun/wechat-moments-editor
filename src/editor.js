const { createCanvas, loadImage, registerFont } = require('canvas');
const sharp = require('sharp');
const SmartLayoutDetector = require('./layoutDetector');
const ContentGenerator = require('./contentGenerator');

class WeChatMomentsEditor {
  constructor() {
    this.defaultLikesRange = { min: 10, max: 30 };
    this.defaultCommentsRange = { min: 5, max: 12 };

    // 截图类型
    this.SCREENSHOT_TYPES = {
      DETAIL: 'detail',      // 详情页 - 单条朋友圈详情
      TIMELINE: 'timeline'   // 时间线 - 朋友圈列表流
    };

    // 智能布局检测器
    this.layoutDetector = new SmartLayoutDetector();

    // 内容生成器（扩展的名字库和评论库）
    this.contentGenerator = new ContentGenerator();

    console.log(`名字库大小: ${this.contentGenerator.getNamePoolSize()}`);
    console.log(`评论库大小: ${this.contentGenerator.getCommentPoolSize()}`);
  }

  /**
   * 自动检测截图类型
   * @param {number} width - 图片宽度
   * @param {number} height - 图片高度
   * @returns {string} - 截图类型
   */
  detectScreenshotType(width, height) {
    // 详情页通常顶部有"详情"标题，底部有评论输入框
    // 时间线是朋友圈列表，顶部有"朋友圈"标题
    // 这里可以根据实际情况添加更多检测逻辑
    // 默认先按高度比例判断，详情页相对更高
    const ratio = height / width;

    // 可以通过OCR或图像识别来更准确判断，这里简化处理
    // 用户也可以手动指定类型
    return ratio > 2.2 ? this.SCREENSHOT_TYPES.DETAIL : this.SCREENSHOT_TYPES.TIMELINE;
  }

  /**
   * 生成随机整数
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  /**
   * 生成随机时间字符串
   */
  generateRandomTime() {
    const options = ['刚刚', '1分钟前', '3分钟前', '5分钟前', '10分钟前', '30分钟前', '1小时前', '2小时前', '3小时前'];
    return options[this.randomInt(0, options.length - 1)];
  }

  /**
   * 生成随机昵称（使用ContentGenerator）
   */
  generateRandomNames(count) {
    return this.contentGenerator.generateRandomNames(count);
  }

  /**
   * 生成随机评论内容（使用ContentGenerator）
   * @param {number} count - 评论数量
   * @param {string} momentText - 朋友圈文字内容（可选，用于智能评论）
   * @param {boolean} useSmartComments - 是否使用智能评论
   */
  generateRandomComments(count, momentText = null, useSmartComments = false) {
    if (useSmartComments && momentText) {
      return this.contentGenerator.generateSmartComments(momentText, count);
    }
    return this.contentGenerator.generateRandomComments(count);
  }

  /**
   * 获取详情页布局坐标
   */
  getDetailLayout(width, height) {
    return {
      // 时间位置 - 在图片中部偏下，时间戳的位置
      time: {
        x: width * 0.28,
        y: height * 0.535,
        fontSize: 28,
        clearWidth: 300,
        clearHeight: 45
      },
      // 点赞区域 - 在时间下方
      likes: {
        x: width * 0.08,
        y: height * 0.60,
        width: width * 0.86,
        height: 70,
        fontSize: 28,
        iconOffset: 50
      },
      // 评论区域 - 点赞区域下方，留出底部评论输入框的空间
      comments: {
        x: width * 0.08,
        startY: height * 0.67,
        width: width * 0.86,
        lineHeight: 60,
        fontSize: 28
      }
    };
  }

  /**
   * 获取时间线页布局坐标
   */
  getTimelineLayout(width, height) {
    return {
      // 时间位置 - 在画面中部某条朋友圈的时间位置
      time: {
        x: width * 0.28,
        y: height * 0.505,
        fontSize: 26,
        clearWidth: 280,
        clearHeight: 40
      },
      // 点赞区域 - 在时间下方，背景色与朋友圈一致
      likes: {
        x: width * 0.28,
        y: height * 0.545,
        width: width * 0.65,
        height: 65,
        fontSize: 26,
        iconOffset: 45
      },
      // 评论区域
      comments: {
        x: width * 0.28,
        startY: height * 0.595,
        width: width * 0.65,
        lineHeight: 55,
        fontSize: 26
      }
    };
  }

  /**
   * 修改朋友圈截图
   * @param {Buffer} imageBuffer - 原始图片Buffer
   * @param {Object} options - 配置选项
   * @returns {Promise<Buffer>} - 修改后的图片Buffer
   */
  async modifyScreenshot(imageBuffer, options = {}) {
    const {
      newTime = this.generateRandomTime(),
      likesCount = this.randomInt(this.defaultLikesRange.min, this.defaultLikesRange.max),
      commentsCount = this.randomInt(this.defaultCommentsRange.min, this.defaultCommentsRange.max),
      customLikeNames = null,
      customComments = null,
      screenshotType = null,  // 可以手动指定类型：'detail' 或 'timeline'
      useSmartDetection = true  // 是否使用智能检测
    } = options;

    // 加载原始图片
    const image = await loadImage(imageBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // 绘制原始图片
    ctx.drawImage(image, 0, 0);

    // 检测或使用指定的截图类型
    const type = screenshotType || this.detectScreenshotType(image.width, image.height);
    console.log(`📸 截图尺寸: ${image.width}x${image.height}, 类型: ${type}`);

    // 获取布局坐标 - 使用智能检测或默认布局
    let layout;
    if (useSmartDetection) {
      console.log('🔍 使用智能布局检测');
      layout = await this.layoutDetector.detectLayout(imageBuffer, image.width, image.height, type);
    } else {
      console.log('📐 使用默认布局');
      layout = type === this.SCREENSHOT_TYPES.DETAIL
        ? this.getDetailLayout(image.width, image.height)
        : this.getTimelineLayout(image.width, image.height);
    }

    console.log(`📍 布局坐标 - 时间:(${layout.time.x}, ${layout.time.y}), 点赞:(${layout.likes.x}, ${layout.likes.y}), 评论:(${layout.comments.x}, ${layout.comments.startY})`);
    console.log(`👥 点赞数: ${likesCount}, 💬 评论数: ${commentsCount}`);

    // 修改时间
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(
      layout.time.x - 10,
      layout.time.y - layout.time.clearHeight + 10,
      layout.time.clearWidth,
      layout.time.clearHeight
    );

    ctx.fillStyle = '#999999';
    ctx.font = `${layout.time.fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillText(newTime, layout.time.x, layout.time.y);

    // 添加点赞区域（如果需要）
    const likeNames = customLikeNames || this.generateRandomNames(likesCount);
    if (likeNames.length > 0) {
      // 绘制点赞背景
      ctx.fillStyle = '#F7F7F7';
      ctx.fillRect(
        layout.likes.x - 15,
        layout.likes.y - 45,
        layout.likes.width,
        layout.likes.height
      );

      // 绘制点赞图标
      ctx.fillStyle = '#576B95';
      ctx.font = `${layout.likes.fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.fillText('❤', layout.likes.x + 5, layout.likes.y);

      // 绘制点赞名字（支持换行）
      ctx.fillStyle = '#576B95';
      const likeText = likeNames.join('，');
      this.wrapText(ctx, likeText, layout.likes.x + layout.likes.iconOffset, layout.likes.y, layout.likes.width - layout.likes.iconOffset - 20, layout.likes.fontSize + 8);
    }

    // 添加评论区域（如果需要）
    const comments = customComments || this.generateRandomComments(commentsCount);
    if (comments.length > 0) {
      let commentY = layout.comments.startY;
      const maxCommentHeight = image.height - commentY - 100; // 留出底部空间

      // 绘制评论背景
      const totalCommentHeight = Math.min(comments.length * layout.comments.lineHeight + 30, maxCommentHeight);
      ctx.fillStyle = '#F7F7F7';
      ctx.fillRect(
        layout.comments.x - 15,
        commentY - 35,
        layout.comments.width,
        totalCommentHeight
      );

      // 绘制评论内容
      ctx.font = `${layout.comments.fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
      comments.forEach((comment, index) => {
        if (commentY + layout.comments.lineHeight > image.height - 100) {
          return; // 超出底部则停止绘制
        }

        // 绘制评论者名字
        ctx.fillStyle = '#576B95';
        ctx.fillText(comment.name + ':', layout.comments.x, commentY);

        // 绘制评论内容
        ctx.fillStyle = '#000000';
        const nameWidth = ctx.measureText(comment.name + ':').width;
        ctx.fillText(comment.content, layout.comments.x + nameWidth + 10, commentY);

        commentY += layout.comments.lineHeight;
      });
    }

    // 转换为Buffer
    return canvas.toBuffer('image/png');
  }

  /**
   * 文本换行处理
   */
  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split('');
    let line = '';
    let lineY = y;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i];
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, lineY);
        line = words[i];
        lineY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, lineY);
  }

  /**
   * 批量处理图片
   */
  async batchModify(imageBuffers, options = {}) {
    const results = [];
    for (const buffer of imageBuffers) {
      const modified = await this.modifyScreenshot(buffer, options);
      results.push(modified);
    }
    return results;
  }
}

module.exports = WeChatMomentsEditor;
