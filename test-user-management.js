/**
 * 用户管理系统测试
 */

const UserManager = require('./src/userManager');

console.log('='.repeat(70));
console.log('用户管理系统 - 功能测试');
console.log('='.repeat(70));

const userManager = new UserManager();

// 模拟HTTP请求对象
function createMockRequest(userAgent = 'Mozilla/5.0', ip = '192.168.1.100') {
  return {
    headers: {
      'user-agent': userAgent,
      'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'accept-encoding': 'gzip, deflate'
    },
    ip: ip,
    connection: { remoteAddress: ip }
  };
}

async function runTests() {
  try {
    console.log('\n【测试1：创建新用户】\n');

    const req1 = createMockRequest();
    const user1 = await userManager.getOrCreateUser(req1, {
      phone: '13800138000',
      nickname: '测试用户1'
    });

    console.log('用户信息:');
    console.log(`  用户ID: ${user1.userId}`);
    console.log(`  用户类型: ${user1.userType}`);
    console.log(`  创建时间: ${user1.createdAt}`);
    console.log(`  手机号: ${user1.userInfo.phone}`);
    console.log(`  昵称: ${user1.userInfo.nickname}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试2：检查使用权限】\n');

    const permission1 = await userManager.checkPermission(req1);
    console.log('首次检查权限:');
    console.log(`  是否允许: ${permission1.allowed ? '✅ 是' : '❌ 否'}`);
    console.log(`  原因: ${permission1.reason}`);
    console.log(`  剩余次数: ${permission1.remainingQuota}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试3：记录使用】\n');

    await userManager.recordUsage(user1.userId, {
      feature: 'modify',
      options: { likesCount: 25, commentsCount: 10 }
    });
    console.log('✅ 已记录使用');

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试4：再次检查权限（应该被限制）】\n');

    const permission2 = await userManager.checkPermission(req1);
    console.log('第二次检查权限:');
    console.log(`  是否允许: ${permission2.allowed ? '✅ 是' : '❌ 否'}`);
    console.log(`  原因: ${permission2.reason}`);
    console.log(`  剩余次数: ${permission2.remainingQuota}`);
    if (permission2.message) {
      console.log(`  提示信息: ${permission2.message}`);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试5：升级为付费用户】\n');

    await userManager.upgradeUser(user1.userId);
    console.log('✅ 用户已升级为付费用户');

    const permission3 = await userManager.checkPermission(req1);
    console.log('\n升级后检查权限:');
    console.log(`  是否允许: ${permission3.allowed ? '✅ 是' : '❌ 否'}`);
    console.log(`  原因: ${permission3.reason}`);
    console.log(`  用户类型: ${permission3.user.userType}`);
    console.log(`  剩余次数: ${permission3.remainingQuota === -1 ? '无限' : permission3.remainingQuota}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试6：创建第二个用户（不同设备）】\n');

    const req2 = createMockRequest('Chrome/91.0', '192.168.1.101');
    const user2 = await userManager.getOrCreateUser(req2, {
      phone: '13900139000',
      nickname: '测试用户2'
    });

    console.log('第二个用户:');
    console.log(`  用户ID: ${user2.userId}`);
    console.log(`  与第一个用户相同: ${user1.userId === user2.userId ? '是' : '否'} ❌`);

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试7：获取用户统计】\n');

    const stats = await userManager.getUserStats(user1.userId);
    console.log('用户统计信息:');
    console.log(`  总使用次数: ${stats.user.totalUsage}`);
    console.log(`  今日使用: ${stats.todayUsage.used}次`);
    console.log(`  今日可用: ${stats.todayUsage.canUse ? '是' : '否'}`);

    console.log('\n最近7天使用情况:');
    stats.recentUsage.forEach(day => {
      const bar = '█'.repeat(day.count);
      console.log(`  ${day.date}: ${bar} ${day.count}次`);
    });

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试8：全局统计】\n');

    const globalStats = await userManager.getAllStats();
    console.log('系统统计:');
    console.log(`  总用户数: ${globalStats.totalUsers}`);
    console.log(`  免费用户: ${globalStats.freeUsers}`);
    console.log(`  付费用户: ${globalStats.premiumUsers}`);
    console.log(`  今日使用: ${globalStats.todayUsage}次`);
    console.log(`  总使用: ${globalStats.totalUsage}次`);

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试9：设备指纹验证】\n');

    // 相同设备再次访问
    const req3 = createMockRequest(); // 与req1相同
    const user3 = await userManager.getOrCreateUser(req3);

    console.log('相同设备再次访问:');
    console.log(`  识别为同一用户: ${user1.userId === user3.userId ? '✅ 是' : '❌ 否'}`);
    console.log(`  用户ID: ${user3.userId}`);

    console.log('\n' + '='.repeat(70));
    console.log('\n【测试10：数据持久化】\n');

    const dataPath = require('path').join(__dirname, 'data/users.json');
    const fs = require('fs');

    if (fs.existsSync(dataPath)) {
      const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
      console.log('数据库文件:');
      console.log(`  位置: ${dataPath}`);
      console.log(`  用户数: ${data.users.length}`);
      console.log(`  记录数: ${data.usageRecords.length}`);
      console.log(`  最后更新: ${data.lastUpdate}`);
      console.log('  ✅ 数据已持久化');
    }

    console.log('\n' + '='.repeat(70));
    console.log('\n✅ 所有测试完成！');
    console.log('='.repeat(70));

    console.log('\n【功能总结】');
    console.log('✅ 用户自动识别（基于设备指纹）');
    console.log('✅ 免费用户每日限制（1次）');
    console.log('✅ 付费用户无限使用');
    console.log('✅ 使用记录统计');
    console.log('✅ 数据持久化存储');
    console.log('✅ 全局统计功能');
    console.log('✅ 跨请求用户识别');

    console.log('\n【API接口】');
    console.log('POST   /api/user/register  - 用户注册');
    console.log('GET    /api/user/check     - 检查权限');
    console.log('GET    /api/user/stats     - 用户统计');
    console.log('GET    /api/admin/stats    - 全局统计');
    console.log('POST   /api/modify         - 图片处理（带权限检查）');

  } catch (error) {
    console.error('\n❌ 测试失败:', error);
    throw error;
  }
}

// 运行测试
runTests().then(() => {
  console.log('\n测试完成，程序退出。');
  process.exit(0);
}).catch(error => {
  console.error('\n测试异常:', error);
  process.exit(1);
});
