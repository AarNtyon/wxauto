/**
 * 公众号格式编排模块 - 微信公众号最佳实践版本
 * 遵循微信富文本白名单环境设计
 * 核心原则：少标签、少层级、全内联样式、单列布局
 */

// 微信公众号 HTML 模板配置
const TEMPLATES = {
  // 文章外层容器
  wrapper: (content) => `<section style="padding:0 16px; box-sizing:border-box;">${content}</section>`,
  
  // 主标题
  mainTitle: (text) => `
<section style="margin:24px 0 16px 0;">
  <p style="margin:0; font-size:24px; line-height:1.4; font-weight:700; color:#111111;">${escapeHtml(text)}</p>
</section>`,
  
  // 作者信息
  author: (text) => `
<section style="margin:0 0 20px 0;">
  <p style="margin:0; font-size:14px; line-height:1.6; color:#888888;">${escapeHtml(text)}</p>
</section>`,
  
  // 一级标题（章节标题）
  h1: (text) => `
<section style="margin:28px 0 12px 0;">
  <p style="margin:0; font-size:20px; line-height:1.5; font-weight:700; color:#1a1a1a;">${escapeHtml(text)}</p>
</section>`,
  
  // 二级标题
  h2: (text) => `
<section style="margin:24px 0 10px 0;">
  <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#222222;">${escapeHtml(text)}</p>
</section>`,
  
  // 正文段落
  paragraph: (text) => `
<section style="margin:0 0 18px 0;">
  <p style="margin:0 0 14px 0; font-size:16px; line-height:1.85; color:#333333;">${formatInline(text)}</p>
</section>`,
  
  // 引用块（重点提示）
  blockquote: (text) => `
<section style="padding:14px 16px; background-color:#f7f7f7; border-left:4px solid #d9230f; margin:18px 0;">
  <p style="margin:0; font-size:15px; line-height:1.8; color:#555555;">${escapeHtml(text)}</p>
</section>`,
  
  // 高亮框
  highlight: (text) => `
<section style="padding:14px 16px; background-color:#fff8f0; border-radius:8px; margin:18px 0;">
  <p style="margin:0; font-size:15px; line-height:1.8; color:#d9730f;">${escapeHtml(text)}</p>
</section>`,
  
  // 列表项（使用段落模拟）
  listItem: (index, text) => `
<section style="margin:0 0 10px 0;">
  <p style="margin:0; font-size:16px; line-height:1.8; color:#333333;"><span style="color:#d9230f; font-weight:700;">${index}</span> ${formatInline(text)}</p>
</section>`,
  
  // CTA 按钮块
  cta: (text) => `
<section style="text-align:center; margin:28px 0 8px 0;">
  <span style="display:inline-block; padding:10px 20px; background-color:#d9230f; color:#ffffff; font-size:15px; line-height:1.4; border-radius:999px;">${escapeHtml(text)}</span>
</section>`,
  
  // 分隔线
  divider: () => `
<section style="margin:24px 0;">
  <p style="margin:0; height:1px; background-color:#e8e8e8;"></p>
</section>`,
  
  // 图片
  image: (src, alt) => `
<section style="margin:18px 0;">
  <img src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" style="display:block; width:100%; height:auto; border-radius:8px;" />
</section>`
};

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
 * 格式化行内文本（加粗、斜体）
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
 * 解析 Markdown 并转换为公众号 HTML
 * @param {string} markdown - Markdown 内容
 * @returns {string} 公众号兼容的 HTML
 */
function markdownToWechatHtml(markdown) {
  if (!markdown) return '';
  
  const lines = markdown.trim().split('\n');
  const sections = [];
  let i = 0;
  
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // 空行跳过
    if (!line) {
      i++;
      continue;
    }
    
    // 主标题 #
    if (line.startsWith('# ')) {
      const text = line.substring(2).trim();
      sections.push(TEMPLATES.mainTitle(text));
      i++;
      continue;
    }
    
    // 一级标题 ##
    if (line.startsWith('## ')) {
      const text = line.substring(3).trim();
      sections.push(TEMPLATES.h1(text));
      i++;
      continue;
    }
    
    // 二级标题 ###
    if (line.startsWith('### ')) {
      const text = line.substring(4).trim();
      sections.push(TEMPLATES.h2(text));
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
      sections.push(TEMPLATES.blockquote(quoteLines.join(' ')));
      continue;
    }
    
    // 高亮块 [!TIP]
    if (line.startsWith('[!TIP]') || line.startsWith('[!NOTE]')) {
      const tipText = line.substring(line.indexOf(']') + 1).trim();
      sections.push(TEMPLATES.highlight(tipText || '重点提示'));
      i++;
      continue;
    }
    
    // 无序列表 - 或 *
    if (line.match(/^[-*]\s/)) {
      const listSections = [];
      let index = 1;
      while (i < lines.length && lines[i].trim().match(/^[-*]\s/)) {
        const itemText = lines[i].trim().substring(2);
        listSections.push(TEMPLATES.listItem(`${index}.`, itemText));
        index++;
        i++;
      }
      sections.push(listSections.join(''));
      continue;
    }
    
    // 有序列表 1.
    if (line.match(/^\d+\.\s/)) {
      const listSections = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s/)) {
        const match = lines[i].trim().match(/^(\d+)\.\s(.+)/);
        if (match) {
          listSections.push(TEMPLATES.listItem(`${match[1]}.`, match[2]));
        }
        i++;
      }
      sections.push(listSections.join(''));
      continue;
    }
    
    // CTA 按钮 [按钮文字]
    if (line.startsWith('[') && line.endsWith(']') && line.length > 2) {
      const btnText = line.slice(1, -1);
      sections.push(TEMPLATES.cta(btnText));
      i++;
      continue;
    }
    
    // 分隔线 ---
    if (line === '---' || line === '***') {
      sections.push(TEMPLATES.divider());
      i++;
      continue;
    }
    
    // 图片 ![alt](url)
    if (line.startsWith('![')) {
      const match = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) {
        sections.push(TEMPLATES.image(match[2], match[1]));
      }
      i++;
      continue;
    }
    
    // 普通段落
    const paraLines = [];
    while (i < lines.length && lines[i].trim() && !lines[i].trim().match(/^[#>\-\*\d!\[]/)) {
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length > 0) {
      sections.push(TEMPLATES.paragraph(paraLines.join(' ')));
    }
    
    i++;
  }
  
  return sections.join('\n');
}

/**
 * 生成完整的公众号文章 HTML
 * @param {string} title - 文章标题
 * @param {string} content - Markdown 内容
 * @param {string} author - 作者（可选）
 * @param {string} lead - 导语/摘要（可选）
 * @returns {string} 完整的公众号 HTML
 */
function generateFullArticle(title, content, author = '', lead = '') {
  const sections = [];
  
  // 主标题
  sections.push(TEMPLATES.mainTitle(title));
  
  // 作者信息
  if (author) {
    sections.push(TEMPLATES.author(author));
  }
  
  // 分隔线
  sections.push(TEMPLATES.divider());
  
  // 导语（如果有）
  if (lead) {
    sections.push(TEMPLATES.highlight(lead));
  }
  
  // 正文内容
  sections.push(markdownToWechatHtml(content));
  
  // 包装外层容器
  return TEMPLATES.wrapper(sections.join('\n'));
}

/**
 * 快速格式化函数
 * @param {string} content - Markdown 内容
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

module.exports = {
  markdownToWechatHtml,
  generateFullArticle,
  formatToHtml,
  TEMPLATES,
  escapeHtml,
  formatInline
};
