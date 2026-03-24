#!/usr/bin/env node
/**
 * 微信公众号自动化发布 Skill - 主入口
 */

const { checkConfig, initConfigInteractive } = require('./scripts/config');
const { searchTopic, formatSearchResults } = require('./scripts/search');
const { generateArticlePrompt, parseArticleOutput, extractGoldenSentences } = require('./scripts/writer');
const { formatStyleOptions, generateCover } = require('./scripts/cover');
const { formatToHtml, generateFullArticle, markdownToWechatHtml } = require('./scripts/formatter');
const { publishDraft } = require('./scripts/publisher');

async function main() {
  console.log('📝 微信公众号自动化发布 Skill');
  console.log('='.repeat(50));

  // 检查配置
  const missing = checkConfig();
  if (missing.length > 0) {
    console.log(`\n⚠️ 首次使用需要配置 API Key，缺少: ${missing.join(', ')}`);
    console.log('请运行: npm run config\n');
    process.exit(1);
  }

  console.log('\n✅ 配置检查通过！');
  console.log('\n💡 使用方式:');
  console.log('  对 Kimi 说: "帮我写一篇关于XXX的公众号文章"');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkConfig,
  initConfigInteractive,
  searchTopic,
  formatSearchResults,
  generateArticlePrompt,
  parseArticleOutput,
  extractGoldenSentences,
  formatStyleOptions,
  generateCover,
  formatToHtml,
  generateFullArticle,
  markdownToWechatHtml,
  publishDraft
};
