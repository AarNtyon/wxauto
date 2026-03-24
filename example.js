/**
 * 多租户使用示例 - 强制完整配置版本
 * 演示 Telegram Bot 如何接入（强制配置完整才能使用）
 */

const {
  getConfigStatus,
  generateWelcomeMessage,
  forceCompleteConfig,
  checkCanUse
} = require('./scripts/config');

const { searchHybrid } = require('./scripts/search');
const { generateCover } = require('./scripts/cover');
const { publishDraft } = require('./scripts/publisher');

/**
 * 处理用户消息 - 强制配置完整版本
 */
async function handleUserMessage(userId, messageText, sendMessage, waitForReply) {
  // 检查配置状态
  const status = getConfigStatus(userId);
  
  console.log(`[用户 ${userId}] 配置状态:`, {
    isFirstTime: status.isFirstTime,
    isComplete: status.isComplete,
    progress: `${status.completedFields}/${status.totalFields}`
  });
  
  // 如果配置不完整，强制完成配置
  if (!status.isComplete) {
    // 首次使用显示欢迎消息
    if (status.isFirstTime) {
      await sendMessage(generateWelcomeMessage(userId));
    } else {
      await sendMessage(
        `⚠️ **配置不完整**\n\n` +
        `已完成：${status.completedFields}/${status.totalFields}\n` +
        `缺少：${status.missing.map(m => m.name).join('、')}\n\n` +
        `请继续完成配置...`
      );
    }
    
    // 强制完整配置引导
    const result = await forceCompleteConfig(
      userId,
      async (text) => await sendMessage(text),
      async () => {
        const reply = await waitForReply();
        return reply.text || reply;
      }
    );
    
    if (!result.success) {
      console.log(`[用户 ${userId}] 配置未完成`);
      return;
    }
    
    console.log(`[用户 ${userId}] 配置完成`);
  }
  
  // 再次检查是否可以使用（双重保险）
  const canUse = await checkCanUse(userId, sendMessage);
  if (!canUse) {
    return;
  }
  
  // 处理写文章请求
  if (messageText.includes('写文章') || messageText.includes('公众号')) {
    await handleWriteArticle(userId, messageText, sendMessage);
    return;
  }
  
  // 处理 /start 命令（已配置完成的用户）
  if (messageText === '/start') {
    await sendMessage(
      `👋 欢迎使用！\n\n` +
      `✅ 您的配置已完成\n\n` +
      `🚀 **使用方法：**\n` +
      `发送 "帮我写一篇关于 XXX 的公众号文章" 开始创作`
    );
    return;
  }
  
  // 其他消息
  await sendMessage(
    `👋 您好！\n\n` +
    `✅ 配置已完成\n\n` +
    `📝 **使用方式：**\n` +
    `发送 "帮我写一篇关于 XXX 的公众号文章"`
  );
}

/**
 * 处理写文章请求
 */
async function handleWriteArticle(userId, messageText, sendMessage) {
  // 提取主题
  const topic = messageText.replace(/.*写文章|.*公众号/, '').trim() || '热门话题';
  
  await sendMessage(`📝 好的，我来帮您写一篇关于"${topic}"的公众号文章`);
  
  try {
    // 1. 搜索素材
    await sendMessage(`🔍 步骤 1/4：搜索素材...`);
    const aiResults = []; // 这里应该是 AI 搜索的结果
    const results = await searchHybrid(userId, topic, aiResults, 5);
    await sendMessage(`✅ 找到 ${results.length} 条相关素材`);
    
    // 2. AI 写作
    await sendMessage(`✍️ 步骤 2/4：AI 创作文章...`);
    // ... AI 写作逻辑
    const article = {
      title: `${topic}：深度解析`,
      digest: `一文读懂${topic}的核心要点`,
      content: '<p>文章内容...</p>'
    };
    await sendMessage(`✅ 文章创作完成：${article.title}`);
    
    // 3. 生成封面
    await sendMessage(`🎨 步骤 3/4：生成封面图...`);
    const coverUrl = await generateCover(userId, article.title, 'creative');
    await sendMessage(`✅ 封面生成成功`);
    
    // 4. 发布
    await sendMessage(`📤 步骤 4/4：发布到公众号草稿箱...`);
    const result = await publishDraft(userId, article.title, article.content, article.digest, coverUrl);
    
    await sendMessage(
      `🎉 **发布成功！**\n\n` +
      `📄 文章标题：${article.title}\n` +
      `🔗 Media ID：${result.media_id}\n\n` +
      `请登录微信公众平台查看草稿箱`
    );
    
  } catch (error) {
    console.error('写作失败:', error);
    await sendMessage(`❌ 操作失败：${error.message}`);
  }
}

/**
 * 快速配置示例（命令行一次性配置）
 */
function exampleQuickConfig() {
  const config = require('./scripts/config');
  
  const userId = 'test_user_123';
  
  // 手动设置配置（适用于管理员快速配置）
  const userConfig = config.loadUserConfig(userId);
  
  userConfig.brave_api_key = 'your-brave-api-key';
  userConfig.doubao_api_key = 'your-doubao-api-key';
  userConfig.wechat_appid = 'wx1234567890abcdef';
  userConfig.wechat_secret = 'your-wechat-secret';
  
  config.saveUserConfig(userId, userConfig);
  
  // 检查配置状态
  const status = config.getConfigStatus(userId);
  console.log('配置状态:', status);
}

// 导出示例
module.exports = {
  handleUserMessage,
  handleWriteArticle,
  exampleQuickConfig
};

// 如果直接运行
if (require.main === module) {
  console.log('多租户使用示例（强制完整配置版本）');
  console.log('请查看 example.js 中的代码示例');
  console.log('');
  console.log('主要功能：');
  console.log('1. handleUserMessage - 处理用户消息（含强制配置引导）');
  console.log('2. handleWriteArticle - 处理写文章请求');
  console.log('3. exampleQuickConfig - 快速配置示例');
}
