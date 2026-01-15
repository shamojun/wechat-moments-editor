# 📡 API接口文档

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **Content-Type**: `multipart/form-data` (图片上传接口)
- **Content-Type**: `application/json` (其他接口)

---

## 图片处理接口

### POST /api/modify

**描述**: 上传朋友圈截图并进行编辑处理

**请求方式**: POST (multipart/form-data)

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| screenshot | File | ✅ 是 | - | 朋友圈截图文件（PNG/JPG） |
| likesCount | Number | ❌ 否 | 随机12-30 | 点赞人数（范围：1-50） |
| commentsCount | Number | ❌ 否 | 随机5-12 | 评论条数（范围：0-20） |
| newTime | String | ❌ 否 | 当前时间 | 修改后的时间（如：10分钟前、1小时前） |
| screenshotType | String | ❌ 否 | 自动检测 | 截图类型：detail/list |
| useSmartDetection | Boolean | ❌ 否 | false | 是否使用智能布局检测 |
| customLikeNames | String | ❌ 否 | 随机生成 | 自定义点赞名单（逗号分隔） |
| customComments | String | ❌ 否 | 智能生成 | 自定义评论（JSON格式） |
| phone | String | ❌ 否 | - | 用户手机号（用于身份识别） |
| email | String | ❌ 否 | - | 用户邮箱（用于身份识别） |
| nickname | String | ❌ 否 | - | 用户昵称（用于身份识别） |

**默认值说明**:
- `likesCount`: 如果不传，系统随机生成 **12-30** 个点赞
- `commentsCount`: 如果不传，系统随机生成 **5-12** 条评论
- 如果 `commentsCount=0`，则不添加评论

**请求示例（JavaScript）**:

```javascript
const formData = new FormData();

// 必填：图片文件
formData.append('screenshot', imageFile);

// 可选：点赞数（不传则随机12-30）
formData.append('likesCount', 25);

// 可选：评论数（不传则随机5-12）
formData.append('commentsCount', 10);

// 可选：修改时间
formData.append('newTime', '30分钟前');

// 可选：智能检测
formData.append('useSmartDetection', 'true');

// 可选：用户信息（首次使用时收集）
formData.append('phone', '13800138000');
formData.append('nickname', '张三');

const response = await fetch('/api/modify', {
  method: 'POST',
  body: formData
});
```

**请求示例（cURL）**:

```bash
# 最简请求（使用默认值）
curl -X POST http://localhost:3000/api/modify \
  -F "screenshot=@moments.png"

# 自定义点赞和评论数
curl -X POST http://localhost:3000/api/modify \
  -F "screenshot=@moments.png" \
  -F "likesCount=20" \
  -F "commentsCount=8"

# 完整参数
curl -X POST http://localhost:3000/api/modify \
  -F "screenshot=@moments.png" \
  -F "likesCount=25" \
  -F "commentsCount=10" \
  -F "newTime=1小时前" \
  -F "useSmartDetection=true" \
  -F "phone=13800138000" \
  -F "nickname=测试用户"
```

**成功响应**:

- **状态码**: 200
- **Content-Type**: `image/png`
- **Headers**:
  - `Content-Disposition`: `attachment; filename=modified_moments.png`
  - `X-Remaining-Quota`: 剩余使用次数（免费用户：0或1，付费用户：-1表示无限）

**响应体**: 处理后的图片二进制数据

**失败响应（超出使用限制）**:

```json
{
  "error": "您今天的免费额度已用完，明天再来试试吧！",
  "reason": "daily_limit_reached",
  "userType": "free",
  "remainingQuota": 0,
  "upgradeHint": "升级为付费用户即可无限使用！"
}
```

**状态码**: 403 Forbidden

**错误响应（参数错误）**:

```json
{
  "error": "请上传图片文件"
}
```

**状态码**: 400 Bad Request

---

## 参数详细说明

### 1. screenshot (图片文件)

**类型**: File

**必填**: ✅ 是

**说明**:
- 支持格式：PNG、JPG、JPEG
- 建议尺寸：750px - 1080px 宽度
- 最大文件大小：10MB
- 支持两种截图类型：
  - 详情页：单条朋友圈的详细页面
  - 动态流：包含多条朋友圈的列表页面

### 2. likesCount (点赞人数)

**类型**: Number

**必填**: ❌ 否

**默认值**: 随机 **12-30**

**取值范围**: 1-50

**说明**:
- 不传参数时，系统自动生成12-30之间的随机数
- 传入 `0` 表示不添加点赞
- 超出范围会自动调整到范围内

**示例**:
```javascript
// 不传 - 随机12-30个点赞
formData.append('screenshot', file);

// 指定25个点赞
formData.append('likesCount', 25);

// 不添加点赞
formData.append('likesCount', 0);
```

### 3. commentsCount (评论条数)

**类型**: Number

**必填**: ❌ 否

**默认值**: 随机 **5-12**

**取值范围**: 0-20

**说明**:
- 不传参数时，系统自动生成5-12之间的随机数
- 传入 `0` 表示不添加评论
- 评论内容根据朋友圈文字智能匹配（14种主题）
- 评论库包含450+条真实评论

**示例**:
```javascript
// 不传 - 随机5-12条评论
formData.append('screenshot', file);

// 指定10条评论
formData.append('commentsCount', 10);

// 不添加评论（仅点赞）
formData.append('commentsCount', 0);
```

### 4. newTime (修改时间)

**类型**: String

**必填**: ❌ 否

**默认值**: 当前时间

**格式**:
- `刚刚`
- `10秒前`、`30秒前`
- `5分钟前`、`30分钟前`
- `1小时前`、`3小时前`
- `昨天`
- `2天前`

**示例**:
```javascript
formData.append('newTime', '30分钟前');
```

### 5. useSmartDetection (智能布局检测)

**类型**: Boolean

**必填**: ❌ 否

**默认值**: false

**说明**:
- `true`: 使用OCR自动检测时间位置（准确率90%+，耗时3-5秒）
- `false`: 使用默认布局（快速模式，耗时1秒）

**推荐**:
- 首次使用：建议开启
- 批量处理：可关闭以提高速度

**示例**:
```javascript
formData.append('useSmartDetection', 'true');
```

### 6. customLikeNames (自定义点赞名单)

**类型**: String

**必填**: ❌ 否

**格式**: 逗号分隔的名字列表

**说明**:
- 如果提供，会使用自定义名单而不是随机生成
- 名字数量应该与 `likesCount` 一致
- 如果名字不够，会用随机名字补齐

**示例**:
```javascript
formData.append('customLikeNames', '张三,李四,王五,赵六');
formData.append('likesCount', 4);
```

### 7. customComments (自定义评论)

**类型**: String (JSON格式)

**必填**: ❌ 否

**格式**: JSON数组

**说明**:
- 如果提供，会使用自定义评论而不是智能生成
- 每条评论包含 `name` 和 `content` 字段

**示例**:
```javascript
const comments = [
  { name: '张三', content: '太好看了！' },
  { name: '李四', content: '拍得真好' }
];

formData.append('customComments', JSON.stringify(comments));
```

### 8. 用户信息字段 (phone/email/nickname)

**类型**: String

**必填**: ❌ 否（但首次使用建议提供）

**说明**:
- 用于用户识别和使用限制
- 即使不提供，系统也会通过设备指纹自动识别
- 提供手机号/邮箱可以实现跨设备同步

**示例**:
```javascript
formData.append('phone', '13800138000');
formData.append('email', 'user@example.com');
formData.append('nickname', '张三');
```

---

## 用户管理接口

### GET /api/user/check

**描述**: 检查用户是否有使用权限

**请求示例**:
```bash
curl http://localhost:3000/api/user/check
```

**响应示例**:
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

### POST /api/user/register

**描述**: 注册或更新用户信息

**请求体**:
```json
{
  "phone": "13800138000",
  "email": "user@example.com",
  "nickname": "张三"
}
```

**响应示例**:
```json
{
  "success": true,
  "user": {
    "userId": "abc123...",
    "userType": "free",
    "createdAt": "2026-01-14T08:00:00.000Z",
    "totalUsage": 0
  },
  "stats": {
    "used": 0,
    "canUse": true
  }
}
```

### GET /api/user/stats

**描述**: 获取用户统计信息

**响应示例**:
```json
{
  "success": true,
  "stats": {
    "user": { ... },
    "recentUsage": [
      { "date": "2026-01-14", "count": 1 }
    ],
    "todayUsage": {
      "used": 1,
      "canUse": false
    }
  }
}
```

### GET /api/admin/stats

**描述**: 获取系统全局统计（管理员）

**响应示例**:
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

---

## 完整使用示例

### 场景1: 最简单使用（全部默认）

```javascript
// 只上传图片，其他全部使用默认值
const formData = new FormData();
formData.append('screenshot', imageFile);

const response = await fetch('/api/modify', {
  method: 'POST',
  body: formData
});

// 结果：
// - 点赞：随机12-30人
// - 评论：随机5-12条（智能匹配主题）
// - 时间：当前时间
// - 头像：自动生成
```

### 场景2: 自定义点赞和评论数

```javascript
const formData = new FormData();
formData.append('screenshot', imageFile);
formData.append('likesCount', 25);      // 25个点赞
formData.append('commentsCount', 10);   // 10条评论

const response = await fetch('/api/modify', {
  method: 'POST',
  body: formData
});
```

### 场景3: 仅添加点赞，不要评论

```javascript
const formData = new FormData();
formData.append('screenshot', imageFile);
formData.append('likesCount', 30);
formData.append('commentsCount', 0);    // 不添加评论

const response = await fetch('/api/modify', {
  method: 'POST',
  body: formData
});
```

### 场景4: 完整自定义

```javascript
const formData = new FormData();
formData.append('screenshot', imageFile);
formData.append('likesCount', 20);
formData.append('commentsCount', 8);
formData.append('newTime', '1小时前');
formData.append('useSmartDetection', 'true');
formData.append('customLikeNames', '张三,李四,王五');

// 用户信息（首次使用）
formData.append('phone', '13800138000');
formData.append('nickname', '测试用户');

const response = await fetch('/api/modify', {
  method: 'POST',
  body: formData
});

if (response.ok) {
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'modified_moments.png';
  a.click();

  // 获取剩余次数
  const remaining = response.headers.get('X-Remaining-Quota');
  console.log(`剩余次数: ${remaining}`);
} else if (response.status === 403) {
  const error = await response.json();
  alert(error.error + '\n' + error.upgradeHint);
}
```

---

## 错误码说明

| 状态码 | 说明 | 示例 |
|--------|------|------|
| 200 | 成功 | 返回处理后的图片 |
| 400 | 请求参数错误 | 未上传图片文件 |
| 403 | 权限不足 | 超出免费使用限制 |
| 500 | 服务器错误 | 图片处理失败 |

---

## 性能说明

| 模式 | 处理时间 | 准确率 | 适用场景 |
|------|---------|--------|----------|
| 快速模式 (useSmartDetection=false) | ~1秒 | 标准 | 批量处理、重复处理 |
| 智能模式 (useSmartDetection=true) | 3-5秒 | 90%+ | 首次使用、单张精修 |

---

## 使用限制

### 免费用户
- ✅ 每天1次免费使用
- ✅ 所有基础功能
- ✅ 智能主题评论
- ✅ 自动头像生成

### 付费用户
- ✅ 无限次使用
- ✅ 所有基础功能
- ✅ 智能主题评论
- ✅ 自动头像生成
- 🔮 AI评论生成（预留）
- 🔮 图像识别主题（预留）

---

## 注意事项

1. **图片格式**: 仅支持PNG、JPG、JPEG格式
2. **文件大小**: 建议不超过10MB
3. **请求频率**: 免费用户每天1次，付费用户无限制
4. **数据存储**: 上传的图片不会被保存，仅用于实时处理
5. **隐私保护**: 用户信息仅用于身份识别，不会用于其他用途

---

## 更新日志

### v2.1 (2026-01-14)
- ✅ 添加用户管理系统
- ✅ 添加使用限制
- ✅ 点赞默认12-30
- ✅ 评论默认5-12
- ✅ 完善API文档

---

**文档版本**: v2.1
**最后更新**: 2026-01-14
