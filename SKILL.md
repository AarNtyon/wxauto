---
name: wechat-mp-publisher
description: 微信公众号自动化发布全流程工具（Node.js多租户版）。支持多用户隔离配置，从主题输入、素材搜索、AI写作、封面生成、格式编排到草稿箱发布的完整工作流。触发词："帮我写一篇公众号文章"、"发布公众号"、"创作公众号内容"。
---

# 微信公众号自动化发布 Skill（Node.js 多租户版）

## 特性

- **多租户支持**：每个用户（如 Telegram 用户）配置完全隔离
- **配置隔离**：按用户 ID 分目录存储配置文件
- **混合搜索**：AI 搜索 + Brave API
- **11维度写作**：基于内容洞见维度的 AI 写作
- **直接 HTML 输出**：AI 直接生成带样式的 HTML

---

## 多租户配置说明

每个用户的配置存储在独立的目录中：

```
config/
├── user_12345678/
│   └── config.json      # 用户 12345678 的配置
├── user_87654321/
│   └── config.json      # 用户 87654321 的配置
└── user_telegram_xxx/
    └── config.json      # Telegram 用户 xxx 的配置
```

---

## 执行流程

### Step 1: 获取用户标识

从 Telegram 等平台获取用户唯一标识：

```javascript
// 从 Telegram 消息中获取用户 ID
const userId = message.from.id;  // 如：12345678
// 或加上平台前缀
const userId = `telegram_${message.from.id}`;  // 如：telegram_12345678
```

### Step 2: 检查并引导配置

**首次使用配置引导：**

```javascript
const { 
  getUserConfigStatus, 
  interactiveConfig 
} = require('/Users/an/code/wxauto/scripts/config');

// 检查用户配置状态
const status = getUserConfigStatus(userId);

if (status.isFirstTime) {
  // 首次使用，显示欢迎消息并引导配置
  await sendMessage(generateConfigWelcome(userId));
  
  // 交互式配置
  const result = await interactiveConfig(
    userId,
    async (msg) => await sendMessage(msg),     // 发送消息
    async () => await waitForUserReply()        // 等待用户输入
  );
  
  if (!result.ok) {
    console.log(`用户 ${userId} 配置未完成`);
    return;
  }
}

console.log(`✅ 用户 ${userId} 配置完成`);
```

**配置引导流程：**

1. **首次使用**：显示欢迎消息，说明需要配置的 API Key
2. **逐个询问**：依次询问 Brave Key、豆包 Key、微信公众号（可选）
3. **保存确认**：每输入一个保存一个，显示确认消息
4. **完成提示**：配置完成后提示用户可以开始使用

### Step 3: 确认主题

询问用户文章主题。

### Step 4: 搜索素材（混合搜索）

```javascript
const { searchHybrid, formatSearchResults, optimizeSearchQuery } = require('/Users/an/code/wxauto/scripts/search');

// 优化搜索词
const optimizedQuery = optimizeSearchQuery(topic);

// AI 自带搜索
const aiResults = await searchWeb(optimizedQuery);

// 混合搜索（传入 userId）
const results = await searchHybrid(userId, optimizedQuery, aiResults, 5);
console.log(formatSearchResults(results));
```

### Step 5: AI 写作（直接输出 HTML）

```javascript
const { generateArticlePrompt, parseArticleOutput } = require('/Users/an/code/wxauto/scripts/writer');

// 生成提示词（要求 AI 直接输出 HTML）
const prompt = generateArticlePrompt(topic, results);

// 发送给 AI，AI 返回 HTML 格式正文
const article = parseArticleOutput(aiGeneratedText);
```

### Step 6: 生成封面

```javascript
const { formatStyleOptions, generateCover } = require('/Users/an/code/wxauto/scripts/cover');

console.log(formatStyleOptions());
const style = await askUser('请选择封面风格: ');

// 传入 userId
const coverUrl = await generateCover(userId, article.title, style);
```

### Step 7: 格式编排

AI 已直接输出 HTML，只需添加标题包装：

```javascript
const { formatToHtml } = require('/Users/an/code/wxauto/scripts/formatter');

const html = formatToHtml(article.content, {
  title: article.title,
  author: author,
  lead: article.digest
});
```

### Step 8: 发布

```javascript
const { publishDraft } = require('/Users/an/code/wxauto/scripts/publisher');

// 传入 userId
const result = await publishDraft(
  userId,
  article.title,
  html,
  article.digest,
  coverUrl,
  author
);

console.log(`✅ 发布成功！Media ID: ${result.media_id}`);
```

---

## 配置管理 API

```javascript
const { 
  loadUserConfig,      // 加载用户配置
  saveUserConfig,      // 保存用户配置
  getUserConfig,       // 获取配置项
  setUserConfig,       // 设置配置项
  checkUserConfig,     // 检查配置完整性
  ensureUserConfig,    // 确保配置完整（交互式）
  getAllUsers,         // 获取所有用户列表
  deleteUserConfig     // 删除用户配置
} = require('/Users/an/code/wxauto/scripts/config');
```

---

## 项目文件

```
wxauto/
├── config/                    # 用户配置目录（自动创建）
│   ├── user_12345678/
│   │   └── config.json
│   └── user_87654321/
│       └── config.json
├── .gitignore                 # 忽略 config/ 目录
├── index.js                   # 主入口
├── package.json
├── README.md
├── SKILL.md                   # 本文档
├── references/
│   ├── writing-style.md       # 11维度写作指南
│   └── wechat-api.md          # 微信 API 参考
└── scripts/
    ├── config.js              # 多租户配置管理
    ├── search.js              # 混合搜索
    ├── writer.js              # AI 写作
    ├── cover.js               # 封面生成
    ├── formatter.js           # HTML 格式编排
    └── publisher.js           # 公众号发布
```

---

## 安全说明

- 每个用户的配置完全隔离，存储在独立的目录中
- 用户 ID 会进行安全处理，防止路径遍历攻击
- 所有敏感信息（API Key）都存储在本地，不会上传到 GitHub
- `.gitignore` 已配置忽略 `config/` 目录

---

## 写作风格

本 Skill 使用 **"11个内容洞见维度"** 写作方法论：

1. **核心观点** - 一句话说清的锐利立场
2. **副观点** - 2-3个支撑性观点
3. **说服策略** - 数据/故事/权威/类比/社会认同
4. **情绪触发点** - 设计共鸣、紧迫、好奇等情绪
5. **金句** - 记忆锚点，可独立传播
6. **情感曲线** - 开头张力→中段交替→高潮→余韵
7. **情感层次** - 表层信息→中层态度→深层认同
8. **论证多样性** - 故事、数据、类比、反问等交替
9. **视角转化** - 第一/二/三人称灵活切换
10. **语言风格** - 亲切、口语化、张弛有度
11. **互动钩子** - 降低回复门槛的互动设计
