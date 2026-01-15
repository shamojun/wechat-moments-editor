# 多平台部署指南与改造方案

## 项目技术栈分析

当前项目依赖：
- ✅ **Express** - Web 框架
- ✅ **Multer** - 文件上传
- ⚠️ **Canvas** - 图片绘制（原生C++依赖）
- ⚠️ **Sharp** - 图片处理（原生C++依赖）
- ⚠️ **Tesseract.js** - OCR识别（需要语言包下载）
- ⚠️ **文件系统** - 用户数据存储（`data/users.json`）
- ⚠️ **本地头像** - 261个头像文件（`resource/AIgei_images/`）

---

## 各平台兼容性对比

| 平台 | Canvas/Sharp | 文件系统 | 本地文件 | 冷启动 | 改造难度 | 推荐度 |
|------|--------------|----------|----------|--------|----------|--------|
| **Railway** | ✅ 完全支持 | ✅ 持久化 | ✅ 支持 | <1s | ⭐ 无需改造 | ⭐⭐⭐⭐⭐ |
| **Render** | ✅ 完全支持 | ⚠️ 临时 | ✅ 支持 | 30-60s | ⭐⭐ 需改造存储 | ⭐⭐⭐⭐ |
| **Cyclic** | ❌ 不支持 | ✅ AWS S3 | ⚠️ 需上传 | 快 | ⭐⭐⭐⭐⭐ 大改 | ⭐⭐ |
| **Vercel** | ❌ 不支持 | ❌ 只读 | ✅ 支持 | <1s | ⭐⭐⭐⭐⭐ 大改 | ⭐⭐ |
| **Fly.io** | ✅ 完全支持 | ✅ 持久化 | ✅ 支持 | <1s | ⭐ 无需改造 | ⭐⭐⭐⭐⭐ |
| **Heroku** | ✅ 完全支持 | ⚠️ 临时 | ✅ 支持 | 快 | ⭐⭐ 需改造存储 | ⭐⭐⭐⭐ |

---

## 📋 平台详细分析

### 1️⃣ Railway.app - 零改造，直接部署 ⭐⭐⭐⭐⭐

#### 兼容性
- ✅ **Canvas/Sharp**: 自动安装系统依赖
- ✅ **文件系统**: 支持持久化存储（Volumes）
- ✅ **本地头像**: 完美支持
- ✅ **环境变量**: 支持
- ✅ **自动扩展**: 支持

#### 所需改造
**无需任何改造！** 代码原封不动即可部署。

#### 部署步骤

**方式 A: CLI 部署（推荐）**
```bash
# 1. 安装 CLI
npm install -g @railway/cli

# 2. 登录
railway login

# 3. 初始化项目
railway init

# 4. 部署
railway up

# 5. 添加持久化存储（可选，用于用户数据）
railway volume create --mount /app/data

# 6. 获取域名
railway domain
```

**方式 B: GitHub 自动部署**
```bash
# 1. 推送代码到 GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main

# 2. 在 Railway 网站连接 GitHub 仓库
# https://railway.app/new
# 选择 "Deploy from GitHub repo"

# 3. Railway 自动检测并部署
```

#### 配置文件（可选）
创建 `railway.toml`:
```toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "npm start"
restartPolicyType = "on_failure"
restartPolicyMaxRetries = 10

[[services]]
name = "wechat-editor"
```

#### 环境变量设置
```bash
railway variables set PORT=3000
railway variables set NODE_ENV=production
```

#### 成本
- 免费：500小时/月（约16天24小时运行）
- 付费：$5/月起（无限时长）

---

### 2️⃣ Render.com - 轻度改造 ⭐⭐⭐⭐

#### 兼容性
- ✅ **Canvas/Sharp**: 原生支持（Docker容器）
- ⚠️ **文件系统**: 临时文件系统（重启后丢失）
- ✅ **本地头像**: 部署后可访问（但不可修改）
- ✅ **环境变量**: 支持

#### 所需改造

##### 问题：用户数据存储
Render 的文件系统是临时的，**每次重启/重新部署都会清空**。

##### 解决方案选项

**方案 A: 使用外部数据库（推荐）**

修改 `src/userManager.js` 使用 SQLite + Turso（免费云数据库）：

```javascript
// 替换文件存储为数据库
const { createClient } = require('@libsql/client');

class UserManager {
  constructor() {
    this.db = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN
    });
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // 创建表
    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        userId TEXT PRIMARY KEY,
        userType TEXT,
        createdAt INTEGER,
        totalUsage INTEGER,
        phone TEXT,
        email TEXT,
        nickname TEXT
      )
    `);

    await this.db.execute(`
      CREATE TABLE IF NOT EXISTS usage_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId TEXT,
        timestamp INTEGER,
        feature TEXT,
        options TEXT
      )
    `);

    this.initialized = true;
  }

  // 改写其他方法使用 SQL 查询...
}
```

**方案 B: 使用 Render Disks（持久化存储）**

在 Render 购买持久化磁盘（$1/月/GB）:

```yaml
# render.yaml
services:
  - type: web
    name: wechat-editor
    env: node
    buildCommand: npm install
    startCommand: npm start
    disk:
      name: user-data
      mountPath: /app/data
      sizeGB: 1
```

**方案 C: 内存存储（适合测试）**

不改造，接受每次重启数据丢失（用户系统失效但核心功能正常）。

#### 部署步骤

**创建 `render.yaml`**:
```yaml
services:
  - type: web
    name: wechat-moments-editor
    env: node
    region: singapore  # 或 oregon
    plan: free  # 或 starter ($7/月)
    buildCommand: npm install
    startCommand: npm start
    healthCheckPath: /
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
```

**通过 Dashboard 部署**:
1. 访问 https://render.com
2. "New" → "Web Service"
3. 连接 GitHub 仓库
4. 选择 "Node" 环境
5. Build Command: `npm install`
6. Start Command: `npm start`
7. 点击 "Create Web Service"

#### 注意事项
- ⚠️ 免费套餐：服务闲置15分钟后会休眠，下次访问冷启动需 30-60 秒
- ✅ 付费套餐（$7/月）：不休眠

---

### 3️⃣ Cyclic.sh - 需要大量改造 ⭐⭐

#### 兼容性
- ❌ **Canvas/Sharp**: 不支持原生模块
- ✅ **文件系统**: AWS S3存储
- ⚠️ **本地头像**: 需上传到 S3

#### 所需改造

##### 1. 替换图片处理库

**问题**：Cyclic 运行在 AWS Lambda 上，不支持 canvas/sharp

**解决方案**：使用外部图片处理 API

```javascript
// 新建 src/imageProcessorClient.js
class ImageProcessorClient {
  constructor() {
    this.apiUrl = process.env.IMAGE_PROCESSOR_URL || 'https://your-railway-app.railway.app';
  }

  async modifyScreenshot(buffer, options) {
    const formData = new FormData();
    formData.append('screenshot', new Blob([buffer]));
    formData.append('options', JSON.stringify(options));

    const response = await fetch(`${this.apiUrl}/api/process`, {
      method: 'POST',
      body: formData,
      headers: {
        'Authorization': `Bearer ${process.env.API_SECRET}`
      }
    });

    return await response.arrayBuffer();
  }
}
```

然后在 Railway/Render 部署实际的图片处理服务。

##### 2. 文件存储改为 S3

```javascript
// src/userManager.js
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

class UserManager {
  async saveData() {
    const data = {
      users: Array.from(this.users.values()),
      usageRecords: Array.from(this.usageRecords.values())
    };

    await s3.putObject({
      Bucket: process.env.CYCLIC_BUCKET_NAME,
      Key: 'users.json',
      Body: JSON.stringify(data),
      ContentType: 'application/json'
    }).promise();
  }

  async loadData() {
    try {
      const result = await s3.getObject({
        Bucket: process.env.CYCLIC_BUCKET_NAME,
        Key: 'users.json'
      }).promise();

      const data = JSON.parse(result.Body.toString());
      // 恢复数据...
    } catch (error) {
      console.log('No existing data');
    }
  }
}
```

##### 3. 头像文件上传到 S3

```bash
# 使用 AWS CLI 上传头像
aws s3 sync ./resource/AIgei_images s3://your-bucket/avatars/

# 或在代码中引用 S3 URL
const avatarUrl = `https://${process.env.CYCLIC_BUCKET_NAME}.s3.amazonaws.com/avatars/${filename}`;
```

#### 评估
**不推荐**：改造工作量大，需要维护两套服务（Cyclic + 图片处理服务）

---

### 4️⃣ Vercel - 需要大量改造 ⭐⭐

#### 兼容性
- ❌ **Canvas/Sharp**: 不支持（Serverless Functions）
- ❌ **文件系统**: 只读文件系统
- ✅ **本地头像**: 可以读取（打包在部署中）
- ⚠️ **Express**: 需要改为 API Routes

#### 所需改造

##### 1. 架构调整

Vercel 不支持 Express 长连接服务器，需要改为：
```
前端（Vercel Pages）
    ↓
API Routes（Vercel Serverless Functions）
    ↓
外部图片处理服务（Railway/Render）
```

##### 2. 项目结构重组

```
vercel-app/
├── public/              # 前端静态文件
│   ├── index.html
│   └── resource/        # 头像文件
├── api/                 # Vercel API Routes
│   ├── modify.js        # 替代 POST /api/modify
│   ├── user/
│   │   ├── register.js
│   │   └── check.js
│   └── admin/
│       └── stats.js
├── lib/                 # 共享代码
│   ├── userManager.js   # 改用 Vercel KV 存储
│   └── imageClient.js   # 调用外部图片服务
├── vercel.json          # 配置文件
└── package.json
```

##### 3. API Routes 示例

**api/modify.js**:
```javascript
import { imageProcessorClient } from '../lib/imageClient';
import { userManager } from '../lib/userManager';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 解析文件上传（使用 formidable）
  const { file, options } = await parseForm(req);

  // 检查权限
  const permission = await userManager.checkPermission(req);
  if (!permission.allowed) {
    return res.status(403).json({ error: '超出使用次数' });
  }

  // 调用外部图片处理服务
  const modifiedBuffer = await imageProcessorClient.modifyScreenshot(
    file.buffer,
    options
  );

  // 记录使用
  await userManager.recordUsage(permission.user.userId);

  res.setHeader('Content-Type', 'image/png');
  res.send(modifiedBuffer);
}

export const config = {
  api: {
    bodyParser: false,  // 禁用默认解析器，手动处理文件
  },
};
```

##### 4. 用户数据存储改为 Vercel KV

```bash
# 安装 Vercel KV
npm install @vercel/kv
```

```javascript
// lib/userManager.js
import { kv } from '@vercel/kv';

class UserManager {
  async getUser(userId) {
    return await kv.get(`user:${userId}`);
  }

  async saveUser(userId, userData) {
    await kv.set(`user:${userId}`, userData);
  }

  async getUsageCount(userId, date) {
    const key = `usage:${userId}:${date}`;
    return (await kv.get(key)) || 0;
  }

  async incrementUsage(userId, date) {
    const key = `usage:${userId}:${date}`;
    await kv.incr(key);
    await kv.expire(key, 86400); // 24小时过期
  }
}
```

##### 5. 配置文件

**vercel.json**:
```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/resource/(.*)",
      "dest": "/public/resource/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "env": {
    "IMAGE_PROCESSOR_URL": "https://your-railway-app.railway.app",
    "API_SECRET": "@api-secret"
  }
}
```

#### 评估
**不推荐用于此项目**：
- 需要完全重写后端代码
- 仍然需要外部图片处理服务
- 工作量最大

---

### 5️⃣ Fly.io - 零改造，完美支持 ⭐⭐⭐⭐⭐

#### 兼容性
- ✅ **Canvas/Sharp**: 完全支持（Docker容器）
- ✅ **文件系统**: 持久化存储（Volumes）
- ✅ **本地头像**: 完美支持
- ✅ **全球部署**: 支持多区域

#### 所需改造
**无需改造！**

#### 部署步骤

```bash
# 1. 安装 flyctl
# Windows (PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# 2. 登录
fly auth login

# 3. 初始化应用（会自动生成 fly.toml）
fly launch

# 选项：
# - App name: wechat-moments-editor
# - Region: Singapore (sin) / Hong Kong (hkg) / Tokyo (nrt)
# - PostgreSQL: No
# - Redis: No

# 4. 创建持久化存储
fly volumes create user_data --region sin --size 1  # 1GB

# 5. 部署
fly deploy

# 6. 查看应用
fly open
```

#### 自动生成的 fly.toml

```toml
app = "wechat-moments-editor"
primary_region = "sin"

[build]
  builder = "heroku/buildpacks:20"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  http_checks = []
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    force_https = true
    handlers = ["http"]
    port = 80

  [[services.ports]]
    handlers = ["tls", "http"]
    port = 443

[[mounts]]
  destination = "/app/data"
  source = "user_data"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

#### 成本
- 免费：3个应用，每个 256MB RAM
- 付费：按使用量计费（约 $2-5/月）

---

### 6️⃣ Heroku - 轻度改造 ⭐⭐⭐⭐

#### 兼容性
- ✅ **Canvas/Sharp**: 支持（需要 Buildpack）
- ⚠️ **文件系统**: 临时（ephemeral）
- ✅ **本地头像**: 支持
- ✅ **插件生态**: 丰富

#### 所需改造

需要添加 Canvas Buildpack 和外部数据库。

#### 部署步骤

```bash
# 1. 安装 Heroku CLI
# Windows
choco install heroku-cli

# 或下载安装器
# https://devcenter.heroku.com/articles/heroku-cli

# 2. 登录
heroku login

# 3. 创建应用
heroku create wechat-moments-editor

# 4. 添加 Canvas Buildpack
heroku buildpacks:add --index 1 https://github.com/heroku/heroku-buildpack-apt
heroku buildpacks:add --index 2 heroku/nodejs

# 5. 创建 Aptfile（Canvas依赖）
echo "libcairo2-dev
libjpeg-dev
libpango1.0-dev
libgif-dev
build-essential
g++" > Aptfile

# 6. 部署
git push heroku main

# 7. 添加数据库（可选）
heroku addons:create heroku-postgresql:mini  # $5/月

# 8. 查看应用
heroku open
```

#### 数据存储方案

**方案 A: 使用 Heroku Postgres**
```javascript
// 改用 PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});
```

**方案 B: 使用 Redis**
```bash
heroku addons:create heroku-redis:mini  # $3/月
```

#### 成本
- ❌ 无免费套餐（2022年11月取消）
- 💰 Eco Dyno: $5/月
- 💰 Basic Dyno: $7/月

---

## 🎯 最终推荐

### 按需求推荐

#### 1. 零改造 + 免费
**推荐：Railway 或 Fly.io**

```bash
# Railway
railway login && railway init && railway up

# Fly.io
fly launch && fly deploy
```

#### 2. 稳定生产环境
**推荐：Fly.io（多区域） + Railway（简单）**

- Fly.io: 全球部署，低延迟
- Railway: 简单易用，快速迭代

#### 3. 最低成本
**推荐：Railway 免费层 + Render 免费层**

- Railway: 主服务（500小时/月）
- Render: 备份服务（自动休眠）

#### 4. 企业级
**推荐：Fly.io + PostgreSQL + S3**

- Fly.io: 计算
- Supabase/Neon: PostgreSQL
- Cloudflare R2: 文件存储

---

## 📦 通用改造建议

### 1. 环境变量管理

创建 `.env.example`:
```bash
PORT=3000
NODE_ENV=production

# 数据库（如果使用）
DATABASE_URL=
REDIS_URL=

# 外部服务（如果需要）
IMAGE_PROCESSOR_URL=
API_SECRET=

# 功能开关
ENABLE_OCR=true
ENABLE_USER_SYSTEM=true
```

### 2. Docker 支持（通用）

创建 `Dockerfile`:
```dockerfile
FROM node:18-alpine

# 安装 Canvas 依赖
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. 健康检查端点

在 `server.js` 添加:
```javascript
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

### 4. 优雅关闭

```javascript
// server.js 末尾添加
const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信号，准备关闭...');
  server.close(() => {
    console.log('服务器已关闭');
    process.exit(0);
  });
});
```

---

## 🚀 快速决策表

**您的情况 → 推荐方案**

| 情况 | 推荐平台 | 理由 |
|------|----------|------|
| 想要最快部署 | **Railway** | 3分钟部署，零配置 |
| 需要全球加速 | **Fly.io** | 多区域部署 |
| 预算有限 | **Railway 免费层** | 500小时/月免费 |
| 已有 Heroku 经验 | **Render** | 类似 Heroku，更便宜 |
| 需要 Serverless | **不推荐此项目** | Canvas 不兼容 |

---

## 下一步行动

请告诉我：
1. **您偏好哪个平台？**（Railway / Render / Fly.io / 其他）
2. **是否需要持久化用户数据？**（数据库方案）
3. **预算范围？**（免费 / 5-10美元/月 / 不限）

我会为您提供该平台的详细部署指导和必要的代码改造。
