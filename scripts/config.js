/**
 * 配置管理模块 - 多租户版本（强制完整配置）
 * 支持按用户 ID 隔离配置文件，必需项必须全部填写
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

// 配置项定义
const CONFIG_FIELDS = [
  {
    key: 'brave_api_key',
    name: 'Brave Search API Key',
    desc: '用于搜索文章素材',
    help: '获取方式：https://brave.com/search/api/',
    required: true,
    validate: (val) => val.length >= 10
  },
  {
    key: 'doubao_api_key',
    name: '豆包 API Key',
    desc: '用于生成文章封面图',
    help: '获取方式：https://www.volcengine.com/ → 豆包大模型',
    required: true,
    validate: (val) => val.length >= 10
  },
  {
    key: 'wechat_appid',
    name: '微信公众号 AppID',
    desc: '用于自动发布文章到公众号',
    help: '获取方式：微信公众平台 → 开发 → 基本配置',
    required: true,
    validate: (val) => val.startsWith('wx') && val.length >= 10
  },
  {
    key: 'wechat_secret',
    name: '微信公众号 Secret',
    desc: '用于自动发布文章到公众号',
    help: '获取方式：微信公众平台 → 开发 → 基本配置',
    required: true,
    validate: (val) => val.length >= 10
  }
];

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
 * 获取用户配置的单个值（兼容接口）
 * @param {string} userId - 用户 ID
 * @param {string} key - 配置键名
 * @returns {string|undefined} 配置值
 */
function getUserConfig(userId, key) {
  const config = loadUserConfig(userId);
  return config[key];
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
 * 检查指定用户的配置是否完整
 * @param {string} userId - 用户 ID
 * @returns {Array} 缺失的配置项列表
 */
function checkMissingConfig(userId) {
  const config = loadUserConfig(userId);
  const missing = [];
  
  for (const field of CONFIG_FIELDS) {
    if (field.required && (!config[field.key] || !field.validate(config[field.key]))) {
      missing.push(field);
    }
  }
  
  return missing;
}

/**
 * 验证配置项是否有效
 * @param {string} key - 配置项 key
 * @param {string} value - 配置值
 * @returns {Object} { valid: boolean, error: string }
 */
function validateConfigField(key, value) {
  const field = CONFIG_FIELDS.find(f => f.key === key);
  if (!field) {
    return { valid: false, error: '未知配置项' };
  }
  
  if (!value || !value.trim()) {
    return { valid: false, error: `${field.name} 不能为空` };
  }
  
  if (field.validate && !field.validate(value.trim())) {
    return { valid: false, error: `${field.name} 格式不正确，请检查` };
  }
  
  return { valid: true, error: null };
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
 * 获取配置状态
 * @param {string} userId - 用户 ID
 * @returns {Object} 配置状态
 */
function getConfigStatus(userId) {
  const config = loadUserConfig(userId);
  const missing = checkMissingConfig(userId);
  
  return {
    isFirstTime: isFirstTime(userId),
    isComplete: missing.length === 0,
    missing: missing,
    config: config,
    totalFields: CONFIG_FIELDS.length,
    completedFields: CONFIG_FIELDS.filter(f => config[f.key] && f.validate(config[f.key])).length
  };
}

/**
 * 生成配置欢迎消息
 * @param {string} userId - 用户 ID
 * @returns {string} 欢迎消息
 */
function generateWelcomeMessage(userId) {
  const status = getConfigStatus(userId);
  
  let msg = `👋 欢迎使用**微信公众号自动化发布工具**！\n\n`;
  
  if (status.isFirstTime) {
    msg += `📝 **首次使用需要完成以下配置：**\n\n`;
  } else {
    msg += `⚠️ **您的配置不完整，请补充以下信息：**\n\n`;
  }
  
  CONFIG_FIELDS.forEach((field, index) => {
    const isMissing = status.missing.find(m => m.key === field.key);
    const icon = isMissing ? '❌' : '✅';
    msg += `${icon} **${index + 1}. ${field.name}**\n`;
    msg += `   ${field.desc}\n`;
    if (isMissing) {
      msg += `   💡 ${field.help}\n`;
    }
    msg += `\n`;
  });
  
  msg += `⏳ 进度：${status.completedFields}/${status.totalFields}\n\n`;
  msg += `🚀 **配置完成后您将可以：**\n`;
  msg += `• 输入主题自动搜索素材\n`;
  msg += `• AI 智能写作生成文章\n`;
  msg += `• 自动生成封面图\n`;
  msg += `• 一键发布到公众号草稿箱\n\n`;
  msg += `✏️ **让我们开始配置吧！**`;
  
  return msg;
}

/**
 * 强制完整配置引导
 * 循环询问直到所有必需项都填写完整
 * @param {string} userId - 用户 ID
 * @param {Function} sendMessage - 发送消息函数 async (text) => {}
 * @param {Function} waitForReply - 等待回复函数 async () => string
 * @returns {Promise<Object>} { success: boolean, config: Object, message: string }
 */
async function forceCompleteConfig(userId, sendMessage, waitForReply) {
  const config = loadUserConfig(userId);
  
  // 显示欢迎消息
  await sendMessage(generateWelcomeMessage(userId));
  
  // 循环询问每个缺失的配置项
  for (const field of CONFIG_FIELDS) {
    // 检查是否已有有效值
    if (config[field.key] && field.validate(config[field.key])) {
      continue;
    }
    
    let isValid = false;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (!isValid && attempts < maxAttempts) {
      attempts++;
      
      // 询问配置项
      let prompt = `\n📌 **请输入 ${field.name}**\n\n`;
      prompt += `${field.desc}\n\n`;
      prompt += `💡 ${field.help}\n\n`;
      prompt += `⚠️ 此项**必填**，无法跳过`;
      
      await sendMessage(prompt);
      
      // 等待用户输入
      const reply = await waitForReply();
      const value = reply ? reply.trim() : '';
      
      // 验证输入
      const validation = validateConfigField(field.key, value);
      
      if (validation.valid) {
        // 保存配置
        config[field.key] = value;
        saveUserConfig(userId, config);
        
        // 显示进度
        const status = getConfigStatus(userId);
        await sendMessage(`✅ **${field.name}** 已保存！\n\n📊 当前进度：${status.completedFields}/${status.totalFields}`);
        
        isValid = true;
      } else {
        await sendMessage(`❌ **输入错误**：${validation.error}\n\n请重新输入。`);
      }
    }
    
    if (!isValid) {
      return {
        success: false,
        config: config,
        message: `配置未完成：${field.name} 验证失败次数过多，请重新开始配置。`
      };
    }
  }
  
  // 配置完成
  const finalStatus = getConfigStatus(userId);
  
  if (finalStatus.isComplete) {
    await sendMessage(
      `🎉 **恭喜！配置全部完成！**\n\n` +
      `✅ Brave Search API Key\n` +
      `✅ 豆包 API Key\n` +
      `✅ 微信公众号 AppID\n` +
      `✅ 微信公众号 Secret\n\n` +
      `🚀 **现在您可以：**\n` +
      `发送 "帮我写一篇关于 XXX 的公众号文章" 开始创作！`
    );
    
    return {
      success: true,
      config: config,
      message: '配置完成'
    };
  }
  
  return {
    success: false,
    config: config,
    message: '配置未完成'
  };
}

/**
 * 检查是否可以使用功能
 * @param {string} userId - 用户 ID
 * @param {Function} sendMessage - 发送消息函数
 * @returns {Promise<boolean>} 是否可以使用
 */
async function checkCanUse(userId, sendMessage) {
  const status = getConfigStatus(userId);
  
  if (!status.isComplete) {
    const missingList = status.missing.map(m => m.name).join('、');
    await sendMessage(
      `⚠️ **无法使用：配置不完整**\n\n` +
      `缺少以下配置项：${missingList}\n\n` +
      `请发送 **/start** 或 **配置** 完成配置后再使用。`
    );
    return false;
  }
  
  return true;
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

// 导出 API
module.exports = {
  // 核心功能
  loadUserConfig,
  saveUserConfig,
  getUserConfig,
  checkMissingConfig,
  validateConfigField,
  isFirstTime,
  getConfigStatus,
  generateWelcomeMessage,
  forceCompleteConfig,
  checkCanUse,
  
  // 管理功能
  getAllUsers,
  deleteUserConfig,
  
  // 常量
  CONFIG_FIELDS,
  DEFAULT_CONFIG,
  CONFIG_DIR
};
