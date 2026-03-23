/**
 * 封面图片生成模块 - 调用豆包 API
 */
const axios = require('axios');
const { getConfig } = require('./config');

const DOUBAO_API_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';

const COVER_STYLES = {
  realistic: '写实风格，真实照片质感',
  illustration: '插画风格，色彩丰富',
  minimal: '极简风格，扁平化设计',
  creative: '创意设计，富有想象力'
};

const STYLE_PROMPTS = {
  realistic: '写实风格，真实照片质感，高清摄影',
  illustration: '插画风格，色彩丰富，艺术插画',
  minimal: '极简风格，扁平化设计，简洁大气',
  creative: '创意设计，富有想象力，超现实主义'
};

/**
 * 生成封面图片提示词
 * @param {string} title - 文章标题
 * @param {string} style - 风格类型
 * @returns {string} 图片生成提示词
 */
function generateCoverPrompt(title, style = 'creative') {
  const styleDesc = STYLE_PROMPTS[style] || STYLE_PROMPTS.creative;
  
  const prompt = `${styleDesc}。文章主题：${title}。画面简洁，主题突出，视觉吸引力强，高清品质，不要有文字，适合作为微信公众号文章首图（横版宽屏比例，约 900×383）`;

  return prompt;
}

/**
 * 生成封面图片
 * @param {string} title - 文章标题
 * @param {string} style - 风格类型
 * @returns {Promise<string>} 生成的图片 URL
 */
async function generateCover(title, style = 'creative') {
  const apiKey = getConfig('doubao_api_key');
  if (!apiKey) {
    throw new Error('豆包 API Key 未配置');
  }

  const prompt = generateCoverPrompt(title, style);

  try {
    const response = await axios.post(
      DOUBAO_API_URL,
      {
        model: 'doubao-seedream-5-0-260128',
        prompt: prompt,
        sequential_image_generation: 'disabled',
        response_format: 'url',
        size: '2560x1440',  // 16:9 比例，满足豆包最小像素要求 (3686400)
        stream: false,
        watermark: false   // 无水印
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2分钟超时
      }
    );

    const result = response.data;
    
    // 根据 response_format: 'url'，返回图片 URL
    if (result.data && result.data.length > 0) {
      return result.data[0].url || '';
    }

    throw new Error(`封面生成失败: ${JSON.stringify(result)}`);
  } catch (error) {
    if (error.response) {
      throw new Error(`封面生成失败: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`封面生成失败: ${error.message}`);
  }
}

/**
 * 格式化风格选项用于展示
 * @returns {string} 格式化的风格选项
 */
function formatStyleOptions() {
  const lines = ['🎨 请选择封面风格：\n'];
  for (const [key, desc] of Object.entries(COVER_STYLES)) {
    lines.push(`- \`${key}\`: ${desc}`);
  }
  lines.push('\n💡 封面尺寸：2560×1440（16:9 高清，可裁剪为公众号首图）');
  return lines.join('\n');
}

module.exports = {
  generateCoverPrompt,
  generateCover,
  formatStyleOptions,
  COVER_STYLES
};
