const fs = require('fs');
const path = require('path');

/**
 * 头像管理器 - 管理和分配用户头像
 */
class AvatarManager {
  constructor() {
    this.avatarDir = path.join(__dirname, '../resource/Aigei_Images');
    this.avatarCache = [];
    this.loadAvatars();
  }

  /**
   * 加载所有头像文件
   */
  loadAvatars() {
    try {
      if (!fs.existsSync(this.avatarDir)) {
        console.warn('⚠️ 头像目录不存在:', this.avatarDir);
        return;
      }

      const files = fs.readdirSync(this.avatarDir);
      this.avatarCache = files
        .filter(file => /\.(jpg|jpeg|png)$/i.test(file))
        .map(file => path.join(this.avatarDir, file));

      console.log(`✅ 加载了 ${this.avatarCache.length} 个头像`);
    } catch (error) {
      console.error('❌ 加载头像失败:', error.message);
    }
  }

  /**
   * 随机获取指定数量的头像
   * @param {number} count - 需要的头像数量
   * @returns {Array<string>} - 头像文件路径数组
   */
  getRandomAvatars(count) {
    if (this.avatarCache.length === 0) {
      return [];
    }

    const shuffled = [...this.avatarCache].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, this.avatarCache.length));
  }

  /**
   * 为点赞列表分配头像
   * @param {Array<string>} names - 点赞的名字列表
   * @returns {Array<{name: string, avatar: string}>}
   */
  assignAvatarsForLikes(names) {
    const avatars = this.getRandomAvatars(names.length);
    return names.map((name, index) => ({
      name: name,
      avatar: avatars[index] || null
    }));
  }

  /**
   * 为评论列表分配头像
   * @param {Array<{name: string, content: string}>} comments - 评论列表
   * @returns {Array<{name: string, content: string, avatar: string}>}
   */
  assignAvatarsForComments(comments) {
    const avatars = this.getRandomAvatars(comments.length);
    return comments.map((comment, index) => ({
      ...comment,
      avatar: avatars[index] || null
    }));
  }

  /**
   * 获取头像总数
   */
  getAvatarCount() {
    return this.avatarCache.length;
  }
}

module.exports = AvatarManager;
