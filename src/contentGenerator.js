/**
 * 评论和点赞内容生成器
 * 包含扩展的名字库、评论库和头像管理
 */
const ThemeDetector = require('./themeDetector');
const fs = require('fs');
const path = require('path');

class ContentGenerator {
  constructor() {
    // 主题检测器
    this.themeDetector = new ThemeDetector();

    console.log(`主题检测器已加载，支持${this.themeDetector.getSupportedThemes().length}种主题`);
    console.log(`主题评论总数: ${this.themeDetector.getTotalCommentCount()}条`);

    // 初始化本地头像列表
    this.localAvatarPath = 'resource/AIgei_images';
    this.localAvatars = [];
    this.useLocalAvatars = true;
    this.loadLocalAvatars();

    // 扩充的名字库（500+个真实感昵称）
    this.namePool = [
      // 经典名字
   
      // 单字名
      '静', '萍', '娟', '芳', '玲', '燕', '霞', '梅', '丽', '红',
      '杰', '强', '伟', '勇', '军', '磊', '涛', '超', '波', '鹏',

      // 叠字名
      '欢欢', '乐乐', '笑笑', '甜甜', '蜜蜜', '娜娜', '婷婷', '莉莉',
      '明明', '亮亮', '强强', '刚刚', '帅帅', '聪聪', '飞飞', '龙龙',

      // 英文名
      'Amy', 'Bob', 'Cathy', 'David', 'Emily', 'Frank', 'Grace', 'Henry',
      'Ivy', 'Jack', 'Kelly', 'Leo', 'Mary', 'Nancy', 'Oscar', 'Peter',
      'Quinn', 'Rose', 'Sam', 'Tony', 'Uma', 'Vicky', 'Wendy', 'Zoe',

      // 个性昵称
      '阳光少年', '快乐小子', '梦想家', '旅行者', '摄影师', '吃货',
      '夜猫子', '早起鸟', '书虫', '影迷', '球迷', '游戏王',
      '咖啡爱好者', '茶道中人', '美食达人', '健身狂',

      // 文艺昵称
      '清风明月', '静水流深', '一叶知秋', '春暖花开', '岁月静好',
      '浮生若梦', '云淡风轻', '随遇而安', '简单生活', '慢慢来',

      // 可爱昵称
      '小可爱', '小仙女', '小公主', '小王子', '小天使', '小恶魔',
      '萌萌哒', '哈哈哈', '嘻嘻嘻', '么么哒', '笔芯',

      // 职业相关
       '产品经理', '运营喵', '市场汪',
      '销售精英', '财务小哥', '人事姐姐', 'HR小姐姐',


      // 搞笑昵称
      '社会我佩奇', '本宫', '朕', '寡人', '哀家', '小的',
      '吃瓜群众', '路过', '打酱油的', '隐身人',

      // 二字组合名
      '子轩', '浩然', '思远', '雨辰', '宇航', '文博', '志强', '建国',
      '诗涵', '雨萱', '梓涵', '可馨', '欣怡', '思琪', '雅静', '梦洁',

      // 三字组合名
      '王小明', '李小红', '张小华', '刘小丽', '陈小强', '杨小芳',
      '赵小军', '黄小美', '周小杰', '吴小文', '徐小云', '孙小雨',

    
      // 更多真实姓名
      '建华', '秀英', '国强', '丽华', '志刚', '秀兰', '伟华', '桂兰',
      '建军', '秀珍', '国华', '丽娟', '志伟', '秀云', '伟强', '桂英',
      '建国', '秀梅', '国平', '丽萍', '志明', '秀芳', '伟民', '桂花',

      // 更多常见名
      '嘉怡', '佳怡', '子涵', '梓涵', '子轩', '梓轩', '浩宇', '浩然',
      '雨桐', '雨彤', '思涵', '思琪', '雨萱', '雨轩', '俊杰', '俊熙',
      '诗涵', '诗琪', '梦涵', '梦琪', '欣怡', '欣妍', '可馨', '可欣'
    ];

    // 扩充的评论库（200+条真实评论）
    this.commentTemplates = [
      // 基础反应
      '哈哈哈哈', '哈哈哈', '哈哈', '😂', '🤣',
      '赞', '👍', '666', '厉害', '牛',
      '棒', '太棒了', '真棒', '很赞', '给力',

      // 表达情感
      '羡慕', '好羡慕', '羡慕嫉妒恨', '柠檬精了',
      '酸了', '我也想去', '带我一个',
      '好想去', '下次叫我', '求带',

      // 询问类
      '在哪里拍的', '哪里', '什么地方',
      '怎么去', '好玩吗', '多少钱',
      '链接发我', '同款', '求推荐',

      // 赞美类
      '好看', '真好看', '太好看了', '颜值爆表',
      '美', '真美', '太美了', '绝了',
      '拍得好', '拍得真好', '摄影技术不错',

      // 关心类
      '注意安全', '小心', '保重',
      '多喝热水', '早点休息', '注意身体',
      '别太累了', '辛苦了', '加油',

      // 感叹类
      '哇', '哇塞', '哇哦', '天哪', '我的天',
      '不可思议', '绝了', '服了', '无语了',

      // 表情包
      '😄', '😊', '😁', '😆', '😂', '🤣', '😍', '🥰',
      '😘', '😋', '😎', '🤗', '🤔', '😮', '😲', '😱',
      '👍', '👏', '🙏', '💪', '✌️', '🤝', '❤️', '💕',
      '🔥', '💯', '✨', '🎉', '🎊', '🌹', '🌸', '🌺',

      // 长评论
      '拍得太好了吧', '这也太好看了吧', '绝绝子',
      '我什么时候也能去一次', '下次一定要带上我',
      '看起来好好玩', '感觉很不错', '期待下次',

      // 食物相关
      '好吃吗', '看起来很好吃', '流口水了', '馋了',
      '想吃', '在哪家店', '推荐一下', '改天去试试',

      // 景色相关
      '风景好美', '景色不错', '天气真好', '阳光明媚',
      '拍得很美', '构图不错', '角度很棒', '光线很好',

      // 活动相关
      '好热闹', '好开心的样子', '氛围很好', '有意思',
      '下次组织一起去', '算我一个', '喊我',

      // 生活相关
      '生活真美好', '岁月静好', '珍惜当下', '享受生活',
      '慢慢来', '随心而行', '简单就好',

      // 鼓励类
      '加油', '加油加油', '你可以的', '相信你',
      '继续努力', '坚持就是胜利', '加油鸭',

      // 搞笑类
      '哈哈哈哈哈', '笑死我了', '太逗了', '有才',
      '人才', '佩服', '绝了', '你够了',

      // 简短互动
      '是的', '对', '没错', '确实', '真的',
      '哦', '嗯', '好', '可以', 'ok',

      // 时间相关
      '早上好', '中午好', '晚上好', '晚安',
      '周末愉快', '节日快乐', '生日快乐',

      // 天气相关
      '天气不错', '今天天气真好', '多穿点', '注意防晒',
      '小心别感冒', '降温了注意保暖',

      // 运动相关
      '坚持', '继续加油', '注意拉伸', '别受伤',
      '运动使人快乐', '健康最重要',

      // 学习工作
      '辛苦了', '加班辛苦', '注意休息', '劳逸结合',
      '工作顺利', '学习进步', '考试加油',

      // 萌系评论
      '可爱', '萌萌哒', '好萌', '太萌了',
      '爱了爱了', '心动了', '被萌到了',

      // 霸气评论
      '气场全开', '太有范了', '帅', '酷',
      '有气质', '优雅', '大气',

      // 文艺评论
      '岁月静好', '时光温柔', '不负韶华', '初心不改',
      '诗和远方', '慢慢来比较快', '世界那么大',

      // 网络流行语
      'yyds', '绝绝子', '芭比Q了', '栓Q',
      '爷青回', '破防了', 'YYSY', '确实',
      'respect', 'OMG', 'wow', 'nice',

      // 问候语
      '好久不见', '最近怎么样', '还好吗', '在忙啥',
      '什么时候有空', '一起吃饭', '找时间聚聚',

      // 更多真实评论
      '我也去过', '我也想去', '下次约起来',
      '有机会一起', '好久没联系了', '改天见',
      '回头找你玩', '周末有空吗', '晚上吃啥'
    ];

    // 头像URL池（作为备用方案）
    this.avatarAPIs = [
      'ui-avatars',    // 基于首字母
      'dicebear',      // 卡通头像
      'pravatar',      // 真人头像
      'robohash',      // 机器人头像
    ];
  }

  /**
   * 加载本地头像文件列表
   */
  loadLocalAvatars() {
    try {
      const avatarDir = path.join(process.cwd(), this.localAvatarPath);

      if (fs.existsSync(avatarDir)) {
        const files = fs.readdirSync(avatarDir);

        // 过滤出图片文件
        this.localAvatars = files
          .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
          .map(file => `${this.localAvatarPath}/${file}`);

        console.log(`本地头像已加载: ${this.localAvatars.length}个文件`);
      } else {
        console.warn(`警告: 本地头像目录不存在: ${avatarDir}`);
        this.useLocalAvatars = false;
      }
    } catch (error) {
      console.error('加载本地头像失败:', error.message);
      this.useLocalAvatars = false;
    }
  }

  /**
   * 生成随机名字列表
   */
  generateRandomNames(count) {
    const shuffled = [...this.namePool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.namePool.length));
  }

  /**
   * 生成随机评论列表
   */
  generateRandomComments(count) {
    const comments = [];
    const names = this.generateRandomNames(count);

    for (let i = 0; i < count; i++) {
      comments.push({
        name: names[i],
        content: this.getRandomComment(),
        avatar: this.getAvatarForUser(names[i])
      });
    }

    return comments;
  }

  /**
   * 🆕 根据主题生成智能评论
   * @param {string} momentText - 朋友圈文字内容
   * @param {number} count - 评论数量
   * @returns {Array} - 评论列表
   */
  generateSmartComments(momentText, count) {
    // 1. 检测主题
    const theme = this.themeDetector.detectTheme(momentText);

    // 2. 获取主题相关评论
    const themeComments = this.themeDetector.getThemeComments(theme, count);

    // 3. 生成完整评论对象
    const comments = [];
    const names = this.generateRandomNames(count);

    for (let i = 0; i < Math.min(count, themeComments.length); i++) {
      comments.push({
        name: names[i],
        content: themeComments[i],
        avatar: this.getAvatarForUser(names[i]),
        theme: theme  // 附加主题信息
      });
    }

    // 4. 如果主题评论不够，补充通用评论
    if (comments.length < count) {
      const remaining = count - comments.length;
      for (let i = 0; i < remaining; i++) {
        comments.push({
          name: names[comments.length + i],
          content: this.getRandomComment(),
          avatar: this.getAvatarForUser(names[comments.length + i])
        });
      }
    }

    console.log(`生成${count}条智能评论，主题: ${theme}`);
    return comments;
  }

  /**
   * 获取随机评论内容
   */
  getRandomComment() {
    return this.commentTemplates[
      Math.floor(Math.random() * this.commentTemplates.length)
    ];
  }

  /**
   * 为用户生成头像路径
   * 优先使用本地头像文件，同一用户名总是返回相同头像（使用哈希）
   */
  getAvatarForUser(userName, size = 150, apiType = 'local') {
    const hash = this.hashString(userName);

    // 优先使用本地头像
    if (this.useLocalAvatars && apiType === 'local') {
      const localAvatar = this.getLocalAvatar(userName, hash);
      if (localAvatar) {
        return localAvatar;
      }
      // 如果本地头像不可用，降级到在线API
      apiType = 'ui-avatars';
    }

    // 备用：使用在线API
    switch (apiType) {
      case 'ui-avatars':
        // UI Avatars - 基于首字母，彩色背景
        const bgColors = ['FF6B6B', '4ECDC4', '45B7D1', 'FFA07A', '98D8C8', 'F7DC6F', 'BB8FCE', '85C1E2'];
        const bgColor = bgColors[hash % bgColors.length];
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&size=${size}&background=${bgColor}&color=fff&bold=true`;

      case 'dicebear':
        // DiceBear - 卡通头像
        const styles = ['avataaars', 'bottts', 'personas', 'miniavs'];
        const style = styles[hash % styles.length];
        return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(userName)}`;

      case 'pravatar':
        // Pravatar - 真人头像
        const imgNum = (hash % 70) + 1; // 1-70
        return `https://i.pravatar.cc/${size}?img=${imgNum}`;

      case 'robohash':
        // Robohash - 机器人/怪兽头像
        return `https://robohash.org/${encodeURIComponent(userName)}?size=${size}x${size}`;

      default:
        return this.getLocalAvatar(userName, hash);
    }
  }

  /**
   * 获取本地头像文件路径
   * @param {string} _userName - 用户名（未使用，保留用于日志）
   * @param {number} hash - 哈希值（已计算）
   * @returns {string} - 本地头像相对路径
   */
  getLocalAvatar(_userName, hash) {
    // 如果没有本地头像，返回空（会使用备用方案）
    if (!this.localAvatars || this.localAvatars.length === 0) {
      return null;
    }

    // 根据哈希值从实际的头像列表中选择
    const avatarIndex = hash % this.localAvatars.length;
    return this.localAvatars[avatarIndex];
  }

  /**
   * 字符串哈希函数（用于头像一致性）
   */
  hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * 获取名字库大小
   */
  getNamePoolSize() {
    return this.namePool.length;
  }

  /**
   * 获取评论库大小
   */
  getCommentPoolSize() {
    return this.commentTemplates.length;
  }
}

module.exports = ContentGenerator;
