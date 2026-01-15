const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const WeChatMomentsEditor = require('./editor');
const UserManager = require('./userManager');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });
const editor = new WeChatMomentsEditor();
const userManager = new UserManager();

// 静态文件服务
app.use(express.static('public'));
app.use('/resource', express.static('resource')); // 提供头像文件访问
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 首页
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// 用户注册/获取用户信息
app.post('/api/user/register', async (req, res) => {
  try {
    const userInfo = {
      phone: req.body.phone,
      email: req.body.email,
      nickname: req.body.nickname
    };

    const user = await userManager.getOrCreateUser(req, userInfo);
    const stats = await userManager.getUserStats(user.userId);

    res.json({
      success: true,
      user: {
        userId: user.userId,
        userType: user.userType,
        createdAt: user.createdAt,
        totalUsage: user.totalUsage
      },
      stats: stats.todayUsage
    });
  } catch (error) {
    console.error('注册用户时出错:', error);
    res.status(500).json({ error: '注册失败: ' + error.message });
  }
});

// 检查用户权限
app.get('/api/user/check', async (req, res) => {
  try {
    const permission = await userManager.checkPermission(req);

    res.json({
      success: true,
      allowed: permission.allowed,
      reason: permission.reason,
      userType: permission.user.userType,
      remainingQuota: permission.remainingQuota,
      message: permission.message || '可以使用'
    });
  } catch (error) {
    console.error('检查权限时出错:', error);
    res.status(500).json({ error: '检查失败: ' + error.message });
  }
});

// 获取用户统计
app.get('/api/user/stats', async (req, res) => {
  try {
    const user = await userManager.getOrCreateUser(req);
    const stats = await userManager.getUserStats(user.userId);

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取统计信息时出错:', error);
    res.status(500).json({ error: '获取失败: ' + error.message });
  }
});

// 管理员：获取所有统计
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await userManager.getAllStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('获取统计信息时出错:', error);
    res.status(500).json({ error: '获取失败: ' + error.message });
  }
});

// 上传并处理图片
app.post('/api/modify', upload.single('screenshot'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    // 检查用户权限
    const userInfo = {
      phone: req.body.phone,
      email: req.body.email,
      nickname: req.body.nickname
    };

    const permission = await userManager.checkPermission(req, userInfo);

    if (!permission.allowed) {
      return res.status(403).json({
        error: permission.message || '已超出今日免费使用次数',
        reason: permission.reason,
        userType: permission.user.userType,
        remainingQuota: permission.remainingQuota,
        upgradeHint: '升级为付费用户即可无限使用！'
      });
    }

    const options = {
      newTime: req.body.newTime || undefined,
      likesCount: req.body.likesCount ? parseInt(req.body.likesCount) : undefined,
      commentsCount: req.body.commentsCount ? parseInt(req.body.commentsCount) : undefined,
      screenshotType: req.body.screenshotType || null,
      useSmartDetection: req.body.useSmartDetection === 'true'
    };

    // 如果提供了自定义点赞名单
    if (req.body.customLikeNames) {
      options.customLikeNames = req.body.customLikeNames.split(',').map(s => s.trim());
    }

    // 如果提供了自定义评论
    if (req.body.customComments) {
      try {
        options.customComments = JSON.parse(req.body.customComments);
      } catch (e) {
        // 忽略解析错误，使用默认随机评论
      }
    }

    const modifiedBuffer = await editor.modifyScreenshot(req.file.buffer, options);

    // 记录使用
    await userManager.recordUsage(permission.user.userId, {
      feature: 'modify',
      options: {
        likesCount: options.likesCount,
        commentsCount: options.commentsCount,
        useSmartDetection: options.useSmartDetection
      }
    });

    // 设置响应头
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename=modified_moments.png',
      'X-Remaining-Quota': permission.remainingQuota - 1
    });

    res.send(modifiedBuffer);
  } catch (error) {
    console.error('处理图片时出错:', error);
    res.status(500).json({ error: '处理图片失败: ' + error.message });
  }
});

// 批量处理
app.post('/api/batch-modify', upload.array('screenshots', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '请上传至少一张图片' });
    }

    const options = {
      likesCount: req.body.likesCount ? parseInt(req.body.likesCount) : undefined,
      commentsCount: req.body.commentsCount ? parseInt(req.body.commentsCount) : undefined,
      screenshotType: req.body.screenshotType || null
    };

    const results = [];
    for (const file of req.files) {
      const modifiedBuffer = await editor.modifyScreenshot(file.buffer, options);
      results.push({
        filename: file.originalname,
        data: modifiedBuffer.toString('base64')
      });
    }

    res.json({ success: true, images: results });
  } catch (error) {
    console.error('批量处理图片时出错:', error);
    res.status(500).json({ error: '批量处理失败: ' + error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
