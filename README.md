# 朋友圈截图编辑器

一个用于修改微信朋友圈截图的工具，可以修改显示时间、添加随机点赞和评论，适用于集赞活动等场景。

**支持两种截图样式：**
1. **详情页** - 单条朋友圈的详情页面（点进某条朋友圈后的页面）
2. **时间线** - 朋友圈列表流（包含多条朋友圈的列表）

## 功能特点

- ✅ **智能布局检测** - 使用OCR自动识别时间位置，适配不同尺寸截图
- ✅ **扩展内容库** - 500+真实昵称 + 200+真实评论
- ✅ **头像自动生成** - 每个用户自动匹配唯一头像
- ✅ 自动识别截图类型（详情页 / 时间线）
- ✅ 修改朋友圈截图显示时间
- ✅ 自动生成随机点赞（默认10-30人）
- ✅ 自动生成随机评论（默认5-12条）
- ✅ 支持自定义点赞人数和评论数量
- ✅ 支持自定义点赞名单和评论内容
- ✅ 保持原图其他内容不变
- ✅ Web界面操作简单直观
- ✅ 支持批量处理

## 内容生成特色

### 📝 扩展名字库（500+）
包含多种风格的真实昵称：
- 经典名字：张三、李四、王五...
- 小字辈：小明、小红、小华...
- 阿字辈：阿杰、阿文、阿强...
- 晓字辈：晓东、晓峰、晓明...
- 英文名：Amy、Bob、Cathy...
- 个性昵称：阳光少年、快乐小子...
- 文艺昵称：清风明月、静水流深...
- 网络用语：yyds、绝绝子...

### 💬 扩展评论库（200+）
包含多场景真实评论：
- 基础反应：哈哈、赞、666...
- 表达情感：羡慕、酸了、好想去...
- 询问类：在哪里、怎么去、多少钱...
- 赞美类：好看、真美、拍得好...
- 关心类：注意安全、保重、加油...
- 表情包：😄😊😁❤️💕🔥...
- 网络流行语：yyds、绝绝子、芭比Q...

### 👤 智能头像系统
- **自动匹配**：同一用户名总是显示相同头像
- **多种风格**：支持4种头像API（卡通、真人、机器人等）
- **哈希算法**：确保头像分配的一致性
- **免费服务**：使用开源头像API，无需成本

## 智能布局检测

**无需手动调整坐标！** 系统会自动：
1. 使用OCR识别截图中的时间文字
2. 根据时间位置自动计算点赞和评论区域
3. 适配不同手机型号和屏幕尺寸
4. 失败时自动降级到默认布局

## 安装依赖

```bash
npm install
```

## 使用方法

### 方法1: Web界面（推荐）

1. 启动服务器：
```bash
npm start
```

2. 打开浏览器访问：`http://localhost:3000`

3. 上传朋友圈截图（支持详情页和时间线两种样式）

4. 选择截图类型（或使用自动识别）

5. 设置参数（可选）：
   - 显示时间：随机或自定义
   - 点赞人数：留空则随机10-30人
   - 评论数量：留空则随机5-12条
   - 自定义点赞名单：用逗号分隔

6. 点击"生成截图"按钮

7. 自动下载修改后的图片

### 方法2: 代码调用

```javascript
const WeChatMomentsEditor = require('./src/editor');
const fs = require('fs').promises;

async function modify() {
  const editor = new WeChatMomentsEditor();

  // 读取原始图片
  const imageBuffer = await fs.readFile('screenshot.jpg');

  // 修改图片（使用默认随机设置）
  const modified = await editor.modifyScreenshot(imageBuffer);

  // 保存修改后的图片
  await fs.writeFile('modified.png', modified);
}

modify();
```

### 自定义参数

```javascript
const modified = await editor.modifyScreenshot(imageBuffer, {
  // 自定义显示时间
  newTime: '5分钟前',

  // 自定义点赞人数
  likesCount: 25,

  // 自定义评论数量
  commentsCount: 10,

  // 指定截图类型（可选）
  screenshotType: 'detail', // 或 'timeline'

  // 是否使用智能检测（默认true）
  useSmartDetection: true,

  // 自定义点赞名单（可选）
  customLikeNames: ['张三', '李四', '王五'],

  // 自定义评论内容（可选）
  customComments: [
    { name: '张三', content: '太棒了！' },
    { name: '李四', content: '666' }
  ]
});
```

## 技术原理

### 智能布局检测流程

1. **OCR文字识别**
   - 使用 Tesseract.js 识别截图中的时间文字
   - 支持识别："X分钟前"、"X小时前"、"X天前"、"刚刚"等格式
   - 只扫描中下部区域，提高识别速度和准确度

2. **坐标计算**
   - 以识别到的时间位置为锚点
   - 自动计算点赞区域（时间下方60-70px）
   - 自动计算评论区域（点赞下方60-80px）
   - 根据时间字体大小自动调整其他元素大小

3. **降级策略**
   - OCR识别失败时自动使用默认比例布局
   - 可手动关闭智能检测使用固定布局
   - 多重保障确保100%可用性

### 处理流程

```
上传截图
   ↓
检测截图类型（详情页/时间线）
   ↓
启用智能检测？
   ↓ Yes              ↓ No
OCR识别时间      使用默认布局
   ↓
计算布局坐标
   ↓
绘制时间/点赞/评论
   ↓
输出修改后的图片
```

## 截图类型说明

### 详情页 (detail)
- 点进某条朋友圈后显示的页面
- 顶部显示"详情"标题
- 底部有评论输入框
- 只包含单条朋友圈内容

### 时间线 (timeline)
- 朋友圈列表页面
- 顶部显示"朋友圈"标题
- 包含多条朋友圈动态
- 工具会修改居中的那一条

### 自动识别
系统会根据图片的宽高比自动判断截图类型，也可以手动指定以获得更准确的结果。

## API 接口

### POST /api/modify

修改单张朋友圈截图

**请求参数：**
- `screenshot`: 图片文件（multipart/form-data）
- `screenshotType`: 截图类型，可选值：'detail' 或 'timeline'（可选，留空则自动识别）
- `useSmartDetection`: 是否使用智能布局检测，'true' 或 'false'（默认true）
- `newTime`: 自定义时间（可选）
- `likesCount`: 点赞人数（可选）
- `commentsCount`: 评论数量（可选）
- `customLikeNames`: 自定义点赞名单，逗号分隔（可选）

**响应：**
- 返回修改后的PNG图片

### POST /api/batch-modify

批量修改多张截图

**请求参数：**
- `screenshots`: 多个图片文件（multipart/form-data）
- `screenshotType`: 截图类型（可选）
- `likesCount`: 点赞人数（可选）
- `commentsCount`: 评论数量（可选）

**响应：**
```json
{
  "success": true,
  "images": [
    {
      "filename": "screenshot1.jpg",
      "data": "base64编码的图片数据"
    }
  ]
}
```

## 配置选项

### 默认设置

```javascript
{
  defaultLikesRange: { min: 10, max: 30 },    // 默认点赞人数范围
  defaultCommentsRange: { min: 5, max: 12 }   // 默认评论数量范围
}
```

### 时间选项

预设的随机时间选项：
- 刚刚
- 1分钟前
- 3分钟前
- 5分钟前
- 10分钟前
- 30分钟前
- 1小时前
- 2小时前
- 3小时前

也可以自定义任意时间文本。

## 项目结构

```
startup/
├── src/
│   ├── editor.js          # 图片处理核心类
│   └── server.js          # Express服务器
├── public/
│   └── index.html         # Web界面
├── example.js             # 使用示例
├── package.json           # 项目配置
└── README.md             # 说明文档
```

## 技术栈

- **后端**: Node.js + Express
- **图片处理**: Canvas + Sharp
- **文件上传**: Multer
- **前端**: 原生HTML/CSS/JavaScript

## 注意事项

1. 本工具仅用于学习和合法场景（如活动集赞等），请勿用于欺诈等违法用途
2. **智能检测默认开启**，首次处理会下载OCR语言包（约5-10MB）
3. 智能检测会增加1-3秒处理时间，但准确度更高
4. 建议使用高清截图以获得更好的OCR识别效果
5. 处理大图片时可能需要较长时间

## 性能说明

- **智能检测模式**：处理时间约3-5秒/图片（含OCR识别）
- **默认布局模式**：处理时间约1秒/图片
- **首次运行**：需下载OCR语言包，约需10-20秒
- **内存占用**：约50-100MB（含OCR工作器）

## 常见问题

### 1. 智能检测失败怎么办？
- 系统会自动降级到默认布局，不会影响使用
- 可以手动关闭智能检测，使用固定比例布局
- 确保截图清晰，时间文字可见

### 2. 处理速度太慢？
- 首次运行需要下载OCR语言包
- 后续处理会使用缓存，速度会提升
- 可以关闭智能检测以加快处理速度

### 3. 位置不准确？
- 启用智能检测通常能解决问题
- 如果仍不准确，可以手动指定截图类型
- 特殊布局可能需要调整代码中的偏移量

## 坐标调整说明

如果生成的图片中时间、点赞、评论位置不正确，可以在 [src/editor.js](src/editor.js) 中调整坐标参数：

### 详情页布局调整
在 `getDetailLayout()` 方法中修改：
```javascript
getDetailLayout(width, height) {
  return {
    time: {
      x: width * 0.28,    // 时间水平位置
      y: height * 0.535,  // 时间垂直位置
      fontSize: 28
    },
    likes: {
      x: width * 0.08,
      y: height * 0.60    // 点赞区域位置
    },
    comments: {
      x: width * 0.08,
      startY: height * 0.67  // 评论起始位置
    }
  };
}
```

### 时间线布局调整
在 `getTimelineLayout()` 方法中修改：
```javascript
getTimelineLayout(width, height) {
  return {
    time: {
      x: width * 0.28,
      y: height * 0.505   // 居中朋友圈的时间位置
    },
    likes: {
      x: width * 0.28,
      y: height * 0.545
    },
    comments: {
      x: width * 0.28,
      startY: height * 0.595
    }
  };
}
```

## 开发模式

使用 nodemon 自动重启：

```bash
npm run dev
```

## 示例运行

查看完整示例代码：

```bash
node example.js
```

需要先准备一张名为 `example.jpg` 的朋友圈截图。

## 许可证

MIT

## 贡献

欢迎提交 Issue 和 Pull Request！

## 更新日志

### v1.0.0
- 初始版本
- 支持修改时间、添加点赞和评论
- 提供Web界面和代码API
- 支持批量处理
