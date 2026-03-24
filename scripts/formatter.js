/**
 * 公众号格式编排模块 - 微信公众号最佳实践版本
 * 遵循微信富文本白名单环境设计
 * 核心原则：少标签、少层级、全内联样式、单列布局
 */

/**
 * HTML 转义
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * 格式化行内文本（加粗、斜体）- 仅用于纯文本
 */
function formatInline(text) {
  if (!text) return '';
  
  // 转义 HTML
  let result = escapeHtml(text);
  
  // 加粗 **text** -> <strong style="color:#d9230f; font-weight:700;">text</strong>
  result = result.replace(/\*\*(.+?)\*\*/g, '<strong style="color:#d9230f; font-weight:700;">$1</strong>');
  
  // 斜体 *text* -> <em style="font-style:italic; color:#555;">text</em>
  result = result.replace(/\*([^*]+)\*/g, '<em style="font-style:italic; color:#555;">$1</em>');
  
  return result;
}

/**
 * 生成完整的公众号文章 HTML
 * AI 已经输出了 HTML 格式内容，这里只需要添加外层包装
 * @param {string} title - 文章标题
 * @param {string} content - AI 生成的 HTML 内容
 * @param {string} author - 作者（可选）
 * @param {string} lead - 导语/摘要（可选）
 * @returns {string} 完整的公众号 HTML
 */
function generateFullArticle(title, content, author = '', lead = '') {
  const sections = [];
  
  // 外层容器
  sections.push('<section style="padding:0 16px; box-sizing:border-box;">');
  
  // 主标题
  sections.push(`
<section style="margin:24px 0 16px 0;">
  <p style="margin:0; font-size:24px; line-height:1.4; font-weight:700; color:#111111;">${escapeHtml(title)}</p>
</section>`);
  
  // 作者信息
  if (author) {
    sections.push(`
<section style="margin:0 0 20px 0;">
  <p style="margin:0; font-size:14px; line-height:1.6; color:#888888;">${escapeHtml(author)}</p>
</section>`);
  }
  
  // 分隔线
  sections.push(`
<section style="margin:24px 0;">
  <p style="margin:0; height:1px; background-color:#e8e8e8;"></p>
</section>`);
  
  // 导语（如果有）
  if (lead) {
    sections.push(`
<section style="padding:14px 16px; background-color:#fff8f0; border-radius:8px; margin:18px 0;">
  <p style="margin:0; font-size:15px; line-height:1.8; color:#d9730f;">${escapeHtml(lead)}</p>
</section>`);
  }
  
  // 正文内容（直接使用 AI 生成的 HTML，不做转义）
  sections.push(content);
  
  // 结尾提示
  sections.push(`
<section style="text-align:center; margin:28px 0 8px 0;">
  <span style="display:inline-block; padding:10px 20px; background-color:#d9230f; color:#ffffff; font-size:15px; line-height:1.4; border-radius:999px;">你觉得这篇文章有帮助吗？</span>
</section>`);
  
  // 关闭外层容器
  sections.push('</section>');
  
  return sections.join('\n');
}

/**
 * 快速格式化函数
 * @param {string} content - AI 生成的 HTML 内容
 * @param {Object} options - 选项 { title, author, lead }
 * @returns {string} 完整的公众号 HTML
 */
function formatToHtml(content, options = {}) {
  return generateFullArticle(
    options.title || '无标题',
    content,
    options.author,
    options.lead
  );
}

/**
 * 将纯文本/Markdown 转换为公众号 HTML（备用，当 AI 未输出 HTML 时使用）
 * @param {string} markdown - Markdown 内容
 * @returns {string} 公众号兼容的 HTML
 */
function markdownToWechatHtml(markdown) {
  if (!markdown) return '';
  
  // 检查是否已经是 HTML
  if (markdown.trim().startsWith('<')) {
    // 已经是 HTML，直接返回
    return markdown;
  }
  
  const lines = markdown.trim().split('\n');
  const sections = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    if (!line) {
      i++;
      continue;
    }
    
    // 主标题 #
    if (line.startsWith('# ')) {
      const text = line.substring(2).trim();
      sections.push(`
<section style="margin:24px 0 16px 0;">
  <p style="margin:0; font-size:24px; line-height:1.4; font-weight:700; color:#111111;">${escapeHtml(text)}</p>
</section>`);
      i++;
      continue;
    }
    
    // 一级标题 ##
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      sections.push(`
<section style="margin:28px 0 12px 0;">
  <p style="margin:0; font-size:20px; line-height:1.5; font-weight:700; color:#1a1a1a;">${escapeHtml(text)}</p>
</section>`);
      i++;
      continue;
    }
    
    // 二级标题 ###
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      sections.push(`
<section style="margin:24px 0 10px 0;">
  <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#222222;">${escapeHtml(text)}</p>
</section>`);
      i++;
      continue;
    }
    
    // 引用块 >
    if (line.startsWith('> ')) {
      const quoteLines = [];
      while (i < lines.length && lines[i].trim().startsWith('> ')) {
        quoteLines.push(lines[i].trim().substring(2));
        i++;
      }
      sections.push(`
<section style="padding:14px 16px; background-color:#f7f7f7; border-left:4px solid #d9230f; margin:18px 0;">
  <p style="margin:0; font-size:15px; line-height:1.8; color:#555555;">${formatInline(quoteLines.join(' '))}</p>
</section>`);
      continue;
    }
    
    // 无序列表
    if (line.match(/^[-*]\s/)) {
      const listItems = [];
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        const itemText = lines[i].trim().substring(2);
        listItems.push(`<span style="color:#d9230f; font-weight:700;">•</span> ${formatInline(itemText)}`);
        i++;
      }
      sections.push(`
<section style="margin:0 0 18px 0;">
  <p style="margin:0 0 10px 0; font-size:16px; line-height:1.8; color:#333333;">${listItems.join('<br>')}</p>
</section>`);
      continue;
    }
    
    // 分隔线
    if (line === '---' || line === '***') {
      sections.push(`
<section style="margin:24px 0;">
  <p style="margin:0; height:1px; background-color:#e8e8e8;"></p>
</section>`);
      i++;
      continue;
    }
    
    // 普通段落
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^[#>\-*]/)) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      sections.push(`
<section style="margin:0 0 18px 0;">
  <p style="margin:0 0 14px 0; font-size:16px; line-height:1.85; color:#333333;">${formatInline(paraLines.join(' '))}</p>
</section>`);
    }
    
    i++;
  }
  
  return sections.join('\n');
}

module.exports = {
  generateFullArticle,
  formatToHtml,
  markdownToWechatHtml,
  escapeHtml,
  formatInline
};
