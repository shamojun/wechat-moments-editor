# 🚀 API快速参考

## 接口地址
```
POST http://localhost:3000/api/modify
```

## 必填参数
| 参数 | 说明 |
|------|------|
| `screenshot` | 图片文件（PNG/JPG） |

## 可选参数（默认值）
| 参数 | 默认值 | 说明 |
|------|--------|------|
| `likesCount` | **随机12-30** | 点赞人数（1-50） |
| `commentsCount` | **随机5-12** | 评论条数（0-20） |
| `newTime` | 当前时间 | 修改后的时间 |
| `useSmartDetection` | false | 智能布局检测 |
| `phone` | - | 用户手机号 |
| `nickname` | - | 用户昵称 |

---

## ⚡ 快速上手

### 1. 最简单（推荐）
```javascript
// 只传图片，其他全部默认
const formData = new FormData();
formData.append('screenshot', imageFile);

await fetch('/api/modify', { method: 'POST', body: formData });

// 结果：点赞12-30，评论5-12（智能匹配）
```

### 2. 自定义数量
```javascript
formData.append('screenshot', imageFile);
formData.append('likesCount', 25);      // 25个点赞
formData.append('commentsCount', 10);   // 10条评论
```

### 3. 仅点赞
```javascript
formData.append('screenshot', imageFile);
formData.append('likesCount', 30);
formData.append('commentsCount', 0);    // 不要评论
```

---

## 📊 默认值说明

### 点赞数 (likesCount)
- **不传** → 随机 **12-30**
- **传0** → 不添加点赞
- **传值** → 使用指定数量

### 评论数 (commentsCount)
- **不传** → 随机 **5-12**
- **传0** → 不添加评论
- **传值** → 使用指定数量

---

## 🎯 常用场景

| 场景 | likesCount | commentsCount |
|------|-----------|---------------|
| 默认（最自然） | 不传（12-30） | 不传（5-12） |
| 集赞活动 | 30 | 0 |
| 真实互动 | 18 | 7 |
| 热门朋友圈 | 45 | 15 |
| 低调分享 | 8 | 3 |

---

## ✅ 响应说明

### 成功
- **状态码**: 200
- **响应**: 图片文件（PNG）
- **Headers**: `X-Remaining-Quota` (剩余次数)

### 失败
- **状态码**: 403
- **响应**:
  ```json
  {
    "error": "您今天的免费额度已用完",
    "remainingQuota": 0,
    "upgradeHint": "升级为付费用户即可无限使用！"
  }
  ```

---

## 🔒 使用限制

- **免费用户**: 1次/天
- **付费用户**: 无限次

---

## 📞 查看完整文档

- [API_DOCUMENTATION.md](API_DOCUMENTATION.md) - 完整API文档
- [api-examples.html](http://localhost:3000/api-examples.html) - 在线示例

---

**快速测试**:
```bash
curl -X POST http://localhost:3000/api/modify \
  -F "screenshot=@test.png" \
  -F "likesCount=25" \
  -F "commentsCount=10"
```
