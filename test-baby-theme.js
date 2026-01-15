const ThemeDetector = require('./src/themeDetector');
const ContentGenerator = require('./src/contentGenerator');

console.log('='.repeat(70));
console.log('🍼 宝宝/幼儿园主题评论生成器 - 专项测试');
console.log('='.repeat(70));

const detector = new ThemeDetector();
const generator = new ContentGenerator();

// 宝宝/幼儿园场景测试用例
const babyScenarios = [
  {
    title: '幼儿园活动',
    text: '今天宝宝在幼儿园参加了手工活动，做了一个小房子',
    expected: 'baby'
  },
  {
    title: '才艺表演',
    text: '女儿幼儿园汇报演出，跳舞表演真棒',
    expected: 'baby'
  },
  {
    title: '亲子活动',
    text: '周末带孩子去动物园，亲子活动真开心',
    expected: 'baby'
  },
  {
    title: '获奖表扬',
    text: '宝贝今天得了小红花，在幼儿园表现真好',
    expected: 'baby'
  },
  {
    title: '生日派对',
    text: '宝宝生日会，小朋友们一起庆祝',
    expected: 'baby'
  },
  {
    title: '学习进步',
    text: '儿子今天会认字了，进步好大',
    expected: 'baby'
  },
  {
    title: '幼儿园毕业',
    text: '大班毕业典礼，宝贝要上小学了',
    expected: 'baby'
  },
  {
    title: '才艺学习',
    text: '孩子学画画，作品真不错',
    expected: 'baby'
  },
  {
    title: '运动会',
    text: '幼儿园运动会，小家伙真棒',
    expected: 'baby'
  },
  {
    title: '日常成长',
    text: '宝宝长高了，又长大了一点',
    expected: 'baby'
  }
];

console.log('\n【宝宝主题关键词】');
console.log('已配置关键词数量:', detector.keywordThemes.baby.keywords.length);
console.log('权重:', detector.keywordThemes.baby.weight);

console.log('\n【宝宝主题评论库】');
console.log('评论数量:', detector.getThemeCommentCount('baby'));

console.log('\n评论分类预览:');
const babyComments = detector.themeComments.baby;
console.log('  基础夸赞:', babyComments.slice(0, 5).join('、'));
console.log('  幼儿园相关:', babyComments.filter(c => c.includes('幼儿园')).slice(0, 3).join('、'));
console.log('  学习才艺:', babyComments.filter(c => c.includes('画') || c.includes('跳') || c.includes('唱')).slice(0, 3).join('、'));
console.log('  活动演出:', babyComments.filter(c => c.includes('表演') || c.includes('演员')).slice(0, 3).join('、'));

console.log('\n' + '='.repeat(70));
console.log('\n【场景识别测试】\n');

babyScenarios.forEach((scenario, index) => {
  console.log(`场景 ${index + 1}: ${scenario.title}`);
  console.log(`  内容: "${scenario.text}"`);

  const detectedTheme = detector.detectTheme(scenario.text);
  const isCorrect = detectedTheme === scenario.expected;

  console.log(`  检测结果: ${detectedTheme} ${isCorrect ? '✅' : '❌'}`);
  console.log();
});

console.log('='.repeat(70));
console.log('\n【智能评论生成演示】\n');

// 选择5个典型场景生成评论
const demoScenes = [
  { text: '宝宝今天在幼儿园参加了手工活动，做了一个小房子', label: '幼儿园手工' },
  { text: '女儿幼儿园汇报演出，跳舞表演真棒', label: '才艺表演' },
  { text: '宝贝今天得了小红花，表现真好', label: '获奖表扬' },
  { text: '宝宝生日会，小朋友们一起庆祝', label: '生日派对' },
  { text: '儿子今天会认字了，进步好大', label: '学习进步' }
];

demoScenes.forEach((scene, index) => {
  console.log(`\n示例 ${index + 1}: ${scene.label}`);
  console.log(`朋友圈内容: "${scene.text}"\n`);

  const comments = generator.generateSmartComments(scene.text, 8);

  console.log('生成的智能评论:');
  comments.forEach((comment, i) => {
    console.log(`  ${i + 1}. ${comment.name}: ${comment.content}`);
  });
});

console.log('\n' + '='.repeat(70));
console.log('\n【评论类型统计】\n');

const allBabyComments = detector.themeComments.baby;
const categories = {
  '基础夸赞': ['可爱', '萌', '天使', '宝贝'],
  '成长相关': ['长大', '成长', '长高'],
  '幼儿园': ['幼儿园'],
  '学习才艺': ['画', '跳', '唱', '学', '进步', '才'],
  '活动演出': ['表演', '演员', '台风'],
  '获奖表扬': ['恭喜', '厉害', '优秀', '表扬'],
  '亲子活动': ['亲子', '温馨', '陪伴'],
  '生日派对': ['生日', '快乐'],
  '鼓励支持': ['加油', '棒', '努力'],
  '询问关心': ['多大', '几岁', '安全', '吃饭']
};

Object.entries(categories).forEach(([category, keywords]) => {
  const count = allBabyComments.filter(comment =>
    keywords.some(keyword => comment.includes(keyword))
  ).length;
  console.log(`${category.padEnd(12)}: ${count}条`);
});

console.log(`\n总计: ${allBabyComments.length}条评论`);

console.log('\n' + '='.repeat(70));
console.log('\n【对比演示：其他主题 vs 宝宝主题】\n');

const compareTexts = [
  '今天去了杭州西湖旅游',
  '宝宝今天在幼儿园表演节目'
];

compareTexts.forEach((text, index) => {
  console.log(`\n测试 ${index + 1}: "${text}"`);

  const theme = detector.detectTheme(text);
  const comments = generator.generateSmartComments(text, 5);

  console.log(`主题: ${theme}`);
  console.log('评论:');
  comments.forEach((comment, i) => {
    console.log(`  ${i + 1}. ${comment.content}`);
  });
});

console.log('\n' + '='.repeat(70));
console.log('\n【完整性检查】\n');

const requiredKeywords = [
  '幼儿园', '手工', '表演', '画画', '跳舞', '唱歌', '亲子活动',
  '运动会', '毕业', '生日', '认字', '学习', '小红花', '奖状'
];

console.log('关键词覆盖检查:');
requiredKeywords.forEach(keyword => {
  const hasKeyword = detector.keywordThemes.baby.keywords.includes(keyword);
  console.log(`  ${keyword.padEnd(10)}: ${hasKeyword ? '✅' : '❌'}`);
});

console.log('\n关键场景评论覆盖:');
const requiredComments = {
  '幼儿园相关': detector.themeComments.baby.filter(c => c.includes('幼儿园')).length,
  '学习才艺': detector.themeComments.baby.filter(c => c.includes('画') || c.includes('跳') || c.includes('唱')).length,
  '表演活动': detector.themeComments.baby.filter(c => c.includes('表演') || c.includes('演')).length,
  '成长相关': detector.themeComments.baby.filter(c => c.includes('长大') || c.includes('成长')).length
};

Object.entries(requiredComments).forEach(([category, count]) => {
  console.log(`  ${category.padEnd(12)}: ${count}条 ${count >= 5 ? '✅' : '⚠️'}`);
});

console.log('\n' + '='.repeat(70));
console.log('✅ 宝宝/幼儿园主题测试完成！');
console.log('='.repeat(70));

// 统计信息
console.log('\n【统计摘要】');
console.log(`关键词数量: ${detector.keywordThemes.baby.keywords.length}个`);
console.log(`评论总数: ${detector.getThemeCommentCount('baby')}条`);
console.log(`权重设置: ${detector.keywordThemes.baby.weight} (优先识别)`);
console.log(`覆盖场景: 幼儿园、学习、活动、演出、亲子、生日等`);
