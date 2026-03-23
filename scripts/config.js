/**
 * 配置管理模块
 */
const fs = require('fs');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

const DEFAULT_CONFIG = {
  wechat_appid: '',
  wechat_secret: '',
  doubao_api_key: '',
  brave_api_key: ''
};

/**
 * 加载配置
 */
function loadConfig() {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return { ...DEFAULT_CONFIG };
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('加载配置失败:', error.message);
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * 保存配置
 */
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf8');
  } catch (error) {
    console.error('保存配置失败:', error.message);
  }
}

/**
 * 获取指定配置项
 */
function getConfig(key) {
  const config = loadConfig();
  return config[key];
}

/**
 * 设置指定配置项
 */
function setConfig(key, value) {
  const config = loadConfig();
  config[key] = value;
  saveConfig(config);
}

/**
 * 检查配置是否完整
 */
function checkConfig() {
  const config = loadConfig();
  const required = ['wechat_appid', 'wechat_secret', 'doubao_api_key', 'brave_api_key'];
  return required.filter(key => !config[key]);
}

/**
 * 检查并引导配置（供 Kimi 调用）
 * 返回 { ok: boolean, config: object, missing: array }
 */
function ensureConfig() {
  const missing = checkConfig();
  const config = loadConfig();
  
  if (missing.length === 0) {
    return { ok: true, config, missing: [] };
  }
  
  return { 
    ok: false, 
    config, 
    missing,
    message: `⚠️ 首次使用需要配置 API Key，缺少: ${missing.join(', ')}`
  };
}

/**
 * 交互式初始化配置（Node.js 环境使用）
 */
async function initConfigInteractive() {
  const readline = require('readline');
  
  console.log('📝 首次使用，请配置以下信息：\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) => new Promise(resolve => {
    rl.question(prompt, resolve);
  });

  try {
    const config = loadConfig();
    
    config.wechat_appid = (await question('微信公众号 AppID: ')).trim();
    config.wechat_secret = (await question('微信公众号 Secret: ')).trim();
    config.doubao_api_key = (await question('豆包 API Key: ')).trim();
    config.brave_api_key = (await question('Brave Search API Key: ')).trim();
    
    saveConfig(config);
    console.log('\n✅ 配置已保存！');
    return config;
  } catch (error) {
    console.error('配置失败:', error.message);
    throw error;
  } finally {
    rl.close();
  }
}

/**
 * 更新配置（单个或多个）
 */
function updateConfig(updates) {
  const config = loadConfig();
  Object.assign(config, updates);
  saveConfig(config);
  return config;
}

// 如果是直接运行此文件
if (require.main === module) {
  (async () => {
    const result = ensureConfig();
    if (!result.ok) {
      console.log(result.message);
      console.log('\n请提供以下配置信息：');
      
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const question = (prompt) => new Promise(resolve => {
        rl.question(prompt, resolve);
      });
      
      const updates = {};
      for (const key of result.missing) {
        const label = {
          wechat_appid: '微信公众号 AppID',
          wechat_secret: '微信公众号 Secret',
          doubao_api_key: '豆包 API Key',
          brave_api_key: 'Brave Search API Key'
        }[key];
        updates[key] = (await question(`${label}: `)).trim();
      }
      
      updateConfig(updates);
      console.log('\n✅ 配置已保存！');
      rl.close();
    } else {
      console.log('✅ 配置完整');
      console.log('\n当前配置：');
      const cfg = loadConfig();
      console.log(`  微信公众号 AppID: ${cfg.wechat_appid ? '***' + cfg.wechat_appid.slice(-4) : '未设置'}`);
      console.log(`  豆包 API Key: ${cfg.doubao_api_key ? '***' + cfg.doubao_api_key.slice(-4) : '未设置'}`);
      console.log(`  Brave API Key: ${cfg.brave_api_key ? '***' + cfg.brave_api_key.slice(-4) : '未设置'}`);
    }
  })();
}

module.exports = {
  loadConfig,
  saveConfig,
  getConfig,
  setConfig,
  checkConfig,
  ensureConfig,
  initConfigInteractive,
  updateConfig
};
