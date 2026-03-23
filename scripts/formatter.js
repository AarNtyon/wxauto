/**
 * 公众号格式编排模块 - 微信公众号文章格式化工具
 * 将 Markdown/纯文本转换为公众号兼容的 HTML
 */

// 排版样式配置
const STYLES = {
  paragraph: 'font-size: 17px; line-height: 2.0; letter-spacing: 0.5px; color: #3f3f3f; margin-bottom: 24px; text-align: justify;',
  h2: 'font-size: 18px; font-weight: 600; color: #1a1a1a; margin: 40px 0 20px 0; padding-left: 12px; border-left: 4px solid #d9230f;',
  h3: 'font-size: 16px; font-weight: 600; color: #1a1a1a; margin: 32px 0 16px 0;',
  strong: 'color: #d9230f; font-weight: 600;',
  blockquote: 'background: #f8f9fa; padding: 20px; margin: 32px 0; border-radius: 8px; border-left: 4px solid #999;',
  blockquoteP: 'font-size: 16px; color: #555; font-style: italic; margin: 0;',
  ul: 'margin: 0 0 24px 0; padding-left: 24px;',
  li: 'font-size: 17px; line-height: 2.0; color: #3f3f3f; margin-bottom: 12px;',
  title: 'font-size: 24px; font-weight: 600; color: #1a1a1a; line-height: 1.5; margin: 0 0 16px 0;',
  author: 'font-size: 15px; color: #333; font-weight: 500;',
  authorWrapper: 'display: flex; align-items: center; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 1px solid #e8e8e8;',
  lead: 'background: #f8f9fa; border-left: 4px solid #d9230f; padding: 20px; margin-bottom: 32px; border-radius: 0 8px 8px 0;',
  leadP: 'font-size: 16px; color: #555; line-height: 1.8; margin: 0; font-style: italic;'
};

/**
 * WechatFormatter 类 - 微信公众号文章格式化器
 */
class WechatFormatter {
  constructor() {
    this._codeBlocks = [];
  }

  /**
   * 格式化文本为公众号 HTML
   * @param {string} text - 输入文本
   * @returns {string} 格式化后的 HTML
   */
  format(text) {
    // 清理文本
    text = text.trim();

    // 保护代码块
    text = this._protectCodeBlocks(text);

    // 转换标题
    text = this._convertHeaders(text);

    // 转换列表
    text = this._convertLists(text);

    // 转换引用块
    text = this._convertBlockquotes(text);

    // 转换加粗
    text = this._convertBold(text);

    // 转换段落
    text = this._convertParagraphs(text);

    // 恢复代码块
    text = this._restoreCodeBlocks(text);

    return text.trim();
  }

  /**
   * 保护代码块不被处理
   * @param {string} text - 原文本
   * @returns {string} 保护后的文本
   */
  _protectCodeBlocks(text) {
    this._codeBlocks = [];

    // 保护 ``` 代码块
    text = text.replace(/```[\s\S]*?```/g, (match) => {
      this._codeBlocks.push(match);
      return `<!--CODE_BLOCK_${this._codeBlocks.length - 1}-->`;
    });

    // 保护 ` 行内代码
    text = text.replace(/`([^`]+)`/g, (match) => {
      this._codeBlocks.push(match);
      return `<!--CODE_BLOCK_${this._codeBlocks.length - 1}-->`;
    });

    return text;
  }

  /**
   * 恢复代码块
   * @param {string} text - 文本
   * @returns {string} 恢复后的文本
   */
  _restoreCodeBlocks(text) {
    for (let i = 0; i < this._codeBlocks.length; i++) {
      text = text.replace(`<!--CODE_BLOCK_${i}-->`, this._codeBlocks[i]);
    }
    return text;
  }

  /**
   * 转换 Markdown 标题为 HTML
   * @param {string} text - 文本
   * @returns {string} 转换后的文本
   */
  _convertHeaders(text) {
    // ## 二级标题 → 带红色边框
    text = text.replace(/^##\s*(.+)$/gm, (match, p1) => {
      return `<h2 style="${STYLES.h2}">${p1.trim()}</h2>`;
    });

    // ### 三级标题
    text = text.replace(/^###\s*(.+)$/gm, (match, p1) => {
      return `<h3 style="${STYLES.h3}">${p1.trim()}</h3>`;
    });

    return text;
  }

  /**
   * 转换无序列表
   * @param {string} text - 文本
   * @returns {string} 转换后的文本
   */
  _convertLists(text) {
    const lines = text.split('\n');
    const result = [];
    let inList = false;
    let listItems = [];

    for (const line of lines) {
      const listMatch = line.match(/^[\s]*[-*+]\s+(.+)$/);
      if (listMatch) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        let content = listMatch[1];
        // 处理列表项内的加粗
        content = this._convertInlineBold(content);
        listItems.push(`<li style="${STYLES.li}">${content}</li>`);
      } else {
        if (inList) {
          result.push(`<ul style="${STYLES.ul}">\n    ${listItems.join('\n    ')}\n</ul>`);
          inList = false;
          listItems = [];
        }
        result.push(line);
      }
    }

    if (inList) {
      result.push(`<ul style="${STYLES.ul}">\n    ${listItems.join('\n    ')}\n</ul>`);
    }

    return result.join('\n');
  }

  /**
   * 转换引用块
   * @param {string} text - 文本
   * @returns {string} 转换后的文本
   */
  _convertBlockquotes(text) {
    const lines = text.split('\n');
    const result = [];
    let inQuote = false;
    let quoteLines = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('>')) {
        if (!inQuote) {
          inQuote = true;
          quoteLines = [];
        }
        quoteLines.push(trimmed.slice(1).trim());
      } else {
        if (inQuote) {
          let quoteContent = quoteLines.join(' ');
          quoteContent = this._convertInlineBold(quoteContent);
          result.push(`<blockquote style="${STYLES.blockquote}">\n    <p style="${STYLES.blockquoteP}">${quoteContent}</p>\n</blockquote>`);
          inQuote = false;
          quoteLines = [];
        }
        result.push(line);
      }
    }

    if (inQuote) {
      let quoteContent = quoteLines.join(' ');
      quoteContent = this._convertInlineBold(quoteContent);
      result.push(`<blockquote style="${STYLES.blockquote}">\n    <p style="${STYLES.blockquoteP}">${quoteContent}</p>\n</blockquote>`);
    }

    return result.join('\n');
  }

  /**
   * 转换加粗文本
   * @param {string} text - 文本
   * @returns {string} 转换后的文本
   */
  _convertBold(text) {
    return this._convertInlineBold(text);
  }

  /**
   * 转换行内加粗
   * @param {string} text - 文本
   * @returns {string} 转换后的文本
   */
  _convertInlineBold(text) {
    return text.replace(/\*\*(.+?)\*\*/g, (match, p1) => {
      return `<strong style="${STYLES.strong}">${p1}</strong>`;
    });
  }

  /**
   * 转换段落
   * @param {string} text - 文本
   * @returns {string} 转换后的文本
   */
  _convertParagraphs(text) {
    const lines = text.split('\n');
    const result = [];
    let currentPara = [];

    for (const line of lines) {
      const stripped = line.trim();

      // 跳过空行和已经是 HTML 标签的行
      if (!stripped || (stripped.startsWith('<') && stripped.endsWith('>'))) {
        if (currentPara.length > 0) {
          let paraText = currentPara.join(' ');
          paraText = this._convertInlineBold(paraText);
          result.push(`<p style="${STYLES.paragraph}">${paraText}</p>`);
          currentPara = [];
        }
        if (stripped) {
          result.push(line);
        }
      } else {
        currentPara.push(stripped);
      }
    }

    if (currentPara.length > 0) {
      let paraText = currentPara.join(' ');
      paraText = this._convertInlineBold(paraText);
      result.push(`<p style="${STYLES.paragraph}">${paraText}</p>`);
    }

    return result.join('\n\n');
  }

  /**
   * 添加标题和作者信息
   * @param {string} html - HTML 内容
   * @param {string} title - 标题
   * @param {string} author - 作者（可选）
   * @returns {string} 完整的 HTML
   */
  addTitle(html, title, author = '') {
    let header = `<h1 style="${STYLES.title}">${title}</h1>\n\n`;

    if (author) {
      header += `<div style="${STYLES.authorWrapper}">\n    <div style="${STYLES.author}">${author}</div>\n</div>\n\n`;
    }

    return header + html;
  }

  /**
   * 添加导语/引言
   * @param {string} html - HTML 内容
   * @param {string} leadText - 导语内容
   * @returns {string} 完整的 HTML
   */
  addLead(html, leadText) {
    const lead = `<div style="${STYLES.lead}">\n    <p style="${STYLES.leadP}">${leadText}</p>\n</div>\n\n`;
    return lead + html;
  }
}

/**
 * 快速格式化函数
 * @param {string} text - 输入文本
 * @param {Object} options - 选项 { title, author, lead }
 * @returns {string} 格式化后的 HTML
 */
function formatToHtml(text, options = {}) {
  const formatter = new WechatFormatter();
  let html = formatter.format(text);

  // 添加导语
  if (options.lead) {
    html = formatter.addLead(html, options.lead);
  }

  // 添加标题和作者
  if (options.title) {
    html = formatter.addTitle(html, options.title, options.author);
  }

  return html;
}

module.exports = {
  WechatFormatter,
  formatToHtml,
  STYLES
};
