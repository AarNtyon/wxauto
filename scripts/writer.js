/**
 * AI 写作模块 - 生成公众号文章
 * 基于 11个内容洞见维度的写作风格指南
 * 输出格式：微信最佳实践 HTML（section > p 结构，全内联样式）
 */

/**
 * 安全获取搜索结果描述
 */
function getDescription(r) {
  const desc = r.description || r.snippet || r.desc || r.summary || r.content || '';
  return String(desc);
}

/**
 * 安全获取标题
 */
function getTitle(r) {
  return String(r.title || r.name || r.heading || '未命名');
}

/**
 * 生成写作提示词
 * 要求 AI 输出微信最佳实践格式的 HTML
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

⚠️ **重要：请直接输出符合微信公众号最佳实践的 HTML 格式**

---

## 文章主题
${topic}

## 参考素材
${searchContext}

---

## 微信公众号 HTML 格式规范（必须严格遵守）

### 结构要求
- 使用 **section > p** 两层结构
- 所有样式必须 **内联 style 属性**
- 不要用 class，不要用外部 CSS
- 单列布局，不要复杂嵌套

### 可用标签
- <section> - 容器
- <p> - 段落和标题
- <span> - 行内样式
- <strong> - 加粗（红色强调）
- <em> - 斜体
- <img> - 图片

### 标题格式
一级标题（章节）：
<section style="margin:28px 0 12px 0;">
  <p style="margin:0; font-size:20px; line-height:1.5; font-weight:700; color:#1a1a1a;">一、标题内容</p>
</section>

二级标题：
<section style="margin:24px 0 10px 0;">
  <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#222222;">小标题</p>
</section>

### 正文格式
<section style="margin:0 0 18px 0;">
  <p style="margin:0 0 14px 0; font-size:16px; line-height:1.85; color:#333333;">正文内容</p>
</section>

### 金句/强调格式（红色）
<strong style="color:#d9230f; font-weight:700;">金句内容</strong>

### 引用框格式（左边红色边框）
<section style="padding:14px 16px; background-color:#f7f7f7; border-left:4px solid #d9230f; margin:18px 0;">
  <p style="margin:0; font-size:15px; line-height:1.8; color:#555555;">引用内容</p>
</section>

### 高亮框格式（橙色背景）
<section style="padding:14px 16px; background-color:#fff8f0; border-radius:8px; margin:18px 0;">
  <p style="margin:0; font-size:15px; line-height:1.8; color:#d9730f;">重点提示</p>
</section>

### 列表格式（用段落模拟）
<section style="margin:0 0 10px 0;">
  <p style="margin:0; font-size:16px; line-height:1.8; color:#333333;"><span style="color:#d9230f; font-weight:700;">1.</span> 列表项内容</p>
</section>

---

## 11个内容洞见维度（写作前思考）

1. **核心观点** - 一句话说清的锐利立场
2. **副观点** - 2-3个支撑性观点
3. **说服策略** - 数据/故事/权威/类比/社会认同
4. **情绪触发点** - 共鸣/紧迫/好奇/优越/恐惧/归属
5. **金句** - 2-3个，用红色 <strong> 强调
6. **情感曲线** - 开头张力→中段交替→高潮→余韵
7. **情感层次** - 表层信息→中层态度→深层认同
8. **论证多样性** - 故事/数据/类比/反问交替
9. **视角转化** - 第一/二/三人称灵活切换
10. **语言风格** - 亲切、口语化、张弛有度
11. **互动钩子** - 降低回复门槛的互动设计

---

## 输出要求

1. 字数：800-1500 字
2. 结构：主标题 + 3-5 个章节（一级标题）
3. 格式：严格按照上述 HTML 规范
4. 金句：2-3 个，使用红色 <strong> 标签
5. 引用：至少 1 处重点引用框

**输出格式**：

标题：[文章标题]

摘要：[一句话摘要，50字以内]

正文：
[直接输出 HTML，section > p 结构，全内联样式]

互动钩子：
[引导评论的话术]`;

  return prompt;
}

/**
 * 解析 AI 生成的文章内容
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

  return { title, digest, content, interactionHook };
}

/**
 * 从文章中提取金句（红色 strong 标签内容）
 */
function extractGoldenSentences(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }
  
  // 匹配红色强调的 strong 标签
  const pattern = /<strong[^>]*color:\s*#d9230f[^>]*>(.+?)<\/strong>/g;
  const matches = [];
  let match;
  
  while ((match = pattern.exec(content)) !== null) {
    // 去除 HTML 标签
    const text = match[1].replace(/<[^>]+>/g, '');
    if (text.length >= 8 && text.length <= 80) {
      matches.push(text);
    }
  }
  
  return [...new Set(matches)].slice(0, 3); // 去重，最多3个
}

module.exports = {
  generateArticlePrompt,
  parseArticleOutput,
  extractGoldenSentences
};
