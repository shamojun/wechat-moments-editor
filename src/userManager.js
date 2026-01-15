/**
 * 用户管理模块
 * 功能：
 * 1. 用户识别（基于设备指纹）
 * 2. 使用次数限制（免费用户每天一次）
 * 3. 付费用户管理
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class UserManager {
  constructor(dbPath = path.join(__dirname, '../data/users.json')) {
    this.dbPath = dbPath;
    this.users = new Map();
    this.usageRecords = new Map();
    this.initialized = false;
  }

  /**
   * 初始化数据库
   */
  async init() {
    if (this.initialized) return;

    try {
      // 确保data目录存在
      const dataDir = path.dirname(this.dbPath);
      try {
        await fs.access(dataDir);
      } catch {
        await fs.mkdir(dataDir, { recursive: true });
      }

      // 加载现有数据
      try {
        const data = await fs.readFile(this.dbPath, 'utf8');
        const parsed = JSON.parse(data);

        // 恢复用户数据
        if (parsed.users) {
          parsed.users.forEach(user => {
            this.users.set(user.userId, user);
          });
        }

        // 恢复使用记录
        if (parsed.usageRecords) {
          parsed.usageRecords.forEach(record => {
            const key = `${record.userId}_${record.date}`;
            this.usageRecords.set(key, record);
          });
        }

        console.log(`用户数据已加载: ${this.users.size}个用户, ${this.usageRecords.size}条记录`);
      } catch (error) {
        // 文件不存在或解析失败，创建新数据库
        console.log('创建新的用户数据库');
        await this.save();
      }

      this.initialized = true;
    } catch (error) {
      console.error('初始化用户数据库失败:', error);
      throw error;
    }
  }

  /**
   * 保存数据到文件
   */
  async save() {
    const data = {
      users: Array.from(this.users.values()),
      usageRecords: Array.from(this.usageRecords.values()),
      lastUpdate: new Date().toISOString()
    };

    await fs.writeFile(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
  }

  /**
   * 生成用户ID（基于设备指纹）
   */
  generateUserId(fingerprint) {
    return crypto
      .createHash('sha256')
      .update(fingerprint)
      .digest('hex')
      .substring(0, 32);
  }

  /**
   * 生成设备指纹（基于浏览器信息）
   */
  generateFingerprint(req) {
    const components = [
      req.headers['user-agent'] || '',
      req.headers['accept-language'] || '',
      req.headers['accept-encoding'] || '',
      req.ip || req.connection.remoteAddress || ''
    ];

    return components.join('|');
  }

  /**
   * 获取或创建用户
   */
  async getOrCreateUser(req, userInfo = {}) {
    await this.init();

    // 生成设备指纹
    const fingerprint = this.generateFingerprint(req);
    const userId = this.generateUserId(fingerprint);

    // 查找现有用户
    let user = this.users.get(userId);

    if (!user) {
      // 创建新用户
      user = {
        userId,
        fingerprint,
        userType: 'free', // 'free' | 'premium'
        createdAt: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        totalUsage: 0,
        userInfo: {
          phone: userInfo.phone || null,
          email: userInfo.email || null,
          nickname: userInfo.nickname || null,
          ...userInfo
        }
      };

      this.users.set(userId, user);
      await this.save();
      console.log(`新用户注册: ${userId}`);
    } else {
      // 更新最后访问时间
      user.lastVisit = new Date().toISOString();

      // 更新用户信息（如果提供）
      if (Object.keys(userInfo).length > 0) {
        user.userInfo = {
          ...user.userInfo,
          ...userInfo
        };
      }

      await this.save();
    }

    return user;
  }

  /**
   * 检查用户今天是否已使用
   */
  async checkTodayUsage(userId) {
    await this.init();

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const key = `${userId}_${today}`;
    const record = this.usageRecords.get(key);

    return {
      used: record ? record.count : 0,
      canUse: !record || record.count === 0
    };
  }

  /**
   * 记录使用
   */
  async recordUsage(userId, features = {}) {
    await this.init();

    const today = new Date().toISOString().split('T')[0];
    const key = `${userId}_${today}`;

    let record = this.usageRecords.get(key);

    if (!record) {
      record = {
        userId,
        date: today,
        count: 0,
        features: []
      };
    }

    record.count += 1;
    record.features.push({
      timestamp: new Date().toISOString(),
      ...features
    });

    this.usageRecords.set(key, record);

    // 更新用户总使用次数
    const user = this.users.get(userId);
    if (user) {
      user.totalUsage += 1;
    }

    await this.save();
    console.log(`用户 ${userId} 使用记录: 今日第${record.count}次`);

    return record;
  }

  /**
   * 检查用户权限
   * @returns {Object} { allowed: boolean, reason: string, remainingQuota: number }
   */
  async checkPermission(req, userInfo = {}) {
    await this.init();

    const user = await this.getOrCreateUser(req, userInfo);
    const usage = await this.checkTodayUsage(user.userId);

    // 付费用户无限制
    if (user.userType === 'premium') {
      return {
        allowed: true,
        reason: 'premium_user',
        user,
        remainingQuota: -1 // 无限
      };
    }

    // 免费用户每天一次
    if (usage.used >= 1) {
      return {
        allowed: false,
        reason: 'daily_limit_reached',
        user,
        remainingQuota: 0,
        message: '您今天的免费额度已用完，明天再来试试吧！'
      };
    }

    return {
      allowed: true,
      reason: 'within_limit',
      user,
      remainingQuota: 1 - usage.used
    };
  }

  /**
   * 升级用户为付费用户
   */
  async upgradeUser(userId, expiryDate = null) {
    await this.init();

    const user = this.users.get(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    user.userType = 'premium';
    user.premiumInfo = {
      upgradedAt: new Date().toISOString(),
      expiryDate: expiryDate || null // null表示永久
    };

    await this.save();
    console.log(`用户 ${userId} 已升级为付费用户`);

    return user;
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(userId) {
    await this.init();

    const user = this.users.get(userId);
    if (!user) {
      return null;
    }

    // 统计最近7天的使用情况
    const recentDays = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const key = `${userId}_${dateStr}`;
      const record = this.usageRecords.get(key);

      recentDays.push({
        date: dateStr,
        count: record ? record.count : 0
      });
    }

    return {
      user,
      recentUsage: recentDays,
      todayUsage: await this.checkTodayUsage(userId)
    };
  }

  /**
   * 获取所有用户统计
   */
  async getAllStats() {
    await this.init();

    const totalUsers = this.users.size;
    const freeUsers = Array.from(this.users.values()).filter(u => u.userType === 'free').length;
    const premiumUsers = totalUsers - freeUsers;

    const today = new Date().toISOString().split('T')[0];
    const todayRecords = Array.from(this.usageRecords.values()).filter(r => r.date === today);
    const todayUsage = todayRecords.reduce((sum, r) => sum + r.count, 0);

    return {
      totalUsers,
      freeUsers,
      premiumUsers,
      todayUsage,
      totalUsage: Array.from(this.usageRecords.values()).reduce((sum, r) => sum + r.count, 0)
    };
  }

  /**
   * 清理过期数据（保留最近30天）
   */
  async cleanup(daysToKeep = 30) {
    await this.init();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    let removed = 0;
    for (const [key, record] of this.usageRecords.entries()) {
      if (record.date < cutoffStr) {
        this.usageRecords.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      await this.save();
      console.log(`清理了 ${removed} 条过期记录`);
    }

    return removed;
  }
}

module.exports = UserManager;
