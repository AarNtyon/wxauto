# 微信公众号自动化发布 Skill

多租户微信公众号文章创作和发布工具，**强制完整配置**后才能使用。

## 特性

- 🔒 **强制完整配置**：所有必需 API Key 必须填写完整才能使用
- 👥 **多租户支持**：每个用户配置完全隔离
- 🔍 **混合搜索**：AI 搜索 + Brave API
- ✍️ **11维度写作**：基于内容洞见维度的 AI 写作
- 🎨 **自动封面**：豆包文生图生成封面
- 📤 **自动发布**：一键发布到公众号草稿箱

## 必需配置项

使用本工具前，必须配置以下 4 项：

| 配置项 | 用途 | 获取地址 |
|--------|------|----------|
| Brave Search API Key | 搜索文章素材 | https://brave.com/search/api/ |
| 豆包 API Key | 生成封面图 | https://www.volcengine.com/ |
| 微信公众号 AppID | 发布文章 | 微信公众平台 → 开发 → 基本配置 |
| 微信公众号 Secret | 发布文章 | 微信公众平台 → 开发 → 基本配置 |

**⚠️ 注意**：4 项配置全部填写正确后才能使用，缺一不可。

## 快速开始

### 1. 用户首次接入

```javascript
const { forceCompleteConfig, checkCanUse } = require('./scripts/config');

// 处理用户消息
async function handleMessage(userId, messageText, sendMessage, waitForReply) {
  // 检查是否可以使用
  const canUse = await checkCanUse(userId, sendMessage);
  
  if (!canUse) {
    // 强制完成配置
    const result = await forceCompleteConfig(
      userId,
      async (text) => await sendMessage(text),
      async () => {
        const reply = await waitForReply();
        return reply.text;
      }
    );
    
    if (!result.success) {
      return; // 配置未完成
    }
  }
  
  // 配置完成，可以继续使用功能
  // ...
}
```

### 2. 配置流程

用户发送 `/start` 或任意消息：

1. **显示欢迎消息** - 列出所有必需配置项
2. **逐个询问** - 循环询问直到全部填写
3. **验证输入** - 每个配置项都有格式验证
4. **保存进度** - 实时显示配置进度
5. **完成提示** - 全部完成后才能使用

### 3. 使用示例

```javascript
const { searchHybrid } = require('./scripts/search');
const { generateCover } = require('./scripts/cover');
const { publishDraft } = require('./scripts/publisher');

// 搜索素材
const results = await searchHybrid(userId, topic, aiResults, 5);

// 生成封面
const coverUrl = await generateCover(userId, title, 'creative');

// 发布文章
const result = await publishDraft(userId, title, html, digest, coverUrl);
```

## 项目结构

```
wxauto/
├── config/                    # 用户配置目录（自动创建）
│   ├── user_12345678/
│   │   └── config.json       # 用户独立配置
│   └── user_87654321/
│       └── config.json
├── .gitignore                 # 忽略 config/ 目录
├── index.js
├── package.json
├── README.md
├── SKILL.md
├── example.js                 # 使用示例
├── references/
│   ├── writing-style.md
│   └── wechat-api.md
└── scripts/
    ├── config.js              # 配置管理（强制完整配置）
    ├── search.js
    ├── writer.js
    ├── cover.js
    ├── formatter.js
    └── publisher.js
```

## 配置验证规则

- **Brave API Key**：长度 ≥ 10
- **豆包 API Key**：长度 ≥ 10
- **微信公众号 AppID**：必须以 `wx` 开头，长度 ≥ 10
- **微信公众号 Secret**：长度 ≥ 10

## 用户配置状态

```javascript
const { getConfigStatus } = require('./scripts/config');

const status = getConfigStatus(userId);
console.log(status);
// {
//   isFirstTime: true,
//   isComplete: false,
//   missing: [...],
//   completedFields: 2,
//   totalFields: 4
// }
```

## 安全说明

- 每个用户配置存储在独立的目录中
- 用户 ID 经过安全处理，防止路径遍历
- 所有敏感信息存储在本地，不上传到 GitHub
- `.gitignore` 已配置忽略 `config/` 目录

## License

MIT
