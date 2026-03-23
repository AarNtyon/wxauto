/**
 * 配置管理模块 - 多租户版本
 * 支持按用户 ID 隔离配置文件
 */
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', 'config');

const DEFAULT_CONFIG = {
  brave_api_key: '',
  doubao_api_key: '',
  wechat_appid: '',
  wechat_secret: ''
};

const CONFIG_LABELS = {
  brave_api_key: {
    name: 'Brave Search API Key',
    desc: '用于搜索文章素材',
    help: '获取方式：https://brave.com/search/api/',
    required: true
  },
  doubao_api_key: {
    name: '豆包 API Key',
    desc: '用于生成文章封面图',
    help: '获取方式：https://www.volcengine.com/ → 豆包大模型',
    required: true
  },
  wechat_appid: {
    name: '微信公众号 AppID',
    desc: '用于自动发布文章（可选）',
    help: '获取方式：微信公众平台 → 开发 → 基本配置',
    required: false
  },
  wechat_secret: {
    name: '微信公众号 Secret',
    desc: '用于自动发布文章（可选）',
    help: '获取方式：微信公众平台 → 开发 → 基本配置',
    required: false
  }
};

/**
 * 获取用户配置文件路径
 * @param {string} userId - 用户 ID
 * @returns {string} 配置文件路径
 */
function getUserConfigPath(userId) {
  const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const userDir = path.join(CONFIG_DIR, `user_${safeUserId}`);
  
  if (!fs.existsSync(userDir)) {
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  return path.join(userDir, 'config.json');
}

/**
 * 加载指定用户的配置
 * @param {string} userId - 用户 ID
 * @returns {Object} 用户配置
 */
function loadUserConfig(userId) {
  const configPath = getUserConfigPath(userId);
  
  try {
    if (!fs.existsSync(configPath)) {
      return { ...DEFAULT_CONFIG };
    }
    const data = fs.readFileSync(configPath, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (error) {
    console.error(`加载用户 ${userId} 配置失败:`, error.message);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存指定用户的配置
 * @param {string} userId - 用户 ID
 * @param {Object} config - 配置对象
 */
function saveUserConfig(userId, config) {
  const configPath = getUserConfigPath(userId);
  
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error(`保存用户 ${userId} 配置失败:`, error.message);
    throw error;
  }
}

/**
 * 获取指定用户的配置项
 * @param {string} userId - 用户 ID
 * @param {string} key - 配置项 key
 * @returns {any} 配置值
 */
function getUserConfig(userId, key) {
  const config = loadUserConfig(userId);
  return config[key];
}

/**
 * 设置指定用户的配置项
 * @param {string} userId - 用户 ID
 * @param {string} key - 配置项 key
 * @param {any} value - 配置值
 */
function setUserConfig(userId, key, value) {
  const config = loadUserConfig(userId);
  config[key] = value;
  saveUserConfig(userId, config);
}

/**
 * 检查指定用户的配置是否完整
 * @param {string} userId - 用户 ID
 * @returns {Array} 缺失的必需配置项列表
 */
function checkUserConfig(userId) {
  const config = loadUserConfig(userId);
  const required = Object.keys(CONFIG_LABELS).filter(key => CONFIG_LABELS[key].required);
  return required.filter(key => !config[key]);
}

/**
 * 检查用户是否是首次使用
 * @param {string} userId - 用户 ID
 * @returns {boolean} 是否首次使用
 */
function isFirstTime(userId) {
  const configPath = getUserConfigPath(userId);
  return !fs.existsSync(configPath);
}

/**
 * 获取用户配置状态
 * @param {string} userId - 用户 ID
 * @returns {Object} 配置状态
 */
function getUserConfigStatus(userId) {
  const config = loadUserConfig(userId);
  const missing = checkUserConfig(userId);
  const isFirst = isFirstTime(userId);
  
  return {
    isFirstTime: isFirst,
    isComplete: missing.length === 0,
    missing: missing,
    config: config,
    missingLabels: missing.map(key => CONFIG_LABELS[key])
  };
}

/**
 * 生成配置引导消息
 * @param {string} userId - 用户 ID
 * @returns {string} 引导消息
 */
function generateConfigWelcome(userId) {
  const status = getUserConfigStatus(userId);
  
  if (status.isFirstTime) {
    return `👋 欢迎使用微信公众号自动化发布工具！

📝 首次使用需要配置以下 API Key：

1️⃣ **Brave Search API Key** - 用于搜索文章素材
   💡 获取：https://brave.com/search/api/

2️⃣ **豆包 API Key** - 用于生成文章封面图
   💡 获取：https://www.volcengine.com/

配置完成后，您就可以：
✨ 输入主题 → AI 自动写作 → 生成封面 → 发布公众号

请输入 **Brave Search API Key**：`;
  }
  
  if (!status.isComplete) {
    const missing = status.missingLabels.map((item, i) => 
      `${i + 1}. **${item.name}** - ${item.desc}`
    ).join('\n');
    
    return `⚠️ 您的配置不完整，还缺少：

${missing}

请输入缺失的配置项：`;
  }
  
  return '✅ 您的配置已完成！可以直接使用所有功能。';
}

/**
 * 交互式配置引导
 * @param {string} userId - 用户 ID
 * @param {Function} sendMessage - 发送消息函数
 * @param {Function} waitForReply - 等待用户回复函数
 * @returns {Promise<Object>} 配置结果
 */
async function interactiveConfig(userId, sendMessage, waitForReply) {
  const config = loadUserConfig(userId);
  const keys = Object.keys(CONFIG_LABELS);
  
  await sendMessage(generateConfigWelcome(userId));
  
  for (const key of keys) {
    const label = CONFIG_LABELS[key];
    
    // 如果已有值且是可选的，询问是否更新
    if (config[key] && !label.required) {
      await sendMessage(`\n${label.name} 已配置，是否需要更新？（回复"跳过"保留原值，或直接输入新值）`);
    } else if (!config[key]) {
      // 需要输入
      await sendMessage(`\n📌 **${label.name}**\n${label.desc}\n${label.help}\n\n请输入（回复"跳过"可暂时跳过）：`);
    } else {
      continue; // 已有必需值，跳过
    }
    
    const reply = await waitForReply();
    
    if (reply && reply.toLowerCase() !== '跳过' && reply.trim()) {
      config[key] = reply.trim();
      saveUserConfig(userId, config);
      await sendMessage(`✅ ${label.name} 已保存`);
    } else if (!config[key] && label.required) {
      await sendMessage(`⚠️ ${label.name} 是必需的，后续可以再次配置`);
    }
  }
  
  const status = getUserConfigStatus(userId);
  
  if (status.isComplete) {
    await sendMessage(`\n🎉 配置完成！您现在可以：\n\n✍️ 发送 "帮我写一篇关于 XXX 的公众号文章" 开始创作`);
  } else {
    await sendMessage(`\n⚠️ 配置尚未完成，缺少：${status.missing.map(k => CONFIG_LABELS[k].name).join(', ')}\n\n您可以继续使用基础功能，或发送 "配置" 继续完善。`);
  }
  
  return { ok: status.isComplete, config, missing: status.missing };
}

/**
 * 快速配置（一次性输入）
 * @param {string} userId - 用户 ID
 * @param {Object} configData - 配置数据对象
 * @returns {Object} 配置结果
 */
function quickConfig(userId, configData) {
  const config = { ...DEFAULT_CONFIG, ...configData };
  saveUserConfig(userId, config);
  
  const status = getUserConfigStatus(userId);
  return { ok: status.isComplete, config, missing: status.missing };
}

/**
 * 获取所有用户列表
 * @returns {Array} 用户 ID 列表
 */
function getAllUsers() {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      return [];
    }
    
    const dirs = fs.readdirSync(CONFIG_DIR, { withFileTypes: true });
    return dirs
      .filter(d => d.isDirectory() && d.name.startsWith('user_'))
      .map(d => d.name.replace('user_', ''));
  } catch (error) {
    console.error('获取用户列表失败:', error.message);
    return [];
  }
}

/**
 * 删除指定用户的配置
 * @param {string} userId - 用户 ID
 */
function deleteUserConfig(userId) {
  const userDir = path.dirname(getUserConfigPath(userId));
  
  try {
    if (fs.existsSync(userDir)) {
      fs.rmSync(userDir, { recursive: true });
      console.log(`✅ 用户 ${userId} 的配置已删除`);
    }
  } catch (error) {
    console.error(`删除用户 ${userId} 配置失败:`, error.message);
    throw error;
  }
}

// 向后兼容：单用户模式
const DEFAULT_USER = 'default';

const compat = {
  loadConfig: () => loadUserConfig(DEFAULT_USER),
  saveConfig: (config) => saveUserConfig(DEFAULT_USER, config),
  getConfig: (key) => getUserConfig(DEFAULT_USER, key),
  setConfig: (key, value) => setUserConfig(DEFAULT_USER, key, value),
  checkConfig: () => checkUserConfig(DEFAULT_USER),
  getConfigStatus: () => getUserConfigStatus(DEFAULT_USER),
  interactiveConfig: async (send, wait) => interactiveConfig(DEFAULT_USER, send, wait)
};

module.exports = {
  // 多租户 API
  getUserConfigPath,
  loadUserConfig,
  saveUserConfig,
  getUserConfig,
  setUserConfig,
  checkUserConfig,
  getUserConfigStatus,
  isFirstTime,
  generateConfigWelcome,
  interactiveConfig,
  quickConfig,
  getAllUsers,
  deleteUserConfig,
  CONFIG_LABELS,
  
  // 向后兼容
  ...compat,
  
  // 常量
  DEFAULT_CONFIG,
  CONFIG_DIR
};
