const ThemeDetector = require('./src/themeDetector');
const ContentGenerator = require('./src/contentGenerator');

console.log('='.repeat(70));
console.log('👨‍👩‍👧 亲子活动主题评论生成器 - 专项测试');
console.log('='.repeat(70));

const detector = new ThemeDetector();
const generator = new ContentGenerator();

// 亲子活动场景测试用例
const parentChildScenarios = [
  {
    title: '周末公园游玩',
    text: '周末带孩子去公园玩，亲子时光真美好',
    expected: 'baby'
  },
  {
    title: '动物园之旅',
    text: '今天带宝宝去动物园，亲子活动好开心',
    expected: 'baby'
  },
  {
    title: '户外野餐',
    text: '和孩子一起野餐，享受美好的亲子时光',
    expected: 'baby'
  },
  {
    title: '博物馆参观',
    text: '周末亲子活动，带娃参观科技馆',
    expected: 'baby'
  },
  {
    title: '游乐场',
    text: '陪孩子去游乐场，看着他开心的样子我也很满足',
    expected: 'baby'
  },
  {
    title: '爬山郊游',
    text: '周末爬山，亲子活动锻炼身体',
    expected: 'baby'
  },
  {
    title: '烘焙时光',
    text: '和宝宝一起做蛋糕，亲子烘焙真有意思',
    expected: 'baby'
  },
  {
    title: '图书馆阅读',
    text: '带孩子去图书馆看书，培养阅读习惯',
    expected: 'baby'
  },
  {
    title: '海边玩耍',
    text: '带娃去海边玩沙子，亲子游真开心',
    expected: 'baby'
  },
  {
    title: '采摘活动',
    text: '周末亲子采摘，孩子认识了好多水果',
    expected: 'baby'
  }
];

console.log('\n【亲子活动主题关键词】');
console.log('已配置关键词:', detector.keywordThemes.baby.keywords.filter(k =>
  k.includes('亲子') || k.includes('动物园') || k.includes('游乐场') ||
  k.includes('春游') || k.includes('秋游') || k.includes('郊游')
).join('、'));

console.log('\n【亲子活动评论库】');
const babyComments = detector.themeComments.baby;
const parentChildComments = babyComments.filter(c =>
  c.includes('亲子') || c.includes('陪伴') || c.includes('温馨') ||
  c.includes('幸福') || c.includes('时光') || c.includes('成长') ||
  c.includes('家庭') || c.includes('父') || c.includes('母') || c.includes('童年')
);

console.log('亲子活动相关评论数量:', parentChildComments.length);
console.log('\n评论预览:');
console.log('  温馨类:', parentChildComments.filter(c => c.includes('温馨') || c.includes('幸福')).slice(0, 5).join('、'));
console.log('  陪伴类:', parentChildComments.filter(c => c.includes('陪伴') || c.includes('时光')).slice(0, 5).join('、'));
console.log('  成长类:', parentChildComments.filter(c => c.includes('成长') || c.includes('童年')).slice(0, 5).join('、'));
console.log('  家庭类:', parentChildComments.filter(c => c.includes('家庭') || c.includes('父') || c.includes('母')).slice(0, 5).join('、'));

console.log('\n' + '='.repeat(70));
console.log('\n【场景识别测试】\n');

let correctCount = 0;
parentChildScenarios.forEach((scenario, index) => {
  console.log(`场景 ${index + 1}: ${scenario.title}`);
  console.log(`  内容: "${scenario.text}"`);

  const detectedTheme = detector.detectTheme(scenario.text);
  const isCorrect = detectedTheme === scenario.expected;
  if (isCorrect) correctCount++;

  console.log(`  检测结果: ${detectedTheme} ${isCorrect ? '✅' : '❌'}`);
  console.log();
});

console.log(`识别准确率: ${correctCount}/${parentChildScenarios.length} (${(correctCount/parentChildScenarios.length*100).toFixed(1)}%)`);

console.log('\n' + '='.repeat(70));
console.log('\n【智能评论生成演示】\n');

// 选择5个典型场景生成评论
const demoScenes = [
  { text: '周末带孩子去公园玩，亲子时光真美好', label: '公园游玩' },
  { text: '今天带宝宝去动物园，亲子活动好开心', label: '动物园' },
  { text: '和孩子一起做手工，享受美好的亲子时光', label: '亲子手工' },
  { text: '陪孩子去游乐场，看着他开心的样子我也很满足', label: '游乐场' },
  { text: '周末亲子采摘，孩子认识了好多水果', label: '采摘活动' }
];

demoScenes.forEach((scene, index) => {
  console.log(`\n示例 ${index + 1}: ${scene.label}`);
  console.log(`朋友圈内容: "${scene.text}"\n`);

  const comments = generator.generateSmartComments(scene.text, 8);

  console.log('生成的智能评论:');
  comments.forEach((comment, i) => {
    const isParentChildComment = comment.content.includes('亲子') ||
      comment.content.includes('陪伴') || comment.content.includes('温馨') ||
      comment.content.includes('幸福') || comment.content.includes('时光') ||
      comment.content.includes('成长') || comment.content.includes('家庭');
    const marker = isParentChildComment ? ' 🎯' : '';
    console.log(`  ${i + 1}. ${comment.name}: ${comment.content}${marker}`);
  });
});

console.log('\n' + '='.repeat(70));
console.log('\n【评论分类统计】\n');

const categories = {
  '温馨幸福': parentChildComments.filter(c => c.includes('温馨') || c.includes('幸福')),
  '陪伴时光': parentChildComments.filter(c => c.includes('陪伴') || c.includes('时光')),
  '成长见证': parentChildComments.filter(c => c.includes('成长') || c.includes('童年') || c.includes('长大')),
  '家庭氛围': parentChildComments.filter(c => c.includes('家庭') || c.includes('家')),
  '父母之爱': parentChildComments.filter(c => c.includes('父') || c.includes('母') || c.includes('爱')),
  '记录珍贵': parentChildComments.filter(c => c.includes('记录') || c.includes('珍贵') || c.includes('珍惜'))
};

Object.entries(categories).forEach(([category, comments]) => {
  console.log(`${category.padEnd(12)}: ${comments.length}条`);
  if (comments.length > 0) {
    console.log(`  示例: ${comments.slice(0, 3).join('、')}`);
  }
  console.log();
});

console.log('='.repeat(70));
console.log('\n【对比演示：扩充前 vs 扩充后】\n');

console.log('扩充前: 6条评论');
console.log('  好温馨、亲子时光真美好、有爱的画面、陪伴是最好的礼物、珍贵的时光、幸福的一家\n');

console.log(`扩充后: ${parentChildComments.length}条评论`);
console.log('  涵盖场景: 温馨幸福、陪伴时光、成长见证、家庭氛围、父母之爱、记录珍贵等多个维度');
console.log(`  提升: ${parentChildComments.length - 6}条 (+${((parentChildComments.length - 6) / 6 * 100).toFixed(0)}%)`);

console.log('\n' + '='.repeat(70));
console.log('\n【完整性检查】\n');

const requiredKeywords = [
  '亲子活动', '动物园', '游乐场', '春游', '秋游', '郊游', '亲子游'
];

console.log('关键词覆盖检查:');
requiredKeywords.forEach(keyword => {
  const hasKeyword = detector.keywordThemes.baby.keywords.includes(keyword);
  console.log(`  ${keyword.padEnd(10)}: ${hasKeyword ? '✅' : '❌'}`);
});

console.log('\n关键场景评论覆盖:');
const requiredCommentTypes = {
  '温馨幸福类': parentChildComments.filter(c => c.includes('温馨') || c.includes('幸福')).length,
  '陪伴时光类': parentChildComments.filter(c => c.includes('陪伴') || c.includes('时光')).length,
  '成长见证类': parentChildComments.filter(c => c.includes('成长') || c.includes('童年')).length,
  '家庭氛围类': parentChildComments.filter(c => c.includes('家庭') || c.includes('家')).length,
};

Object.entries(requiredCommentTypes).forEach(([category, count]) => {
  console.log(`  ${category.padEnd(12)}: ${count}条 ${count >= 3 ? '✅' : '⚠️'}`);
});

console.log('\n' + '='.repeat(70));
console.log('✅ 亲子活动主题测试完成！');
console.log('='.repeat(70));

// 统计信息
console.log('\n【统计摘要】');
console.log(`亲子活动相关关键词: ${requiredKeywords.length}个`);
console.log(`亲子活动相关评论: ${parentChildComments.length}条`);
console.log(`识别准确率: ${(correctCount/parentChildScenarios.length*100).toFixed(1)}%`);
console.log(`覆盖场景: 公园、动物园、游乐场、博物馆、郊游、采摘、烘焙、阅读等`);
console.log(`评论维度: 温馨、陪伴、成长、家庭、父母之爱、记录珍贵等`);
