const ContentGenerator = require('./src/contentGenerator');

// 测试内容生成器
console.log('='.repeat(60));
console.log('朋友圈内容生成器 - 功能测试');
console.log('='.repeat(60));

const generator = new ContentGenerator();

// 1. 测试名字库
console.log('\n【1. 名字库测试】');
console.log(`名字库大小: ${generator.getNamePoolSize()}个`);
console.log('\n随机生成10个昵称:');
const names = generator.generateRandomNames(10);
names.forEach((name, index) => {
  console.log(`  ${index + 1}. ${name}`);
});

// 2. 测试评论库
console.log('\n【2. 评论库测试】');
console.log(`评论库大小: ${generator.getCommentPoolSize()}条`);
console.log('\n随机生成10条评论:');
const comments = generator.generateRandomComments(10);
comments.forEach((comment, index) => {
  console.log(`  ${index + 1}. ${comment.name}: ${comment.content}`);
});

// 3. 测试头像生成
console.log('\n【3. 头像生成测试】');
console.log('\n同一用户在不同API下的头像:');
const testUser = '张三';
console.log(`用户名: ${testUser}`);
console.log(`  UI Avatars:  ${generator.getAvatarForUser(testUser, 150, 'ui-avatars')}`);
console.log(`  DiceBear:    ${generator.getAvatarForUser(testUser, 150, 'dicebear')}`);
console.log(`  Pravatar:    ${generator.getAvatarForUser(testUser, 150, 'pravatar')}`);
console.log(`  Robohash:    ${generator.getAvatarForUser(testUser, 150, 'robohash')}`);

// 4. 测试头像一致性
console.log('\n【4. 头像一致性测试】');
console.log('同一用户多次调用应返回相同头像:');
const user = '小明';
const avatar1 = generator.getAvatarForUser(user);
const avatar2 = generator.getAvatarForUser(user);
const avatar3 = generator.getAvatarForUser(user);
console.log(`第1次: ${avatar1}`);
console.log(`第2次: ${avatar2}`);
console.log(`第3次: ${avatar3}`);
console.log(`结果: ${avatar1 === avatar2 && avatar2 === avatar3 ? '✅ 一致' : '❌ 不一致'}`);

// 5. 完整评论生成示例
console.log('\n【5. 完整评论生成示例（带头像）】');
console.log('生成5条完整评论:');
const fullComments = generator.generateRandomComments(5);
fullComments.forEach((comment, index) => {
  console.log(`\n评论${index + 1}:`);
  console.log(`  昵称: ${comment.name}`);
  console.log(`  内容: ${comment.content}`);
  console.log(`  头像: ${comment.avatar}`);
});

// 6. 名字分类统计
console.log('\n【6. 名字库分类统计】');
const nameStats = {
  chinese: 0,
  english: 0,
  emoji: 0,
  other: 0
};

generator.namePool.forEach(name => {
  if (/^[a-zA-Z]+$/.test(name)) {
    nameStats.english++;
  } else if (/[\u4e00-\u9fa5]/.test(name)) {
    nameStats.chinese++;
  } else if (/[\u{1F300}-\u{1F9FF}]/u.test(name)) {
    nameStats.emoji++;
  } else {
    nameStats.other++;
  }
});

console.log(`  中文昵称: ${nameStats.chinese}个`);
console.log(`  英文昵称: ${nameStats.english}个`);
console.log(`  其他类型: ${nameStats.other}个`);

// 7. 评论分类统计
console.log('\n【7. 评论库分类统计】');
const commentStats = {
  withEmoji: 0,
  short: 0,   // <=3字
  medium: 0,  // 4-8字
  long: 0     // >8字
};

generator.commentTemplates.forEach(comment => {
  if (/[\u{1F300}-\u{1F9FF}]/u.test(comment)) {
    commentStats.withEmoji++;
  }

  const length = comment.length;
  if (length <= 3) {
    commentStats.short++;
  } else if (length <= 8) {
    commentStats.medium++;
  } else {
    commentStats.long++;
  }
});

console.log(`  含表情: ${commentStats.withEmoji}条`);
console.log(`  短评论(≤3字): ${commentStats.short}条`);
console.log(`  中评论(4-8字): ${commentStats.medium}条`);
console.log(`  长评论(>8字): ${commentStats.long}条`);

console.log('\n' + '='.repeat(60));
console.log('测试完成！');
console.log('='.repeat(60));
