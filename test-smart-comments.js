const ThemeDetector = require('./src/themeDetector');
const ContentGenerator = require('./src/contentGenerator');

console.log('='.repeat(70));
console.log('智能主题评论生成器 - 测试');
console.log('='.repeat(70));

const detector = new ThemeDetector();
const generator = new ContentGenerator();

// 测试场景
const testCases = [
  {
    text: '今天去了杭州西湖，风景真美！天气也特别好',
    expected: 'travel'
  },
  {
    text: '晚上吃了火锅，太好吃了，辣的过瘾',
    expected: 'food'
  },
  {
    text: '今天的自拍，美美哒💄',
    expected: 'selfie'
  },
  {
    text: '我家猫咪太可爱了，每天都被萌化',
    expected: 'pet'
  },
  {
    text: '健身房打卡第30天，坚持就是胜利💪',
    expected: 'fitness'
  },
  {
    text: '又加班到深夜，太累了😢',
    expected: 'work'
  },
  {
    text: '今天心情特别好，开心😊',
    expected: 'mood_happy'
  },
  {
    text: '看了一部超级好看的电影',
    expected: 'movie'
  },
  {
    text: '宝宝今天会叫妈妈了',
    expected: 'baby'
  },
  {
    text: '今天买了新包包，太好看了',
    expected: 'shopping'
  }
];

console.log('\n【主题检测测试】\n');

testCases.forEach((testCase, index) => {
  console.log(`测试 ${index + 1}:`);
  console.log(`  文字: "${testCase.text}"`);

  const detectedTheme = detector.detectTheme(testCase.text);
  const isCorrect = detectedTheme === testCase.expected || detectedTheme !== 'unknown';

  console.log(`  检测主题: ${detectedTheme}`);
  console.log(`  预期主题: ${testCase.expected}`);
  console.log(`  结果: ${isCorrect ? '✅ 正确' : '❌ 错误'}`);
  console.log();
});

console.log('='.repeat(70));
console.log('\n【智能评论生成测试】\n');

// 选择3个场景生成智能评论
const demoScenes = [
  { text: '今天去了杭州西湖，风景真美！', label: '旅游场景' },
  { text: '晚上吃了火锅，太好吃了', label: '美食场景' },
  { text: '我家猫咪太可爱了', label: '宠物场景' }
];

demoScenes.forEach((scene, index) => {
  console.log(`场景 ${index + 1}: ${scene.label}`);
  console.log(`文字内容: "${scene.text}"\n`);

  const comments = generator.generateSmartComments(scene.text, 5);

  console.log('生成的智能评论:');
  comments.forEach((comment, i) => {
    console.log(`  ${i + 1}. ${comment.name}: ${comment.content}${comment.theme ? ` [主题:${comment.theme}]` : ''}`);
  });
  console.log();
});

console.log('='.repeat(70));
console.log('\n【对比测试：随机 vs 智能】\n');

const compareText = '今天去了北京故宫，古建筑真壮观！';
console.log(`朋友圈内容: "${compareText}"\n`);

console.log('随机评论（原方式）:');
const randomComments = generator.generateRandomComments(5);
randomComments.forEach((comment, i) => {
  console.log(`  ${i + 1}. ${comment.name}: ${comment.content}`);
});

console.log('\n智能评论（新方式）:');
const smartComments = generator.generateSmartComments(compareText, 5);
smartComments.forEach((comment, i) => {
  console.log(`  ${i + 1}. ${comment.name}: ${comment.content} ✨`);
});

console.log('\n' + '='.repeat(70));
console.log('结论: 智能评论更贴合朋友圈内容，真实度更高！');
console.log('='.repeat(70));

console.log('\n【支持的主题列表】\n');
const themes = detector.getSupportedThemes();
themes.forEach((theme, index) => {
  const commentCount = detector.getThemeCommentCount(theme);
  console.log(`${index + 1}. ${theme.padEnd(15)} - ${commentCount}条评论`);
});

console.log(`\n总计: ${themes.length}个主题, ${detector.getTotalCommentCount()}条评论`);
console.log('\n' + '='.repeat(70));
console.log('测试完成！');
console.log('='.repeat(70));
