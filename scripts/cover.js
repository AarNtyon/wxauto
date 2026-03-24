/**
 * 封面图片生成模块 - 多租户版本
 * 调用豆包 API
 */
const axios = require('axios');
const { getUserConfig } = require('./config');

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
  
  const prompt = `${styleDesc}。文章主题：${title}。画面简洁，主题突出，视觉吸引力强，有视觉冲击力，高清品质，不要有文字，适合作为文章首图（横版 16:9 比例）`;

  return prompt;
}

/**
 * 生成封面图片
 * @param {string} userId - 用户 ID
 * @param {string} title - 文章标题
 * @param {string} style - 风格类型
 * @returns {Promise<string>} 生成的图片 URL
 */
async function generateCover(userId, title, style = 'creative') {
  const apiKey = getUserConfig(userId, 'doubao_api_key');
  if (!apiKey) {
    throw new Error(`用户 ${userId} 未配置豆包 API Key`);
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
        size: '2560x1440',
        stream: false,
        watermark: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    const result = response.data;
    
    if (result.data && result.data.length > 0) {
      const imageUrl = result.data[0].url;
      if (!imageUrl) {
        throw new Error('封面生成成功但未返回图片 URL，请重试');
      }
      return imageUrl;
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
  lines.push('\n💡 封面尺寸：2560×1440（16:9 高清）');
  return lines.join('\n');
}

module.exports = {
  generateCoverPrompt,
  generateCover,
  formatStyleOptions,
  COVER_STYLES
};
