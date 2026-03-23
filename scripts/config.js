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

/**
 * 获取用户配置文件路径
 * @param {string} userId - 用户 ID（如 Telegram user_id）
 * @returns {string} 配置文件路径
 */
function getUserConfigPath(userId) {
  // 清理用户 ID，防止路径遍历攻击
  const safeUserId = String(userId).replace(/[^a-zA-Z0-9_-]/g, '_');
  const userDir = path.join(CONFIG_DIR, `user_${safeUserId}`);
  
  // 确保用户目录存在
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
 * @returns {Array} 缺失的配置项列表
 */
function checkUserConfig(userId) {
  const config = loadUserConfig(userId);
  const required = ['brave_api_key', 'doubao_api_key', 'wechat_appid', 'wechat_secret'];
  return required.filter(key => !config[key]);
}

/**
 * 确保配置完整（交互式）
 * @param {string} userId - 用户 ID
 * @param {Function} askUser - 询问用户的函数
 * @returns {Promise<Object>} 配置对象
 */
async function ensureUserConfig(userId, askUser) {
  const missing = checkUserConfig(userId);
  const config = loadUserConfig(userId);
  
  if (missing.length === 0) {
    return { ok: true, config, missing: [] };
  }
  
  console.log(`⚠️ 用户 ${userId} 首次使用，需要配置 API Key`);
  console.log(`缺少: ${missing.join(', ')}`);
  
  // 询问用户输入
  for (const key of missing) {
    const label = {
      brave_api_key: 'Brave Search API Key (用于搜索素材)',
      doubao_api_key: '豆包 API Key (用于生成封面)',
      wechat_appid: '微信公众号 AppID (用于自动发布，可选)',
      wechat_secret: '微信公众号 Secret (用于自动发布，可选)'
    }[key];
    
    const value = await askUser(`${label}: `);
    config[key] = value.trim();
    
    // 提示获取方式
    if (key === 'brave_api_key') {
      console.log('💡 获取方式：https://brave.com/search/api/');
    } else if (key === 'doubao_api_key') {
      console.log('💡 获取方式：https://www.volcengine.com/ → 豆包大模型');
    } else if (key === 'wechat_secret') {
      console.log('💡 获取方式：微信公众平台 → 开发 → 基本配置');
    }
  }
  
  // 保存配置
  saveUserConfig(userId, config);
  console.log('\n✅ 配置已保存！');
  
  return { ok: true, config, missing: [] };
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

// 向后兼容：单用户模式（使用默认用户）
const DEFAULT_USER = 'default';

const compat = {
  loadConfig: () => loadUserConfig(DEFAULT_USER),
  saveConfig: (config) => saveUserConfig(DEFAULT_USER, config),
  getConfig: (key) => getUserConfig(DEFAULT_USER, key),
  setConfig: (key, value) => setUserConfig(DEFAULT_USER, key, value),
  checkConfig: () => checkUserConfig(DEFAULT_USER),
  ensureConfig: async function() {
    const missing = checkUserConfig(DEFAULT_USER);
    const config = loadUserConfig(DEFAULT_USER);
    return { ok: missing.length === 0, config, missing };
  },
  initConfigInteractive: async function() {
    console.log('请使用多租户版本：ensureUserConfig(userId, askUser)');
    throw new Error('单用户模式已弃用，请使用多租户 API');
  }
};

module.exports = {
  // 多租户 API
  getUserConfigPath,
  loadUserConfig,
  saveUserConfig,
  getUserConfig,
  setUserConfig,
  checkUserConfig,
  ensureUserConfig,
  getAllUsers,
  deleteUserConfig,
  
  // 向后兼容（单用户模式）
  ...compat,
  
  // 常量
  DEFAULT_CONFIG,
  CONFIG_DIR
};
