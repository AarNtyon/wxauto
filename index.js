#!/usr/bin/env node
/**
 * 微信公众号自动化发布 Skill - 主入口
 * 
 * AI 使用方法：
 * const skill = require('/Users/an/code/wxauto');
 * await skill.runWorkflow(userId, topic, { sendMessage, askAI, askUser });
 * 
 * ⚠️ 警告：不要直接调用 scripts/ 目录下的函数，使用 runWorkflow 即可
 */

const { 
  getConfigStatus, 
  forceCompleteConfig,
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
 * @returns {Promise<Object>} 发布结果 { media_id, url }
 */
async function runWorkflow(userId, topic, callbacks) {
  const { sendMessage, askAI, askUser } = callbacks;
  let currentStep = 0;
  
  try {
    // ===== 步骤 1: 检查配置 =====
    currentStep = 1;
    await sendMessage('🔧 步骤 1/6: 检查配置...');
    const status = getConfigStatus(userId);
    
    if (!status.isComplete) {
      // forceCompleteConfig 内部会发送欢迎消息，这里不重复发送
      const result = await forceCompleteConfig(
        userId,
        async (text) => await sendMessage(text),
        async () => {
          const reply = await askUser('请回复');
          return reply;
        }
      );
      if (!result.success) {
        throw new Error('配置未完成，请重新发起');
      }
    }
    await sendMessage('✅ 配置检查通过');
    
    // ===== 步骤 2: 搜索素材 =====
    currentStep = 2;
    await sendMessage('🔍 步骤 2/6: 搜索素材...');
    const searchResults = await searchHybrid(userId, topic);
    
    if (searchResults.length === 0) {
      await sendMessage('⚠️ 未找到相关素材，将基于主题直接创作');
    } else {
      await sendMessage(`✅ 找到 ${searchResults.length} 条相关素材`);
    }
    
    // ===== 步骤 3: AI 写作 =====
    currentStep = 3;
    await sendMessage('✍️ 步骤 3/6: AI 创作文章...');
    const prompt = generateArticlePrompt(topic, searchResults);
    const aiOutput = await askAI(prompt);
    const article = parseArticleOutput(aiOutput);
    await sendMessage(`✅ 文章创作完成：《${article.title}》`);
    
    // ===== 步骤 4: 生成封面 =====
    currentStep = 4;
    await sendMessage('🎨 步骤 4/6: 生成封面图...');
    const coverUrl = await generateCover(userId, article.title, 'creative');
    await sendMessage('✅ 封面生成成功');
    
    // ===== 步骤 5: 格式化 =====
    currentStep = 5;
    await sendMessage('📝 步骤 5/6: 格式化文章...');
    const htmlContent = formatToHtml(article.content, {
      title: article.title,
      lead: article.digest,
      includeHeader: false  // 草稿箱不需要标题头
    });
    await sendMessage('✅ 格式化完成');
    
    // ===== 步骤 6: 发布到草稿箱 =====
    currentStep = 6;
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
    
  } catch (error) {
    const stepNames = {
      1: '检查配置',
      2: '搜索素材',
      3: 'AI 写作',
      4: '生成封面',
      5: '格式化文章',
      6: '发布草稿箱'
    };
    const stepName = stepNames[currentStep] || '未知步骤';
    
    await sendMessage(
      `❌ **流程在步骤 ${currentStep}（${stepName}）失败**\n\n` +
      `错误信息：${error.message}\n\n` +
      `💡 请检查相关配置后重试`
    );
    
    throw error;
  }
}

/**
 * 检查用户是否可以使用
 * @param {string} userId - 用户 ID
 * @returns {Object} { canUse: boolean, progress: string, missing: string[] }
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

// ⚠️ 只对外暴露两个函数，禁止 AI 调用任何底层模块
module.exports = {
  runWorkflow,    // 完整工作流（唯一入口）
  checkUserReady  // 检查用户配置是否就绪
};
