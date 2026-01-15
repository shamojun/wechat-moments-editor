# 用户管理系统文档

## 功能概述

本系统实现了完整的用户管理功能，包括：
- 用户识别（基于设备指纹）
- 免费用户每天一次使用限制
- 付费用户标识和无限使用
- 高级功能预留接口（大模型评论生成）

## 系统架构

### 1. 用户识别机制

使用**设备指纹（Device Fingerprint）**技术识别用户：
- 浏览器User-Agent
- Accept-Language
- Accept-Encoding
- IP地址

这些信息组合后通过SHA-256哈希生成唯一的用户ID。

### 2. 数据存储

使用JSON文件存储(`data/users.json`)，包含：
- **用户信息**：userId, userType, 创建时间, 用户资料
- **使用记录**：每日使用次数，使用时间，功能详情

### 3. 权限控制

#### 免费用户
- 每天限制使用**1次**
- 基础功能：修改时间、添加点赞/评论
- 主题评论匹配

#### 付费用户
- **无限次**使用
- 所有基础功能
- 🔮 **高级功能**（预留）：
  - 大模型智能评论生成
  - 基于图片内容的主题识别
  - 更多自定义选项

## API接口文档

### 1. 用户注册/获取信息

**POST** `/api/user/register`

**请求参数：**
```json
{
  "phone": "138****8888",     // 可选
  "email": "user@example.com", // 可选
  "nickname": "昵称"          // 可选
}
```

**响应：**
```json
{
  "success": true,
  "user": {
    "userId": "abc123...",
    "userType": "free",
    "createdAt": "2026-01-14T08:00:00.000Z",
    "totalUsage": 5
  },
  "stats": {
    "used": 0,
    "canUse": true
  }
}
```

### 2. 检查用户权限

**GET** `/api/user/check`

**响应：**
```json
{
  "success": true,
  "allowed": true,
  "reason": "within_limit",
  "userType": "free",
  "remainingQuota": 1,
  "message": "可以使用"
}
```

### 3. 获取用户统计

**GET** `/api/user/stats`

**响应：**
```json
{
  "success": true,
  "stats": {
    "user": { ... },
    "recentUsage": [
      { "date": "2026-01-08", "count": 1 },
      { "date": "2026-01-09", "count": 0 },
      ...
    ],
    "todayUsage": {
      "used": 1,
      "canUse": false
    }
  }
}
```

### 4. 图片处理（带权限检查）

**POST** `/api/modify`

**请求参数（FormData）：**
- `screenshot`: 图片文件
- `phone`: 手机号（可选）
- `email`: 邮箱（可选）
- `nickname`: 昵称（可选）
- ...其他图片处理参数

**成功响应：**
- 返回处理后的图片
- Headers包含 `X-Remaining-Quota`: 剩余次数

**失败响应（超出限制）：**
```json
{
  "error": "您今天的免费额度已用完，明天再来试试吧！",
  "reason": "daily_limit_reached",
  "userType": "free",
  "remainingQuota": 0,
  "upgradeHint": "升级为付费用户即可无限使用！"
}
```

### 5. 管理员统计

**GET** `/api/admin/stats`

**响应：**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "freeUsers": 140,
    "premiumUsers": 10,
    "todayUsage": 85,
    "totalUsage": 2350
  }
}
```

## 使用流程

### 前端集成示例

```html
<!-- 用户信息收集（首次访问） -->
<form id="userForm">
  <input name="phone" placeholder="手机号（可选）">
  <input name="email" placeholder="邮箱（可选）">
  <input name="nickname" placeholder="昵称（可选）">
</form>

<script>
// 1. 检查用户权限
async function checkPermission() {
  const response = await fetch('/api/user/check');
  const data = await response.json();

  if (!data.allowed) {
    alert(data.message);
    showUpgradePrompt(); // 显示升级提示
    return false;
  }

  return true;
}

// 2. 上传图片（带用户信息）
async function uploadImage(file, userInfo) {
  const formData = new FormData();
  formData.append('screenshot', file);
  formData.append('phone', userInfo.phone);
  formData.append('email', userInfo.email);
  formData.append('nickname', userInfo.nickname);
  // ...其他参数

  const response = await fetch('/api/modify', {
    method: 'POST',
    body: formData
  });

  if (response.status === 403) {
    const error = await response.json();
    alert(error.error + '\n' + error.upgradeHint);
    return;
  }

  const blob = await response.blob();
  // 下载图片
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modified_moments.png';
  a.click();

  // 显示剩余次数
  const remaining = response.headers.get('X-Remaining-Quota');
  if (remaining !== null && remaining >= 0) {
    alert(`处理成功！今日剩余次数：${remaining}`);
  }
}
</script>
```

## 数据库结构

### users.json 示例

```json
{
  "users": [
    {
      "userId": "abc123def456...",
      "fingerprint": "Mozilla/5.0...|zh-CN|gzip|192.168.1.1",
      "userType": "free",
      "createdAt": "2026-01-14T08:00:00.000Z",
      "lastVisit": "2026-01-14T10:30:00.000Z",
      "totalUsage": 5,
      "userInfo": {
        "phone": "138****8888",
        "email": "user@example.com",
        "nickname": "张三"
      }
    }
  ],
  "usageRecords": [
    {
      "userId": "abc123def456...",
      "date": "2026-01-14",
      "count": 1,
      "features": [
        {
          "timestamp": "2026-01-14T10:30:00.000Z",
          "feature": "modify",
          "options": {
            "likesCount": 25,
            "commentsCount": 10,
            "useSmartDetection": true
          }
        }
      ]
    }
  ],
  "lastUpdate": "2026-01-14T10:30:00.000Z"
}
```

## 高级功能预留

### 大模型评论生成（付费功能）

预留接口设计：

**POST** `/api/ai/smart-comment`（仅付费用户）

**请求：**
```json
{
  "userId": "abc123...",
  "image": "base64图片",
  "momentText": "朋友圈文字内容"
}
```

**流程：**
1. 验证用户为付费用户
2. 上传图片到多模态大模型（GPT-4 Vision / 通义千问VL等）
3. AI分析图片内容和文字
4. 生成高度匹配的智能评论
5. 返回评论列表

**实现建议：**
```javascript
// 在 contentGenerator.js 中
async generateAIComments(momentText, imageBuffer, count) {
  // 1. 调用大模型API
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-vision-preview',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: `这是一条朋友圈：${momentText}。请生成${count}条真实、贴切的评论。` },
          { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBuffer.toString('base64')}` } }
        ]
      }]
    })
  });

  const data = await response.json();
  return parseComments(data.choices[0].message.content);
}
```

## 付费方案建议

### 套餐设计

| 套餐 | 价格 | 每日使用次数 | 高级功能 |
|------|------|-------------|----------|
| 免费版 | ¥0 | 1次/天 | ❌ |
| 月度会员 | ¥9.9/月 | 无限次 | ✅ AI评论 |
| 年度会员 | ¥99/年 | 无限次 | ✅ AI评论 + 优先支持 |

### 支付集成

可集成的支付方式：
- 微信支付
- 支付宝
- Stripe（国际用户）

## 安全考虑

1. **设备指纹限制**
   - 用户更换浏览器/设备会被识别为新用户
   - 可通过手机号/邮箱绑定实现跨设备同步

2. **数据隐私**
   - 用户信息加密存储
   - 定期清理过期记录（默认保留30天）

3. **防滥用**
   - IP限流
   - 验证码（频繁请求时）
   - 异常检测（大量账号注册）

## 部署建议

### 生产环境

1. **数据库升级**
   - 改用MySQL/PostgreSQL
   - 或使用MongoDB（NoSQL）

2. **缓存优化**
   - 使用Redis缓存用户权限
   - 减少文件读写

3. **日志监控**
   - 记录用户行为日志
   - 监控异常访问

4. **备份**
   - 定时备份users.json
   - 异地容灾

## 测试

### 测试用例

1. **首次访问**
   - 自动创建用户
   - 可使用1次

2. **第二次访问（同一天）**
   - 识别为同一用户
   - 提示额度已用完

3. **第二天访问**
   - 额度重置
   - 可再次使用

4. **付费用户**
   - 无限次使用
   - 不受限制

### 测试命令

```bash
# 测试用户注册
curl -X POST http://localhost:3000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"phone":"13800138000","nickname":"测试用户"}'

# 测试权限检查
curl http://localhost:3000/api/user/check

# 测试管理员统计
curl http://localhost:3000/api/admin/stats
```

## 更新日志

### v1.0 (2026-01-14)
- ✅ 用户识别系统
- ✅ 免费用户每日限制
- ✅ 付费用户标识
- ✅ 使用记录统计
- ✅ REST API接口
- 🔮 高级功能预留

---

**技术栈：**
- Node.js + Express
- JSON文件存储
- 设备指纹识别
- SHA-256哈希

**未来扩展：**
- 大模型评论生成
- 图像识别主题匹配
- 用户推荐系统
- 数据分析看板
