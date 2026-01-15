const WeChatMomentsEditor = require('./src/editor');
const fs = require('fs').promises;
const path = require('path');

async function example() {
  const editor = new WeChatMomentsEditor();

  // 示例1: 使用默认随机设置
  console.log('示例1: 使用默认随机设置');
  const imageBuffer = await fs.readFile(path.join(__dirname, 'example.jpg'));
  const modified1 = await editor.modifyScreenshot(imageBuffer);
  await fs.writeFile('output1.png', modified1);
  console.log('✓ 已生成 output1.png');

  // 示例2: 自定义点赞和评论数量
  console.log('\n示例2: 自定义点赞和评论数量');
  const modified2 = await editor.modifyScreenshot(imageBuffer, {
    newTime: '刚刚',
    likesCount: 20,
    commentsCount: 8
  });
  await fs.writeFile('output2.png', modified2);
  console.log('✓ 已生成 output2.png');

  // 示例3: 自定义点赞名单和评论
  console.log('\n示例3: 自定义点赞名单和评论');
  const modified3 = await editor.modifyScreenshot(imageBuffer, {
    newTime: '5分钟前',
    customLikeNames: ['张三', '李四', '王五', '赵六', '钱七'],
    customComments: [
      { name: '张三', content: '哈哈哈太棒了' },
      { name: '李四', content: '666' },
      { name: '王五', content: '赞👍' }
    ]
  });
  await fs.writeFile('output3.png', modified3);
  console.log('✓ 已生成 output3.png');

  console.log('\n所有示例处理完成！');
}

// 运行示例（需要先准备一张example.jpg图片）
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { example };
