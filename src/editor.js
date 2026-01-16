const { createCanvas, loadImage, registerFont } = require('canvas');
const AdaptiveLayoutDetector = require('./adaptiveLayoutDetector');
const SmartLayoutDetector = require('./layoutDetector');
const ContentGenerator = require('./contentGenerator');
const AvatarManager = require('./avatarManager');
const fs = require('fs');
const path = require('path');

class WeChatMomentsEditor {
  constructor() {
    this.defaultLikesRange = { min: 10, max: 30 };
    this.defaultCommentsRange = { min: 5, max: 12 };

    // 注册系统中文字体
    this.registerChineseFonts();

    // 截图类型
    this.SCREENSHOT_TYPES = {
      DETAIL: 'detail',      // 详情页 - 单条朋友圈详情
      TIMELINE: 'timeline'   // 时间线 - 朋友圈列表流
    };

    // 使用自适应布局检测器（不依赖OCR，更稳定）
    this.layoutDetector = new AdaptiveLayoutDetector();
    // 保留旧检测器作为备用
    this.smartLayoutDetector = new SmartLayoutDetector();

    // 内容生成器（扩展的名字库和评论库）
    this.contentGenerator = new ContentGenerator();

    // 头像管理器
    this.avatarManager = new AvatarManager();

    console.log(`名字库大小: ${this.contentGenerator.getNamePoolSize()}`);
    console.log(`评论库大小: ${this.contentGenerator.getCommentPoolSize()}`);
    console.log(`头像数量: ${this.avatarManager.getAvatarCount()}`);
  }

  /**
   * 注册系统中文字体和 Emoji 字体
   */
  registerChineseFonts() {
    try {
      // Alpine Linux 和 Debian/Ubuntu 字体路径
      const fontPaths = [
        // Alpine Linux (Noto CJK)
        '/usr/share/fonts/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc',
        // Debian/Ubuntu
        '/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc',
        '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
        '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
        // 其他可能路径
        '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf'
      ];

      let registered = false;
      for (const fontPath of fontPaths) {
        if (fs.existsSync(fontPath)) {
          registerFont(fontPath, { family: 'NotoSansCJK' });
          console.log(`✅ 成功注册中文字体: ${fontPath}`);
          registered = true;
          break;
        }
      }

      // 注册 Emoji 字体
      const emojiFontPaths = [
        '/usr/share/fonts/noto/NotoColorEmoji.ttf',
        '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
      ];

      for (const emojiPath of emojiFontPaths) {
        if (fs.existsSync(emojiPath)) {
          registerFont(emojiPath, { family: 'Noto Color Emoji' });
          console.log(`✅ 成功注册 Emoji 字体: ${emojiPath}`);
          break;
        }
      }

      if (!registered) {
        console.log('⚠️  未找到系统中文字体，尝试使用 fontconfig');
        // 如果找不到具体路径，让 Pango/Cairo 通过 fontconfig 自动查找
        // Alpine 的 font-noto-cjk 会被 fontconfig 识别
      }
    } catch (error) {
      console.error('❌ 注册中文字体失败:', error.message);
    }
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
   * 生成评论时间（基于朋友圈发布时间之后2小时内）
   * @param {string} postTime - 朋友圈发布时间（如 "1小时前", "刚刚" 等）
   */
  generateCommentTime(postTime) {
    const now = new Date();
    let postDate = now;

    // 解析发布时间
    if (postTime.includes('分钟前')) {
      const minutes = parseInt(postTime);
      postDate = new Date(now.getTime() - minutes * 60 * 1000);
    } else if (postTime.includes('小时前')) {
      const hours = parseInt(postTime);
      postDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
    } else if (postTime === '刚刚') {
      postDate = now;
    }

    // 评论时间在发布时间之后的0-120分钟内
    const randomMinutesAfter = this.randomInt(1, 120);
    const commentDate = new Date(postDate.getTime() + randomMinutesAfter * 60 * 1000);

    const hour = commentDate.getHours().toString().padStart(2, '0');
    const minute = commentDate.getMinutes().toString().padStart(2, '0');

    return `${hour}:${minute}`;
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
        y: height * 0.60,  // 调整到合理位置（时间下方）
        width: width * 0.86,
        height: 70,
        fontSize: 28,
        iconOffset: 50
      },
      // 评论区域 - 点赞区域下方
      comments: {
        x: width * 0.08,
        startY: height * 0.67,  // 评论起始位置
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

    // 计算需要清除的总区域（点赞+评论）
    const likeNames = customLikeNames || this.generateRandomNames(likesCount);
    const comments = customComments || this.generateRandomComments(commentsCount);

    // 为点赞和评论分配头像
    const likesWithAvatars = this.avatarManager.assignAvatarsForLikes(likeNames);
    const commentsWithAvatars = this.avatarManager.assignAvatarsForComments(comments);

    // 先清除整个点赞评论区域（用白色覆盖）
    if (likesWithAvatars.length > 0 || commentsWithAvatars.length > 0) {
      const clearStartY = layout.likes.y - 50; // 点赞区域上边界
      const clearEndY = Math.min(
        layout.comments.startY + commentsWithAvatars.length * layout.comments.lineHeight + 80,
        image.height - 50
      );
      const clearHeight = clearEndY - clearStartY;

      // 用白色填充整个区域，清除原有内容
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(
        layout.likes.x - 20,
        clearStartY,
        layout.likes.width + 40,
        clearHeight
      );
    }

    // 添加点赞区域（如果需要）
    if (likesWithAvatars.length > 0) {
      await this.drawLikesWithAvatars(ctx, likesWithAvatars, layout, image);
    }

    // 添加评论区域（如果需要）
    if (commentsWithAvatars.length > 0) {
      await this.drawCommentsWithAvatars(ctx, commentsWithAvatars, layout, image, newTime);
    }

    // 转换为Buffer
    return canvas.toBuffer('image/png');
  }

  /**
   * 绘制带头像的点赞列表
   */
  async drawLikesWithAvatars(ctx, likesWithAvatars, layout, image) {
    const avatarSize = Math.floor(layout.likes.fontSize * 1.2); // 头像大小
    const spacing = 8; // 头像间距

    // 绘制点赞背景
    const bgHeight = avatarSize + 20;
    ctx.fillStyle = '#F7F7F7';
    ctx.fillRect(
      layout.likes.x - 15,
      layout.likes.y - avatarSize - 5,
      layout.likes.width,
      bgHeight
    );

    // 绘制点赞图标
    ctx.fillStyle = '#576B95';
    ctx.font = `${layout.likes.fontSize}px "NotoSansCJK", "Noto Sans CJK SC", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillText('❤', layout.likes.x + 5, layout.likes.y);

    // 绘制点赞头像列表
    let currentX = layout.likes.x + 45;
    const maxWidth = layout.likes.width - 60;

    for (const like of likesWithAvatars) {
      // 检查是否超出宽度
      if (currentX + avatarSize > layout.likes.x + maxWidth) {
        break; // 超出则停止绘制更多头像
      }

      // 加载并绘制头像
      if (like.avatar) {
        try {
          const avatar = await loadImage(like.avatar);

          // 绘制圆形头像
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            currentX + avatarSize / 2,
            layout.likes.y - avatarSize / 2,
            avatarSize / 2,
            0,
            Math.PI * 2
          );
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(
            avatar,
            currentX,
            layout.likes.y - avatarSize,
            avatarSize,
            avatarSize
          );

          ctx.restore();
        } catch (error) {
          console.warn(`⚠️ 加载头像失败: ${like.avatar}`);
        }
      }

      currentX += avatarSize + spacing;
    }
  }

  /**
   * 绘制带头像的评论列表
   */
  async drawCommentsWithAvatars(ctx, commentsWithAvatars, layout, image, postTime) {
    const avatarSize = Math.floor(layout.comments.fontSize * 1.4); // 头像大小
    const avatarMargin = 12; // 头像右边距

    let commentY = layout.comments.startY;
    const maxCommentHeight = image.height - commentY - 100;

    // 绘制评论背景
    const totalCommentHeight = Math.min(
      commentsWithAvatars.length * layout.comments.lineHeight + 30,
      maxCommentHeight
    );
    ctx.fillStyle = '#F7F7F7';
    ctx.fillRect(
      layout.comments.x - 15,
      commentY - 35,
      layout.comments.width,
      totalCommentHeight
    );

    // 绘制每条评论
    ctx.font = `${layout.comments.fontSize}px "NotoSansCJK", "Noto Sans CJK SC", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;

    for (const comment of commentsWithAvatars) {
      if (commentY + layout.comments.lineHeight > image.height - 100) {
        break; // 超出底部则停止绘制
      }

      // 绘制头像
      if (comment.avatar) {
        try {
          const avatar = await loadImage(comment.avatar);

          // 绘制圆形头像
          ctx.save();
          ctx.beginPath();
          ctx.arc(
            layout.comments.x + avatarSize / 2,
            commentY - avatarSize / 2 + 5,
            avatarSize / 2,
            0,
            Math.PI * 2
          );
          ctx.closePath();
          ctx.clip();

          ctx.drawImage(
            avatar,
            layout.comments.x,
            commentY - avatarSize + 5,
            avatarSize,
            avatarSize
          );

          ctx.restore();
        } catch (error) {
          console.warn(`⚠️ 加载评论头像失败: ${comment.avatar}`);
        }
      }

      // 计算文本起始位置（头像右侧）
      const textX = layout.comments.x + avatarSize + avatarMargin;
      const maxTextWidth = layout.comments.width - avatarSize - avatarMargin - 180; // 为时间留出空间

      // 绘制评论者名字
      ctx.fillStyle = '#576B95';
      ctx.fillText(comment.name + ':', textX, commentY);

      // 绘制评论内容
      ctx.fillStyle = '#000000';
      const nameWidth = ctx.measureText(comment.name + ':').width;
      const contentX = textX + nameWidth + 8;

      // 简单换行处理
      const contentMaxWidth = maxTextWidth - nameWidth - 8;
      this.drawCommentContent(ctx, comment.content, contentX, commentY, contentMaxWidth);

      // 绘制评论时间（右侧）
      const commentTime = this.generateCommentTime(postTime);
      ctx.fillStyle = '#999999';
      ctx.font = `${Math.floor(layout.comments.fontSize * 0.85)}px "NotoSansCJK", "Noto Sans CJK SC", sans-serif`;
      const timeWidth = ctx.measureText(commentTime).width;
      ctx.fillText(commentTime, layout.comments.x + layout.comments.width - timeWidth - 30, commentY);

      // 恢复字体大小
      ctx.font = `${layout.comments.fontSize}px "NotoSansCJK", "Noto Sans CJK SC", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;

      commentY += layout.comments.lineHeight;
    }
  }

  /**
   * 绘制评论内容（支持简单换行）
   */
  drawCommentContent(ctx, text, x, y, maxWidth) {
    const metrics = ctx.measureText(text);

    if (metrics.width <= maxWidth) {
      // 不需要换行
      ctx.fillText(text, x, y);
    } else {
      // 需要换行，截断并添加省略号
      let truncated = text;
      while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
        truncated = truncated.slice(0, -1);
      }
      ctx.fillText(truncated + '...', x, y);
    }
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
