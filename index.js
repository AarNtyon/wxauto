#!/usr/bin/env node
/**
 * 微信公众号自动化发布 Skill - 主入口
 * 
 * 使用方式（AI 调用）：
 * 1. const skill = require('/Users/an/code/wxauto');
 * 2. await skill.runWorkflow(userId, topic, callbacks);
 */

const { 
  getConfigStatus, 
  generateWelcomeMessage, 
  forceCompleteConfig,
  checkCanUse,
  loadUserConfig
} = require('./scripts/config');

const { searchHybrid } = require('./scripts/search');
const { generateArticlePrompt, parseArticleOutput } = require('./scripts/writer');
const { formatToHtml } = require('./scripts/formatter');
const { generateCover } = require('./scripts/cover');
const { publishDraft } = require('./scripts/publisher');

/**
 * 运行完整工作流
 * @param {string} userId - 用户 ID（如 telegram_123456）
 * @param {string} topic - 文章主题
 * @param {Object} callbacks - 回调函数
 * @param {Function} callbacks.sendMessage - 发送消息给用户
 * @param {Function} callbacks.askAI - 调用 AI 生成文章（传入 prompt，返回文章文本）
 * @param {Function} callbacks.askUser - 询问用户（传入问题，返回答案）
 * @returns {Promise<Object>} 发布结果
 * 
 * 示例：
 * await skill.runWorkflow('user_123', 'AI 编程助手', {
 *   sendMessage: async (msg) => console.log(msg),
 *   askAI: async (prompt) => { 
 *     // AI 生成文章内容
 *     return await ai.chat({ messages: [{ role: 'user', content: prompt }] });
 *   },
 *   askUser: async (question) => {
 *     // 等待用户回复
 *     return await waitForUserReply(question);
 *   }
 * });
 */
async function runWorkflow(userId, topic, callbacks) {
  const { sendMessage, askAI, askUser } = callbacks;
  
  // ===== 步骤 1: 检查配置 =====
  await sendMessage('🔧 步骤 1/6: 检查配置...');
  const status = getConfigStatus(userId);
  
  if (!status.isComplete) {
    await sendMessage(generateWelcomeMessage(userId));
    const result = await forceCompleteConfig(
      userId,
      async (text) => await sendMessage(text),
      async () => {
        const reply = await askUser('请回复');
        return reply;
      }
    );
    if (!result.success) {
      throw new Error('配置未完成');
    }
  }
  await sendMessage('✅ 配置检查通过');
  
  // ===== 步骤 2: 搜索素材 =====
  await sendMessage('🔍 步骤 2/6: 搜索素材...');
  const searchResults = await searchHybrid(userId, topic);
  await sendMessage(`✅ 找到 ${searchResults.length} 条相关素材`);
  
  // ===== 步骤 3: AI 写作 =====
  await sendMessage('✍️ 步骤 3/6: AI 创作文章...');
  const prompt = generateArticlePrompt(topic, searchResults);
  const aiOutput = await askAI(prompt);
  const article = parseArticleOutput(aiOutput);
  await sendMessage(`✅ 文章创作完成：《${article.title}》`);
  
  // ===== 步骤 4: 生成封面 =====
  await sendMessage('🎨 步骤 4/6: 生成封面图...');
  const coverUrl = await generateCover(userId, article.title, 'creative');
  await sendMessage('✅ 封面生成成功');
  
  // ===== 步骤 5: 格式化 =====
  await sendMessage('📝 步骤 5/6: 格式化文章...');
  const htmlContent = formatToHtml(article.content, {
    title: article.title,
    lead: article.digest,
    includeHeader: false  // 草稿箱不需要标题头
  });
  await sendMessage('✅ 格式化完成');
  
  // ===== 步骤 6: 发布到草稿箱 =====
  await sendMessage('📤 步骤 6/6: 发布到公众号草稿箱...');
  const result = await publishDraft(
    userId,
    article.title,
    htmlContent,
    article.digest,
    coverUrl,
    ''  // 作者（可选）
  );
  
  await sendMessage(
    `🎉 **发布成功！**\n\n` +
    `📄 标题：${article.title}\n` +
    `🔗 Media ID：${result.media_id}\n\n` +
    `请登录微信公众平台查看草稿箱`
  );
  
  return result;
}

/**
 * 快速发布（配置已完成用户使用）
 * @param {string} userId - 用户 ID
 * @param {string} topic - 文章主题
 * @param {Function} sendMessage - 发送消息函数
 * @param {Function} askAI - AI 生成函数
 */
async function quickPublish(userId, topic, sendMessage, askAI) {
  return await runWorkflow(userId, topic, {
    sendMessage,
    askAI,
    askUser: async (q) => { throw new Error('配置已完成，不需要询问'); }
  });
}

/**
 * 检查用户是否可以使用
 * @param {string} userId - 用户 ID
 * @returns {Object} { canUse: boolean, reason?: string }
 */
function checkUserReady(userId) {
  const status = getConfigStatus(userId);
  return {
    canUse: status.isComplete,
    isFirstTime: status.isFirstTime,
    progress: `${status.completedFields}/${status.totalFields}`,
    missing: status.missing.map(m => m.name)
  };
}

// 保持向后兼容的导出
module.exports = {
  // 主要 API（AI 应该使用这些）
  runWorkflow,      // 完整工作流
  quickPublish,     // 快速发布
  checkUserReady,   // 检查用户是否就绪
  
  // 底层函数（高级自定义使用）
  getConfigStatus,
  generateWelcomeMessage,
  forceCompleteConfig,
  checkCanUse,
  loadUserConfig,
  searchHybrid,
  generateArticlePrompt,
  parseArticleOutput,
  formatToHtml,
  generateCover,
  publishDraft
};
