# Windows 环境安装指南

## 问题说明

`npm install` 失败是因为 `canvas` 包需要编译 C++ 代码，在 Windows 上需要安装构建工具。

## 解决方案

### 方案 1: 安装 Windows 构建工具（推荐）

#### 步骤 1: 安装 Visual Studio Build Tools

1. 下载 Visual Studio 2022 Build Tools:
   https://visualstudio.microsoft.com/downloads/

   或直接下载:
   https://aka.ms/vs/17/release/vs_BuildTools.exe

2. 运行安装程序，选择：
   - ✅ **Desktop development with C++** (使用 C++ 的桌面开发)
   - 确保勾选：
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 build tools
     - ✅ Windows 10/11 SDK (任意最新版本)

3. 安装大小约 6-8 GB，需要等待 20-30 分钟

#### 步骤 2: 重新安装依赖

```bash
# 清理旧的安装
rm -r node_modules
rm package-lock.json

# 重新安装
npm install
```

---

### 方案 2: 使用预编译的 canvas（快速）

如果不想安装 Visual Studio Build Tools，可以使用已有的 `node_modules`：

1. 从其他 Windows 电脑复制编译好的 `node_modules` 文件夹
2. 或者使用 Docker 运行项目

---

### 方案 3: 使用 canvas-prebuilt（替代方案）

修改 `package.json`：

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "multer": "^1.4.5-lts.1",
    "canvas-prebuilt": "^2.11.2",  // 改用 canvas-prebuilt
    "sharp": "^0.33.0",
    "tesseract.js": "^5.0.4"
  }
}
```

然后：
```bash
npm install
```

---

### 方案 4: 临时跳过 canvas 安装（测试用）

如果只是想测试其他功能，可以暂时跳过：

```bash
npm install --ignore-scripts
```

⚠️ 注意：这样会导致图片处理功能无法使用

---

## 验证安装

安装完成后，测试运行：

```bash
# 启动服务器
npm start

# 或开发模式
npm run dev
```

如果看到以下输出，说明安装成功：
```
本地头像已加载: 261个文件
主题检测器已加载，支持14种主题
名字库大小: 79
评论库大小: 193
服务器运行在 http://localhost:3000
```

---

## 常见问题

### Q1: 我的 Visual Studio 2019 为什么不行？

A: 错误信息显示：
```
gyp ERR! find VS checking VS2019 (16.11.36128.20)
gyp ERR! find VS - missing any Windows SDK
```

您的 VS2019 缺少 Windows SDK。需要：
1. 重新运行 VS2019 安装程序
2. 修改安装，添加 Windows SDK

或直接安装 VS2022 Build Tools（推荐）

### Q2: 能用其他包代替 canvas 吗？

A: 可以，但需要大量代码修改。`canvas` 用于：
- 绘制文字（点赞名单、评论内容）
- 图层合成
- 中文字体渲染

如果要替换，需要用 `sharp` + `svg2img` 等组合，工作量较大。

### Q3: 网络问题导致下载失败

如果看到：
```
connect ECONNREFUSED 127.0.0.1:443
```

这是因为代理问题。解决：

```bash
# 临时关闭代理
npm config delete proxy
npm config delete https-proxy

# 或使用国内镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

---

## 推荐配置

### 最小配置（约 8GB 磁盘空间）
- Visual Studio 2022 Build Tools
- Desktop development with C++ workload
- Windows 11 SDK

### 完整开发配置（如果要做更多开发）
- Visual Studio 2022 Community（免费）
- Node.js LTS (已安装 v22.17.0)
- Git
- VSCode

---

## 替代方案：Docker 部署

如果实在不想安装构建工具，可以用 Docker：

```dockerfile
FROM node:18-alpine
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
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
docker build -t wechat-moments-editor .
docker run -p 3000:3000 wechat-moments-editor
```

---

**推荐**: 如果是长期开发，直接安装 Visual Studio Build Tools 最省事。
