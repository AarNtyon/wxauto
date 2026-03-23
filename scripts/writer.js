/**
 * AI 写作模块 - 生成公众号文章
 * 基于 11个内容洞见维度的写作风格指南
 * 输出格式：纯 HTML（非 Markdown）
 */

/**
 * 安全获取搜索结果描述
 * @param {Object} r - 搜索结果项
 * @returns {string} 描述文本
 */
function getDescription(r) {
  const desc = r.description || r.snippet || r.desc || r.summary || r.content || '';
  return String(desc);
}

/**
 * 安全获取标题
 * @param {Object} r - 搜索结果项  
 * @returns {string} 标题文本
 */
function getTitle(r) {
  return String(r.title || r.name || r.heading || '未命名');
}

/**
 * 生成写作提示词（使用11个内容洞见维度风格）
 * 要求 AI 直接输出 HTML，不使用 Markdown
 * @param {string} topic - 文章主题
 * @param {Array} searchResults - 搜索结果列表
 * @returns {string} 完整的写作提示词
 */
function generateArticlePrompt(topic, searchResults) {
  if (!Array.isArray(searchResults)) {
    searchResults = [];
  }
  
  const searchContext = searchResults
    .slice(0, 3)
    .map(r => `- ${getTitle(r)}: ${getDescription(r).substring(0, 200)}`)
    .join('\n') || '- 暂无相关素材';

  const prompt = `你是一位专业的公众号内容创作者。请基于以下"11个内容洞见维度"的思考框架，为一篇微信公众号文章撰写内容。

⚠️ 重要：请直接输出 HTML 格式，不要使用 Markdown！

---

## 文章主题
${topic}

## 参考素材
${searchContext}

---

## HTML 排版规范（必须遵守）

### 正文段落
<p style="font-size: 17px; line-height: 2.0; letter-spacing: 0.5px; color: #3f3f3f; margin-bottom: 24px; text-align: justify;">
  段落内容
</p>

### 二级标题（章节标题）
<h2 style="font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 40px 0 20px 0; padding-left: 12px; border-left: 4px solid #d9230f;">
  一、章节标题
</h2>

### 三级标题
<h3 style="font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 32px 0 16px 0;">
  子标题
</h3>

### 重点强调（金句、关键词）
<strong style="color: #d9230f; font-weight: 600;">需要强调的内容</strong>

### 引用块
<blockquote style="background: #f8f9fa; padding: 20px; margin: 32px 0; border-radius: 8px; border-left: 4px solid #999;">
  <p style="font-size: 16px; color: #555; font-style: italic; margin: 0;">
    引用内容
  </p>
</blockquote>

### 无序列表
<ul style="margin: 0 0 24px 0; padding-left: 24px;">
  <li style="font-size: 17px; line-height: 2.0; color: #3f3f3f; margin-bottom: 12px;">列表项1</li>
  <li style="font-size: 17px; line-height: 2.0; color: #3f3f3f; margin-bottom: 12px;">列表项2</li>
</ul>

### 有序列表
<ol style="margin: 0 0 24px 0; padding-left: 24px;">
  <li style="font-size: 17px; line-height: 2.0; color: #3f3f3f; margin-bottom: 12px;">第一步</li>
  <li style="font-size: 17px; line-height: 2.0; color: #3f3f3f; margin-bottom: 12px;">第二步</li>
</ol>

---

## 写作前的内在思考（11个内容洞见维度）

在动笔之前，请先基于以下11个维度进行系统思考：

### 1. 核心观点
- 确定一个有立场的、能用一句话说清的核心观点
- 确保读者看完会产生"原来如此"或"我不同意"的反应

### 2. 副观点
- 设计2-3个支撑性观点
- 从不同角度补充核心观点（案例、反面论证、延伸思考）

### 3. 说服策略
- 选择主策略：数据驱动 / 故事驱动 / 权威背书 / 类比隐喻 / 社会认同
- 组合使用2-3种策略

### 4. 情绪触发点
- 设计关键的情绪触发时刻：共鸣感、紧迫感、好奇心、优越感、恐惧感、归属感

### 5. 金句
- 准备2-3个金句，分布在开头、高潮和结尾
- 金句要表达精准、有节奏感、能独立传播
- 金句使用 <strong style="color: #d9230f; font-weight: 600;">红色强调样式</strong>

### 6. 情感曲线分析
- 开头：制造张力（悬念、冲突、反直觉）
- 中段：在"紧张-释放"之间交替
- 高潮：核心观点的最强表达
- 结尾：余韵（让读者带着情绪离开）

### 7. 情感层次
- 表层：信息传递（事实、知识、方法）
- 中层：态度和价值观共鸣
- 深层：身份认同和自我映射

### 8. 论证方式多样性
- 交替使用：个人故事/他人案例、数据研究、类比隐喻、反问设问、正反论证、场景描写

### 9. 视角转化
- 故事段落用第一人称（真实感）
- 分析段落用第三人称（客观感）
- 建议段落用第二人称（代入感）

### 10. 语言风格特征
- 句子长度：中等偏短（易读）
- 口语化：亲切聊天感
- 修辞密度：适度修辞（有趣不炫技）
- 节奏感：张弛有度
- 用词倾向：日常用语为主，适度网络用语

### 11. 互动钩子
- 设计一个让读者忍不住回应的互动点
- 可以是开放式提问、填空式互动、争议性立场、投票式选择、悬念延续

---

## 输出要求

请基于以上思考框架，撰写一篇公众号文章。

**文章要求**：
1. 字数控制在 800-1500 字
2. 结构清晰，使用 <h2> 作为章节标题
3. 语言风格符合公众号调性：亲切、易读、有价值
4. 有情感起伏，不是一马平川
5. 至少包含2-3个金句（使用红色强调样式）
6. 结尾有互动钩子

**输出格式（纯 HTML）**：

标题：[有吸引力的标题]

摘要：[一句话摘要，50字以内，体现核心观点]

正文：
[直接输出 HTML，使用上述排版规范]
- 段落使用 <p> 标签，带统一样式
- 标题使用 <h2> 标签，带红色左边框
- 金句使用 <strong> 标签，红色
- 引用使用 <blockquote> 标签

互动钩子：
[设计一个让读者想评论的结尾互动点]`;

  return prompt;
}

/**
 * 解析 AI 生成的文章内容
 * @param {string} output - AI 返回的原始文本
 * @returns {Object} 包含 title, digest, content, interactionHook
 */
function parseArticleOutput(output) {
  if (!output || typeof output !== 'string') {
    return { title: '', digest: '', content: '', interactionHook: '' };
  }
  
  const lines = output.trim().split('\n');
  
  let title = '';
  let digest = '';
  const contentLines = [];
  let interactionHook = '';
  let inContent = false;
  let inHook = false;

  for (const line of lines) {
    if (line.startsWith('标题：') || line.startsWith('标题:')) {
      const sep = line.includes('：') ? '：' : ':';
      title = line.split(sep).slice(1).join(sep).trim();
    } else if (line.startsWith('摘要：') || line.startsWith('摘要:')) {
      const sep = line.includes('：') ? '：' : ':';
      digest = line.split(sep).slice(1).join(sep).trim();
    } else if (line.startsWith('正文：') || line.startsWith('正文:')) {
      inContent = true;
      inHook = false;
    } else if (line.startsWith('互动钩子：') || line.startsWith('互动钩子:')) {
      inContent = false;
      inHook = true;
    } else if (inContent) {
      contentLines.push(line);
    } else if (inHook) {
      interactionHook += line + '\n';
    }
  }

  const content = contentLines.join('\n').trim();
  interactionHook = interactionHook.trim();

  return {
    title,
    digest,
    content,
    interactionHook
  };
}

/**
 * 从文章中提取金句
 * @param {string} content - 文章内容（HTML）
 * @returns {Array} 金句列表
 */
function extractGoldenSentences(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // 匹配红色强调的 <strong> 标签内容
  const strongPattern = /<strong[^>]*color:\s*#d9230f[^>]*>(.+?)<\/strong>/g;
  const matches = [];
  let match;
  
  while ((match = strongPattern.exec(content)) !== null) {
    // 去除 HTML 标签
    const text = match[1].replace(/<[^>]+>/g, '');
    if (text.length >= 10 && text.length <= 100) {
      matches.push(text);
    }
  }
  
  return matches.slice(0, 3);
}

/**
 * 生成内容维度分析的提示词
 * @param {string} topic - 文章主题
 * @param {Array} searchResults - 搜索结果列表
 * @returns {string} 分析提示词
 */
function analyzeContentDimensions(topic, searchResults) {
  if (!Array.isArray(searchResults)) {
    searchResults = [];
  }
  
  const searchContext = searchResults
    .slice(0, 3)
    .map(r => `- ${getTitle(r)}: ${getDescription(r).substring(0, 150)}`)
    .join('\n') || '- 暂无相关素材';

  const prompt = `基于主题"${topic}"和以下参考素材，完成"11个内容洞见维度"的分析。

参考素材：
${searchContext}

请针对这个主题，完成以下分析：

## 内容洞见维度分析

**1. 核心观点**（一句话概括文章立场）

**2. 说服策略**（主策略 + 辅助策略）

**3. 情绪触发点**（设计2-3个关键情绪触发时刻）

**4. 金句预览**（2-3个可能传播的金句方向）

**5. 情感曲线设计**（开头→中段→高潮→结尾的情绪起伏）

**6. 互动钩子**（结尾设计什么样的互动点）

这个分析将帮助用户理解文章的创作思路，确认方向后再开始正式写作。`;

  return prompt;
}

module.exports = {
  generateArticlePrompt,
  parseArticleOutput,
  extractGoldenSentences,
  analyzeContentDimensions
};
