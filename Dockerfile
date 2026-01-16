FROM node:18-alpine

# 安装 canvas 和 sharp 需要的系统依赖 + 中文字体
RUN apk add --no-cache \
    build-base \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    pixman-dev \
    fontconfig-dev \
    fontconfig \
    ttf-dejavu \
    font-noto-cjk \
    font-noto-emoji \
    && fc-cache -fv

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装 Node.js 依赖
RUN npm install --production

# 复制所有项目文件
COPY . .

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# 启动应用
CMD ["npm", "start"]
