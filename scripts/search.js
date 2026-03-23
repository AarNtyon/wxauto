/**
 * 混合搜索模块 - 结合 AI 自带搜索和 Brave API
 */
const axios = require('axios');
const { getConfig } = require('./config');

const BRAVE_API_URL = 'https://api.search.brave.com/res/v1/web/search';

/**
 * 从 AI 自带搜索结果中提取结构化数据
 * 用于处理 Kimi SearchWeb 返回的结果
 * @param {Array} aiResults - AI 搜索结果
 * @returns {Array} 标准化的搜索结果
 */
function normalizeAIResults(aiResults) {
  if (!Array.isArray(aiResults)) {
    return [];
  }
  
  return aiResults.map(item => ({
    title: item.title || item.name || '未命名',
    description: item.description || item.snippet || item.summary || item.content || '',
    url: item.url || item.link || item.href || '',
    source: 'ai'  // 标记来源
  }));
}

/**
 * Brave API 搜索
 * @param {string} topic - 搜索主题
 * @param {number} count - 返回结果数量
 * @returns {Promise<Array>} 搜索结果列表
 */
async function searchBrave(topic, count = 5) {
  const apiKey = getConfig('brave_api_key');
  if (!apiKey) {
    console.log('⚠️ Brave API Key 未配置，跳过 Brave 搜索');
    return [];
  }

  try {
    const response = await axios.get(BRAVE_API_URL, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey
      },
      params: {
        q: topic,
        count: count,
        offset: 0
      },
      timeout: 30000
    });

    const results = [];
    let webResults = [];
    
    if (response.data.web && response.data.web.results) {
      webResults = response.data.web.results;
    } else if (response.data.results) {
      webResults = response.data.results;
    } else if (Array.isArray(response.data)) {
      webResults = response.data;
    }
    
    for (const item of webResults) {
      results.push({
        title: item.title || '',
        description: item.description || item.desc || item.snippet || '',
        url: item.url || '',
        source: 'brave'
      });
    }

    console.log(`✅ Brave 搜索完成，找到 ${results.length} 条结果`);
    return results;
  } catch (error) {
    console.error('⚠️ Brave 搜索失败:', error.message);
    return [];
  }
}

/**
 * 混合搜索 - 结合 AI 搜索和 Brave 搜索
 * @param {string} topic - 搜索主题
 * @param {Array} aiResults - AI 自带搜索结果（由 Kimi SearchWeb 提供）
 * @param {number} braveCount - Brave 搜索数量
 * @returns {Promise<Array>} 合并后的搜索结果
 */
async function searchHybrid(topic, aiResults = [], braveCount = 5) {
  console.log(`🔍 开始混合搜索: "${topic}"`);
  console.log(`   AI 搜索结果: ${aiResults.length} 条`);
  
  // 1. 标准化 AI 搜索结果
  const normalizedAI = normalizeAIResults(aiResults);
  
  // 2. 获取 Brave 搜索结果
  const braveResults = await searchBrave(topic, braveCount);
  
  // 3. 合并结果（去重）
  const merged = [...normalizedAI];
  const seenUrls = new Set(normalizedAI.map(r => r.url).filter(Boolean));
  
  for (const item of braveResults) {
    if (item.url && !seenUrls.has(item.url)) {
      merged.push(item);
      seenUrls.add(item.url);
    } else if (!item.url) {
      // 没有 URL 的也加入（可能是摘要信息）
      merged.push(item);
    }
  }
  
  // 4. 排序：优先 AI 结果（通常更相关），然后 Brave
  merged.sort((a, b) => {
    if (a.source === 'ai' && b.source !== 'ai') return -1;
    if (a.source !== 'ai' && b.source === 'ai') return 1;
    return 0;
  });
  
  console.log(`✅ 混合搜索完成，共 ${merged.length} 条结果（AI: ${normalizedAI.length}, Brave: ${braveResults.length}）`);
  return merged;
}

/**
 * 格式化搜索结果用于展示
 * @param {Array} results - 搜索结果列表
 * @returns {string} 格式化后的字符串
 */
function formatSearchResults(results) {
  if (!results || results.length === 0) {
    return '未找到相关素材';
  }

  const lines = ['🔍 搜索结果：\n'];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const sourceTag = r.source === 'ai' ? '🤖' : '🔎';
    const desc = r.description || '';
    lines.push(`${i + 1}. ${sourceTag} **${r.title}**`);
    lines.push(`   ${desc.substring(0, 100)}${desc.length > 100 ? '...' : ''}`);
    if (r.url) {
      lines.push(`   链接: ${r.url.substring(0, 60)}${r.url.length > 60 ? '...' : ''}`);
    }
    lines.push('');
  }
  
  lines.push('💡 🤖 = AI 搜索  🔎 = Brave 搜索\n');

  return lines.join('\n');
}

/**
 * 提取搜索关键词优化建议
 * @param {string} topic - 原始主题
 * @returns {string} 优化后的搜索词
 */
function optimizeSearchQuery(topic) {
  // 添加时间限定词，获取最新信息
  const timeModifiers = ['2024', '2025', '最新'];
  
  // 如果主题已经包含年份，不再添加
  if (/\d{4}/.test(topic)) {
    return topic;
  }
  
  // 随机选择一个时间限定词（避免每次都一样）
  const modifier = timeModifiers[Math.floor(Math.random() * timeModifiers.length)];
  
  return `${topic} ${modifier}`;
}

module.exports = {
  searchBrave,
  searchHybrid,
  normalizeAIResults,
  formatSearchResults,
  optimizeSearchQuery
};
