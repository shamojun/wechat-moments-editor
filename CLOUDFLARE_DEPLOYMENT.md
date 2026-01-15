# Cloudflare 部署方案

## 问题说明

当前项目使用 `canvas` 和 `sharp` 进行图片处理，这两个包都依赖原生 C++ 编译，**无法直接运行在 Cloudflare Workers/Pages** 上。

Cloudflare Workers 是 V8 isolates 运行环境，不支持：
- ❌ 原生 Node.js 模块（canvas, sharp）
- ❌ 文件系统操作（fs）
- ❌ 子进程（child_process）
- ❌ 原生 C++ 扩展

---

## 推荐方案对比

| 方案 | 难度 | 成本 | 性能 | 推荐度 |
|------|------|------|------|--------|
| **方案 1: Cloudflare Workers + 外部图片处理服务** | ⭐⭐ | 💰 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **方案 2: 完全重写为浏览器端处理** | ⭐⭐⭐⭐⭐ | 免费 | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **方案 3: 使用 Cloudflare Workers + Docker（外部）** | ⭐⭐⭐ | 💰💰 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **方案 4: 部署到其他支持 Node.js 的平台** | ⭐ | 免费/💰 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |

---

## ⭐ 方案 1: Cloudflare Workers + 外部图片处理 API（推荐）

### 架构设计

```
用户上传图片
    ↓
Cloudflare Workers (路由、业务逻辑)
    ↓
外部图片处理服务 (canvas/sharp)
    ↓
返回处理后的图片
```

### 实现步骤

#### 1. 前端保持不变（Cloudflare Pages）
- 上传 `public/` 目录到 Cloudflare Pages
- HTML/CSS/JS 正常工作

#### 2. Workers 处理业务逻辑
```javascript
// workers/api.js
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/api/modify') {
      // 接收图片上传
      const formData = await request.formData();
      const image = formData.get('screenshot');

      // 转发到外部处理服务
      const response = await fetch(env.IMAGE_PROCESSOR_URL, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${env.API_SECRET}`
        }
      });

      return response;
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

#### 3. 外部图片处理服务选项

**选项 A: 使用免费/低成本平台部署 Node.js 服务**
- Railway.app（免费 500 小时/月）
- Render.com（免费层）
- Fly.io（免费层）
- Heroku（付费，$5/月起）

**选项 B: 使用云函数**
- AWS Lambda + Container（支持 canvas/sharp）
- Google Cloud Run（支持 Docker）
- Azure Container Instances

### 优点
✅ 利用 Cloudflare 全球 CDN 加速
✅ Workers 处理轻量级逻辑（路由、验证）
✅ 图片处理在专门服务上，性能稳定
✅ 可以分别扩展各个部分

### 缺点
❌ 需要维护两个服务
❌ 外部服务可能有延迟
❌ 可能产生额外成本

### 成本估算
- Cloudflare Workers: 免费（10万请求/天）
- Cloudflare Pages: 免费
- Railway/Render: 免费层或 $5-10/月

---

## ⭐⭐⭐⭐ 方案 2: 完全改写为浏览器端处理（纯前端方案）

### 核心思路
使用浏览器原生 Canvas API 在客户端处理图片，完全不需要后端。

### 实现方案

```javascript
// 浏览器端处理图片
async function modifyScreenshotInBrowser(imageFile, options) {
  // 1. 读取图片
  const img = await loadImage(imageFile);

  // 2. 创建 Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = img.width;
  canvas.height = img.height;

  // 3. 绘制原图
  ctx.drawImage(img, 0, 0);

  // 4. 绘制时间
  ctx.font = '28px PingFang SC';
  ctx.fillStyle = '#999';
  ctx.fillText(options.newTime, timeX, timeY);

  // 5. 绘制点赞
  drawLikes(ctx, options.likes);

  // 6. 绘制评论
  drawComments(ctx, options.comments);

  // 7. 导出图片
  return canvas.toBlob('image/png');
}
```

### 优点
✅ **完全免费** - 只需要 Cloudflare Pages（免费）
✅ **无服务器成本** - 所有处理在用户浏览器
✅ **隐私友好** - 图片不上传服务器
✅ **快速部署** - 只需静态文件
✅ **无需 canvas 包** - 使用浏览器原生 API

### 缺点
❌ OCR 功能需要改用 Tesseract.js 在浏览器运行（较慢）
❌ 需要大量重写代码
❌ 浏览器字体渲染可能有差异
❌ 本地头像需要全部打包到前端（261个文件）

### 改造工作量
- 🔴 **高**：需要重写整个 `editor.js`
- 预计 2-3 天开发时间
- 需要测试浏览器兼容性

### 适用场景
- ✅ 个人项目、学习项目
- ✅ 低成本要求
- ✅ 注重隐私
- ❌ 不适合需要 OCR 的场景

---

## ⭐⭐⭐⭐ 方案 3: Cloudflare Workers + 外部 Docker 容器

### 架构
```
Cloudflare Workers (API Gateway)
    ↓
Google Cloud Run / AWS Lambda (Docker with Node.js + canvas)
```

### 部署步骤

#### 1. 创建 Dockerfile
```dockerfile
FROM node:18-alpine

# 安装 canvas 依赖
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 8080

CMD ["node", "src/server.js"]
```

#### 2. 部署到 Google Cloud Run
```bash
# 构建并推送
gcloud builds submit --tag gcr.io/PROJECT_ID/wechat-editor

# 部署
gcloud run deploy wechat-editor \
  --image gcr.io/PROJECT_ID/wechat-editor \
  --platform managed \
  --region asia-east1 \
  --allow-unauthenticated
```

#### 3. Cloudflare Workers 作为代理
```javascript
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 代理到 Cloud Run
    const cloudRunUrl = env.CLOUD_RUN_URL + url.pathname;
    return fetch(cloudRunUrl, {
      method: request.method,
      headers: request.headers,
      body: request.body
    });
  }
};
```

### 优点
✅ 代码无需修改
✅ Cloudflare 提供 CDN 和 DDoS 防护
✅ Cloud Run 自动扩展
✅ 支持所有 Node.js 功能

### 缺点
❌ Cloud Run 有成本（免费层：200万请求/月）
❌ 需要 Google Cloud 账号
❌ 架构较复杂

### 成本
- Cloudflare: 免费
- Google Cloud Run: 免费层或 ~$5/月

---

## ⭐⭐⭐⭐⭐ 方案 4: 换个平台部署（最简单）

如果不一定要用 Cloudflare，可以直接部署到支持 Node.js 的平台：

### 推荐平台

#### 1. **Railway.app**（强烈推荐）
```bash
# 一键部署
railway login
railway init
railway up
```

**优点**：
✅ 免费 500 小时/月
✅ 自动检测 Node.js 项目
✅ 自动安装 canvas 依赖
✅ 提供免费域名
✅ 支持环境变量
✅ GitHub 自动部署

**限制**：
- 内存：8GB
- 带宽：100GB/月

#### 2. **Render.com**
```bash
# 创建 render.yaml
services:
  - type: web
    name: wechat-editor
    env: node
    buildCommand: npm install
    startCommand: npm start
```

**优点**：
✅ 免费层（512MB RAM）
✅ 自动 SSL
✅ GitHub 自动部署

#### 3. **Fly.io**
```bash
fly launch
fly deploy
```

**优点**：
✅ 免费 3 个应用
✅ 全球边缘网络
✅ 支持 Docker

#### 4. **Vercel（需要改造）**
⚠️ Vercel 也是 serverless，需要改为 API Routes + 外部图片处理

---

## 📊 最终推荐

### 如果必须用 Cloudflare：
**推荐方案 2（纯前端）** + **方案 1（Workers + Railway）**

1. **第一阶段**：使用 Railway 部署完整后端（5分钟搞定）
2. **第二阶段**：逐步改造为浏览器端处理

### 如果可以换平台：
**直接用 Railway.app**（最快最简单）

```bash
# 3 步部署
railway login
railway init
railway up

# 完成！获得：https://your-app.railway.app
```

---

## 🚀 立即部署指南（Railway）

### 1. 安装 Railway CLI
```bash
npm install -g @railway/cli
```

### 2. 登录
```bash
railway login
```

### 3. 初始化项目
```bash
cd c:\tianti\AI\startup
railway init
```

### 4. 部署
```bash
railway up
```

### 5. 设置环境变量（如果需要）
```bash
railway variables set PORT=3000
```

### 6. 获取域名
```bash
railway domain
```

**完成！** 您的应用现在运行在：`https://your-app.railway.app`

---

## 总结

| 需求 | 推荐方案 |
|------|----------|
| 必须用 Cloudflare + 零成本 | 方案 2（纯前端改造） |
| 必须用 Cloudflare + 可接受成本 | 方案 1（Workers + Railway后端） |
| 不限平台，追求简单 | **Railway.app（最推荐）** |
| 高流量，需要全球加速 | 方案 3（Cloudflare + Cloud Run） |

---

## 下一步

请告诉我您的选择：
1. 我帮您部署到 Railway（最快，5分钟）
2. 改造为纯前端方案（需要 2-3 天）
3. 配置 Cloudflare + 外部服务
4. 其他需求

