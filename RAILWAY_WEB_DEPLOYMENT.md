# Railway Web 界面部署指南（无需 CLI）

## 🌐 方法一：GitHub 自动部署（最推荐）

### 步骤 1: 将代码推送到 GitHub

```powershell
# 如果还没有 git 仓库，初始化
cd c:\tianti\AI\startup

git init
git add .
git commit -m "Initial commit: WeChat Moments Editor"

# 创建 GitHub 仓库（在 GitHub 网站操作）
# 1. 访问 https://github.com/new
# 2. 仓库名：wechat-moments-editor
# 3. 设为 Private（如果不想公开）
# 4. 不要勾选 README、.gitignore、license
# 5. 点击 "Create repository"

# 然后关联并推送
git remote add origin https://github.com/你的用户名/wechat-moments-editor.git
git branch -M main
git push -u origin main
```

### 步骤 2: 在 Railway 部署

1. **访问 Railway**: https://railway.app/

2. **登录/注册**
   - 点击右上角 "Login"
   - 建议使用 GitHub 账号登录（方便关联仓库）

3. **创建新项目**
   - 点击 "New Project"
   - 选择 "Deploy from GitHub repo"

4. **授权 GitHub**
   - 首次使用需要授权 Railway 访问 GitHub
   - 点击 "Configure GitHub App"
   - 选择授权所有仓库或特定仓库

5. **选择仓库**
   - 在列表中找到 `wechat-moments-editor`
   - 点击仓库名

6. **等待部署**
   - Railway 自动检测 Node.js 项目
   - 自动运行 `npm install`（包括编译 canvas/sharp）
   - 自动启动服务

   进度显示：
   ```
   ⏳ Building...
   📦 Installing dependencies
   🔨 Building native modules (canvas, sharp)
   ✅ Build successful
   🚀 Deploying...
   ✅ Deployment successful
   ```

7. **生成域名**
   - 部署成功后，点击项目
   - 点击 "Settings" → "Networking"
   - 点击 "Generate Domain"
   - 获得域名：`wechat-moments-editor-production.up.railway.app`

### 步骤 3: 访问应用

复制生成的域名，在浏览器访问：
```
https://your-project-name.up.railway.app
```

**完成！** 🎉

---

## 🌐 方法二：从本地部署（不用 GitHub）

如果不想使用 GitHub，可以直接从本地上传：

### 步骤 1: 创建项目

1. 访问 https://railway.app/new
2. 点击 "Empty Project"
3. 为项目命名：`wechat-moments-editor`

### 步骤 2: 添加服务

1. 点击 "+ New"
2. 选择 "Empty Service"

### 步骤 3: 配置部署

1. 点击新创建的服务
2. 进入 "Settings"
3. 设置：
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: `/`

### 步骤 4: 手动上传代码

由于没有 CLI，需要先连接 GitHub 或使用 Railway CLI（如果 CLI 可用）。

**推荐使用方法一（GitHub）**，因为：
- ✅ 自动部署
- ✅ 代码版本管理
- ✅ 回滚方便
- ✅ 持续集成

---

## 🔧 解决 CLI 安装问题（可选）

如果您想使用 CLI，需要先解决网络问题：

### 方案 A: 临时关闭代理

```powershell
# 检查代理设置
echo $env:HTTP_PROXY
echo $env:HTTPS_PROXY

# 临时关闭代理
$env:HTTP_PROXY=""
$env:HTTPS_PROXY=""

# npm 也关闭代理
npm config delete proxy
npm config delete https-proxy

# 重新安装
npm install -g @railway/cli
```

### 方案 B: 使用国内镜像

```powershell
# 使用 taobao 镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install -g @railway/cli

# 恢复官方镜像（可选）
npm config set registry https://registry.npmjs.org
```

### 方案 C: 手动下载安装

1. 访问 Railway CLI Releases:
   https://github.com/railwayapp/cli/releases

2. 下载 Windows 版本：
   `railway-v4.25.1-x86_64-pc-windows-gnu.zip`

3. 解压到目录，例如：`C:\Railway\`

4. 添加到系统 PATH：
   ```powershell
   $env:PATH += ";C:\Railway"
   ```

5. 验证：
   ```powershell
   railway --version
   ```

---

## 🎯 推荐流程

### 最简单的方式（5分钟完成）：

1. **将代码推送到 GitHub** （2分钟）
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   # 在 GitHub 创建仓库后
   git remote add origin https://github.com/你的用户名/wechat-moments-editor.git
   git push -u origin main
   ```

2. **在 Railway 连接 GitHub** （3分钟）
   - 访问 https://railway.app/
   - 使用 GitHub 登录
   - "New Project" → "Deploy from GitHub repo"
   - 选择您的仓库
   - 等待自动部署

3. **生成域名并访问**
   - Settings → Networking → Generate Domain
   - 复制域名，浏览器访问

**就这么简单！** 无需安装任何 CLI 工具。

---

## ✅ 部署成功标志

访问您的域名，应该看到：
- 朋友圈编辑器首页
- 可以上传图片
- 可以生成带点赞和评论的截图
- 本地头像正常加载

Railway Dashboard 日志显示：
```
本地头像已加载: 261个文件
主题检测器已加载，支持14种主题
名字库大小: 79
评论库大小: 193
服务器运行在 http://localhost:10000
```

---

## 📞 需要帮助？

告诉我您卡在哪一步，我会详细指导：
1. GitHub 推送代码
2. Railway 连接仓库
3. 配置部署设置
4. 生成访问域名
5. 测试功能

**预期结果**：
```
✅ GitHub 仓库：https://github.com/你的用户名/wechat-moments-editor
✅ Railway 项目：https://railway.app/project/xxx
✅ 访问域名：https://wechat-moments-editor-production.up.railway.app
```
