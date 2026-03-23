#!/usr/bin/env node
/**
 * 微信公众号自动化发布 Skill 测试脚本
 */

const { checkConfig } = require('./scripts/config');
const { markdownToWechatHtml } = require('./scripts/formatter');
const { generateArticlePrompt, parseArticleOutput, extractGoldenSentences } = require('./scripts/writer');

function testConfig() {
  console.log('='.repeat(50));
  console.log('测试配置模块');
  console.log('='.repeat(50));
  
  const missing = checkConfig();
  
  console.log('当前配置检查:', missing.length === 0 ? '完整' : `缺少 ${missing.join(', ')}`);
  
  if (missing.length > 0) {
    console.log('\n⚠️ 请先运行: npm run config');
  }
  
  return missing.length === 0;
}

function testFormatter() {
  console.log('\n' + '='.repeat(50));
  console.log('测试格式编排模块 (Markdown → HTML)');
  console.log('='.repeat(50));
  
  const markdownContent = `# 文章标题

这是**第一段**正文内容，包含*斜体*和**粗体**。

## 小标题

> 这是一个引用块，用于强调重要观点。

### 列表展示

1. 第一点说明
2. 第二点说明
3. 第三点说明

### 无序列表

- 项目 A
- 项目 B
- 项目 C

### 代码示例

\`inline code\` 和代码块：

\`\`\`javascript
console.log("Hello, WeChat!");
\`\`\`

[点击这里](https://example.com) 了解更多。

![图片描述](https://example.com/image.jpg)

---

**金句：技术的进步不是替代人类，而是让每个人都能创造更大的价值。**

你觉得呢？在评论区分享你的想法！`;
  
  const html = markdownToWechatHtml(markdownContent);
  console.log('转换后的 HTML 预览:');
  console.log(html.substring(0, 500) + (html.length > 500 ? '...' : ''));
  
  return true;
}

function testWriter() {
  console.log('\n' + '='.repeat(50));
  console.log('测试写作模块 (提示词生成)');
  console.log('='.repeat(50));
  
  const mockResults = [
    {
      title: 'AI发展趋势报告 2024',
      description: '人工智能正在改变各行各业，从医疗到教育，从金融到制造业...',
      url: 'https://example.com/ai-report'
    },
    {
      title: 'ChatGPT vs 人类专家',
      description: '大语言模型在多个领域展现出超越人类专家的能力...',
      url: 'https://example.com/chatgpt'
    }
  ];
  
  const topic = '人工智能对未来的影响';
  const prompt = generateArticlePrompt(topic, mockResults);
  
  console.log(`主题: ${topic}`);
  console.log('\n生成的提示词预览 (前1000字符):');
  console.log(prompt.substring(0, 1000) + (prompt.length > 1000 ? '...' : ''));
  
  return true;
}

function testParser() {
  console.log('\n' + '='.repeat(50));
  console.log('测试文章解析');
  console.log('='.repeat(50));
  
  const mockOutput = `标题：AI时代，我们如何保持竞争力？

摘要：人工智能不会取代人类，但会取代不会使用AI的人。

正文：

## 一、AI正在重塑一切

从去年开始，ChatGPT 彻底改变了我们对人工智能的认知...

**金句：未来的竞争力不在于你知道多少，而在于你能让AI为你创造多少。**

## 二、普通人如何拥抱AI

1. 学会提问
2. 培养判断力
3. 保持学习

> 技术本身不是壁垒，使用技术的能力才是。

互动钩子：
你已经开始使用AI工具了吗？在评论区分享你的体验！`;
  
  const parsed = parseArticleOutput(mockOutput);
  const goldenSentences = extractGoldenSentences(parsed.content);
  
  console.log(`标题: ${parsed.title}`);
  console.log(`摘要: ${parsed.digest}`);
  console.log(`正文长度: ${parsed.content.length} 字符`);
  console.log(`互动钩子: ${parsed.interactionHook || '无'}`);
  console.log(`金句: ${goldenSentences.join(' / ')}`);
  
  return true;
}

async function main() {
  console.log('\n🧪 微信公众号自动化 Skill 测试\n');
  
  const results = [];
  
  results.push(['配置模块', testConfig()]);
  results.push(['格式编排', testFormatter()]);
  results.push(['写作模块', testWriter()]);
  results.push(['文章解析', testParser()]);
  
  console.log('\n' + '='.repeat(50));
  console.log('测试结果汇总');
  console.log('='.repeat(50));
  
  for (const [name, passed] of results) {
    const status = passed ? '✅ 通过' : '❌ 失败';
    console.log(`${name}: ${status}`);
  }
  
  const allPassed = results.every(r => r[1]);
  
  console.log('\n' + '-'.repeat(50));
  if (allPassed) {
    console.log('🎉 所有测试通过！');
    console.log('\n要完整运行，请:');
    console.log('1. 填写 config.json 中的 API Key');
    console.log('2. 运行: npm start');
  } else {
    console.log('⚠️ 部分测试失败，请检查错误信息');
  }
  
  process.exit(allPassed ? 0 : 1);
}

main();
