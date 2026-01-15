# Railway 零改造部署指南

## 📋 部署前准备

### 系统要求
- ✅ Node.js 已安装（您已有 v22.17.0）
- ✅ 项目代码完整（已确认）
- ⏳ Railway CLI 工具（即将安装）
- ⏳ Railway 账号（即将创建/登录）

### 部署优势
- ⭐ **零代码修改** - 项目原封不动即可部署
- ⭐ **自动识别** - Railway 自动检测 Node.js 项目并安装依赖
- ⭐ **包含 Canvas** - 自动编译 canvas 和 sharp 包
- ⭐ **免费额度** - 500 小时/月免费运行时间
- ⭐ **自动 HTTPS** - 免费提供 SSL 证书
- ⭐ **即时域名** - 部署后立即获得 `xxx.railway.app` 域名

---

## 🚀 部署步骤

### 步骤 1: 安装 Railway CLI

打开 PowerShell，执行以下命令：

```powershell
npm install -g @railway/cli
```

**预计时间**: 1-2 分钟

**验证安装**:
```powershell
railway --version
```

应该看到版本号，例如：`railway version 3.x.x`

---

### 步骤 2: 登录 Railway

```powershell
railway login
```

**会发生什么**:
1. 自动打开浏览器
2. 跳转到 Railway 登录页面
3. 可以选择：
   - GitHub 账号登录（推荐）
   - Google 账号登录
   - Email 登录

登录成功后，终端会显示：
```
✓ Logged in as [你的用户名]
```

---

### 步骤 3: 初始化项目

在项目目录下执行：

```powershell
cd c:\tianti\AI\startup
railway init
```

**交互式问题**:

```
? Enter project name (wechat-moments-editor):
```
按 Enter 使用默认名称，或输入自定义名称

```
? Enter environment name (production):
```
按 Enter 使用默认环境

**完成提示**:
```
✓ Created project wechat-moments-editor
✓ Linked to project wechat-moments-editor
```

---

### 步骤 4: 部署应用

```powershell
railway up
```

**部署过程**:
```
✓ Compressed project files
✓ Uploaded project files
✓ Building...
  - Installing dependencies (npm install)
  - Building canvas native modules
  - Building sharp native modules
✓ Build complete
✓ Deploying...
✓ Deployment live
```

**预计时间**: 3-5 分钟（首次部署需要编译 canvas/sharp）

---

### 步骤 5: 生成公开域名

```powershell
railway domain
```

**会看到**:
```
✓ Service domain generated: wechat-moments-editor-production.up.railway.app
```

这就是您的访问地址！

---

## 🌐 访问您的应用

部署完成后，您会得到类似这样的域名：

```
https://wechat-moments-editor-production.up.railway.app
```

或

```
https://your-project-name.railway.app
```

**立即可用的功能**:
- ✅ 访问首页: `https://your-domain.railway.app/`
- ✅ 用户注册: `https://your-domain.railway.app/api/user/register`
- ✅ 图片处理: `https://your-domain.railway.app/api/modify`
- ✅ 本地头像: `https://your-domain.railway.app/resource/AIgei_images/page1_0.jpg`

---

## 📊 部署后验证

### 1. 打开浏览器访问域名

您应该看到朋友圈编辑器的首页界面。

### 2. 查看部署日志

```powershell
railway logs
```

应该看到：
```
本地头像已加载: 261个文件
主题检测器已加载，支持14种主题
名字库大小: 79
评论库大小: 193
服务器运行在 http://localhost:3000
```

### 3. 测试功能

上传一张朋友圈截图，点击"生成截图"，应该能正常处理并下载。

---

## 🔧 常用命令

### 查看项目状态
```powershell
railway status
```

### 查看实时日志
```powershell
railway logs --follow
```

### 打开 Railway Dashboard
```powershell
railway open
```

### 查看环境变量
```powershell
railway variables
```

### 重新部署
```powershell
railway up --detach
```

---

## 📈 Railway Dashboard

访问 https://railway.app/dashboard 可以：

- 📊 查看部署状态
- 📝 查看日志
- ⚙️ 配置环境变量
- 📊 查看资源使用情况（CPU、内存、流量）
- 🔗 管理域名
- 💳 查看使用时长（免费额度剩余）

---

## 🎯 下一步优化（可选）

### 1. 绑定自定义域名

如果您有自己的域名（如 `www.example.com`）：

```powershell
railway domain add www.example.com
```

然后在域名提供商（如 Cloudflare、阿里云）添加 CNAME 记录：
```
CNAME www -> your-app.railway.app
```

### 2. 配置持久化存储（用户数据）

如果希望用户数据在重启后保留：

```powershell
railway volume create user-data --mount /app/data
```

这样 `data/users.json` 会持久保存。

### 3. 设置环境变量

```powershell
railway variables set NODE_ENV=production
railway variables set MAX_FILE_SIZE=10485760
```

### 4. GitHub 自动部署

1. 在 Railway Dashboard 中点击项目
2. Settings → Connect GitHub Repo
3. 选择您的仓库
4. 以后每次 `git push` 都会自动部署

---

## ⚠️ 注意事项

### 免费额度管理

- 免费：500 小时/月（约 20.8 天 24 小时运行）
- 如果不够用，可以：
  - 升级到 Hobby 计划（$5/月无限时长）
  - 或设置自动休眠（闲置时关闭）

### 查看使用情况

```powershell
railway status
```

或访问 Dashboard 查看详细用量。

### 自动休眠（节省额度）

在 Railway Dashboard：
1. 项目设置 → Services
2. 点击您的服务
3. Settings → Auto-sleep
4. 启用后，15 分钟无请求会自动休眠
5. 下次访问时自动唤醒（首次请求稍慢）

---

## 🆘 常见问题

### Q: 部署失败，提示 canvas 编译错误？
A: Railway 会自动处理，如果失败请查看日志：
```powershell
railway logs
```
通常等待几分钟会自动重试成功。

### Q: 域名访问不了？
A:
1. 确认部署成功：`railway status`
2. 查看服务是否运行：`railway logs`
3. 确认域名生成：`railway domain`

### Q: 如何更新代码？
A:
方式1（手动）：
```powershell
railway up
```

方式2（自动）：连接 GitHub 后，每次 push 自动部署

### Q: 用户数据会丢失吗？
A:
- 默认情况：重启后丢失（内存存储）
- 解决方案：创建 Volume 持久化存储
```powershell
railway volume create user-data --mount /app/data
```

### Q: 如何查看错误日志？
A:
```powershell
railway logs --tail 100
```

---

## 📞 需要帮助？

如果遇到问题：
1. 查看 Railway 日志：`railway logs`
2. 查看本地日志：检查是否有错误
3. Railway 文档：https://docs.railway.app
4. 告诉我具体错误信息，我会帮您解决

---

## ✅ 部署检查清单

完成以下步骤后，您的应用就成功部署了：

- [ ] Railway CLI 已安装
- [ ] 已登录 Railway 账号
- [ ] 项目已初始化（`railway init`）
- [ ] 应用已部署（`railway up`）
- [ ] 域名已生成（`railway domain`）
- [ ] 浏览器可以访问域名
- [ ] 上传图片功能正常
- [ ] 本地头像可以加载
- [ ] 日志显示正常运行

全部完成？恭喜！🎉 您的朋友圈编辑器已经上线！

---

**预期最终结果**:

部署完成后，您会获得：
- 🌐 访问域名：`https://wechat-moments-editor-production.up.railway.app`
- ✅ 完整功能：图片处理、用户系统、本地头像
- 🔒 HTTPS 加密：自动 SSL 证书
- 📊 监控面板：Railway Dashboard
- 💰 免费运行：500 小时/月

**立即开始部署吧！**
