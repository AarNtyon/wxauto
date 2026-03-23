/**
 * 多租户使用示例
 * 演示 Telegram Bot 如何接入
 */

const {
  getUserConfigStatus,
  generateConfigWelcome,
  interactiveConfig,
  quickConfig
} = require('./scripts/config');

const { searchHybrid } = require('./scripts/search');
const { generateCover } = require('./scripts/cover');
const { publishDraft } = require('./scripts/publisher');

/**
 * 处理用户消息示例
 */
async function handleUserMessage(userId, messageText, sendMessage, waitForReply) {
  // 1. 检查用户配置状态
  const status = getUserConfigStatus(userId);
  
  // 2. 首次使用或配置不完整，引导配置
  if (status.isFirstTime || !status.isComplete) {
    if (messageText === '/start' || status.isFirstTime) {
      await interactiveConfig(userId, sendMessage, waitForReply);
      return;
    }
    
    if (!status.isComplete) {
      await sendMessage(`⚠️ 您的配置不完整，还缺少：${status.missing.join(', ')}\n请发送 /start 完成配置`);
      return;
    }
  }
  
  // 3. 处理写文章请求
  if (messageText.includes('写文章') || messageText.includes('公众号')) {
    // 提取主题
    const topic = messageText.replace(/.*写文章|.*公众号/, '').trim() || '热门话题';
    
    await sendMessage(`📝 好的，我来帮您写一篇关于"${topic}"的公众号文章\n\n1️⃣ 正在搜索素材...`);
    
    // 搜索素材
    const aiResults = []; // 这里应该是 AI 搜索的结果
    const results = await searchHybrid(userId, topic, aiResults, 5);
    
    await sendMessage(`✅ 找到 ${results.length} 条素材\n\n2️⃣ 正在创作文章...`);
    
    // AI 写作（这里简化演示）
    const article = {
      title: `${topic}：一篇文章读懂`,
      digest: `深入解析${topic}的核心要点`,
      content: '<p>文章内容...</p>'
    };
    
    await sendMessage(`✅ 文章创作完成\n\n3️⃣ 正在生成封面...`);
    
    // 生成封面
    try {
      const coverUrl = await generateCover(userId, article.title, 'creative');
      await sendMessage(`✅ 封面生成成功\n\n4️⃣ 正在发布到草稿箱...`);
      
      // 发布
      const result = await publishDraft(userId, article.title, article.content, article.digest, coverUrl);
      
      await sendMessage(`🎉 发布成功！\n\n📄 文章标题：${article.title}\n🔗 Media ID：${result.media_id}`);
    } catch (error) {
      await sendMessage(`⚠️ 发布失败：${error.message}`);
    }
    
    return;
  }
  
  // 其他消息
  await sendMessage('👋 您好！发送 "/start" 开始配置，或发送"帮我写一篇关于XXX的公众号文章"开始创作');
}

/**
 * 快速配置示例（命令行）
 */
function exampleQuickConfig() {
  const userId = 'test_user_123';
  
  const result = quickConfig(userId, {
    brave_api_key: 'your-brave-key',
    doubao_api_key: 'your-doubao-key',
    wechat_appid: 'your-appid',
    wechat_secret: 'your-secret'
  });
  
  console.log('配置结果:', result);
}

// 导出示例
module.exports = {
  handleUserMessage,
  exampleQuickConfig
};

// 如果直接运行
if (require.main === module) {
  console.log('多租户使用示例');
  console.log('请查看 example.js 中的代码示例');
}
