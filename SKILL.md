---
name: wechat-mp-publisher
description: 微信公众号自动化发布全流程工具（Node.js版）。支持从主题输入、素材搜索、AI写作、封面生成、格式编排到草稿箱发布的完整工作流。必须使用完整模式，配置API Key后全自动运行。触发词："帮我写一篇公众号文章"、"发布公众号"、"创作公众号内容"、"公众号文章"、"写公众号"。
---

# 微信公众号自动化发布 Skill（Node.js 版）

## ⚠️ 要求

**本 Skill 必须使用完整模式运行，需要配置 API Key。**

当用户触发时，如果缺少配置，必须引导用户输入配置信息，**不提供降级模式选项**。

---

## 执行流程

当用户说出触发词时，按以下步骤执行：

---

### Step 1: 检测 Node.js 环境

```bash
cd /Users/an/code/wxauto && node --version
```

**如果 Node.js 不存在**：
- 引导用户安装 Node.js
- 或使用其他方式协助用户完成

**如果 Node.js 存在**：继续 Step 2

---

### Step 2: 检查并引导配置（⚠️ 必须完成）

**此步骤必须执行，配置不完整不能继续！**

```javascript
const { ensureConfig, updateConfig } = require('/Users/an/code/wxauto/scripts/config');

const result = ensureConfig();

if (!result.ok) {
  console.log('⚠️ 首次使用需要配置 API Key');
  console.log(`缺少: ${result.missing.join(', ')}`);
  console.log('\n这些 API Key 用于自动搜索素材、生成封面和发布文章。\n');
  console.log('请提供以下配置信息（没有可以跳过，但对应功能将不可用）：\n');
  
  const updates = {};
  
  if (result.missing.includes('brave_api_key')) {
    updates.brave_api_key = await askUser('Brave Search API Key (用于搜索素材): ');
    console.log('💡 获取方式：https://brave.com/search/api/\n');
  }
  
  if (result.missing.includes('doubao_api_key')) {
    updates.doubao_api_key = await askUser('豆包 API Key (用于生成封面): ');
    console.log('💡 获取方式：https://www.volcengine.com/ → 豆包大模型\n');
  }
  
  if (result.missing.includes('wechat_appid')) {
    updates.wechat_appid = await askUser('微信公众号 AppID (用于自动发布，可选): ');
  }
  
  if (result.missing.includes('wechat_secret')) {
    updates.wechat_secret = await askUser('微信公众号 Secret (用于自动发布，可选): ');
    console.log('💡 获取方式：微信公众平台 → 开发 → 基本配置\n');
  }
  
  // 保存配置
  updateConfig(updates);
  console.log('\n✅ 配置已保存！');
}
```

**注意**：
- `brave_api_key` 和 `doubao_api_key` 建议配置，用于搜索和封面生成
- `wechat_appid` 和 `wechat_secret` 可选，不配置则最后一步改为手动发布指引

---

### Step 3: 确认主题

询问或确认用户的文章主题。

---

### Step 4: 搜索素材（混合搜索）

**使用混合搜索策略：AI 自带搜索 + Brave API**

```javascript
const { searchHybrid, formatSearchResults, optimizeSearchQuery } = require('/Users/an/code/wxauto/scripts/search');

// 1. 优化搜索词（添加时间限定，获取最新信息）
const optimizedQuery = optimizeSearchQuery(topic);
console.log('优化后的搜索词:', optimizedQuery);

// 2. AI 自带搜索（由 Kimi 执行 SearchWeb）
const aiResults = await searchWeb(optimizedQuery);  // Kimi 的 SearchWeb 工具

// 3. 混合搜索（AI 结果 + Brave API）
const results = await searchHybrid(optimizedQuery, aiResults, 5);
console.log(formatSearchResults(results));
```

**混合搜索优势**：
- 🤖 **AI 搜索**：理解语义，结果更相关
- 🔎 **Brave 搜索**：实时性强，覆盖面广
- 🎯 **智能合并**：去重排序，取两者之长

**展示给用户并等待确认** ✅/🔄/⏭️

---

### Step 5: AI 写作（直接输出 HTML）

```javascript
const { generateArticlePrompt, parseArticleOutput, extractGoldenSentences } = require('/Users/an/code/wxauto/scripts/writer');

// 生成写作提示词（基于11个内容洞见维度）
// 提示词要求 AI 直接输出 HTML，不使用 Markdown
const prompt = generateArticlePrompt(topic, results);

// 将 prompt 发送给 AI 生成文章
// AI 直接返回 HTML 格式的正文（段落使用 <p> 标签，标题使用 <h2> 等）
// article = parseArticleOutput(aiGeneratedText);

// 展示文章给用户
console.log(`标题: ${article.title}`);
console.log(`摘要: ${article.digest}`);
console.log(`正文:\n${article.content}`);  // 已经是 HTML 格式
console.log(`互动钩子: ${article.interactionHook}`);
```

**AI 输出格式说明**：
- AI 直接输出 **HTML**（不是 Markdown）
- 段落使用 `<p>` 标签，带统一样式
- 标题使用 `<h2>` 标签，带红色左边框
- 金句使用 `<strong style="color: #d9230f;">` 红色强调
- 引用使用 `<blockquote>` 标签

**展示文章给用户确认** ✅/🔄/⏭️

---

### Step 6: 生成封面

```javascript
const { formatStyleOptions, generateCover } = require('/Users/an/code/wxauto/scripts/cover');

// 如果配置了 doubao_api_key
try {
  console.log(formatStyleOptions());
  const style = await askUser('请选择封面风格: ');
  const coverUrl = await generateCover(article.title, style);
  console.log(`封面已生成: ${coverUrl}`);
} catch (error) {
  console.log('封面生成失败:', error.message);
  console.log('将提供封面提示词供手动生成...');
  // 生成提示词供用户使用
}
```

**展示封面给用户确认** ✅/🔄/⏭️

---

### Step 7: 格式编排（包装 HTML）

由于 AI 已经直接输出了带样式的 HTML，这一步主要是添加标题、作者等包装信息。

```javascript
const { formatToHtml, WechatFormatter } = require('/Users/an/code/wxauto/scripts/formatter');

// AI 已经输出了 HTML 格式的正文，只需添加标题和作者包装
const html = formatToHtml(article.content, {
  title: article.title,    // 文章标题
  author: author,          // 作者（可选）
  lead: article.digest     // 导语/摘要（可选）
});

console.log('HTML 预览:');
console.log(html.substring(0, 800) + '...');
```

**展示 HTML 给用户确认** ✅/🔄/⏭️

**排版规范（已内联在 AI 输出的 HTML 中）**：

| 元素 | 样式 |
|------|------|
| 段落 | 17px, 2.0 行高, 0.5px 字间距, #3f3f3f |
| H2 标题 | 18px, 左边红色边框 (#d9230f) |
| H3 标题 | 16px, 粗体 |
| 强调 | 红色 #d9230f |
| 引用 | 灰色背景 #f8f9fa |

---

### Step 8: 发布

**如果配置了微信公众号 AppID 和 Secret：**

```javascript
const { publishDraft } = require('/Users/an/code/wxauto/scripts/publisher');

try {
  const mediaId = await publishDraft(
    article.title, 
    html, 
    article.digest, 
    coverUrl
  );
  console.log(`✅ 发布成功！Media ID: ${mediaId}`);
} catch (error) {
  console.log('自动发布失败:', error.message);
  console.log('请手动复制文章内容到公众号...');
}
```

**如果没有配置微信公众号：**

提供手动发布步骤：
1. 登录 https://mp.weixin.qq.com/
2. 内容与互动 → 草稿箱 → 写新图文
3. 粘贴标题、摘要、正文
4. 上传封面图
5. 保存为草稿

---

## 配置说明

配置文件位置：`/Users/an/code/wxauto/config.json`

```json
{
  "brave_api_key": "...",
  "doubao_api_key": "...",
  "wechat_appid": "...",
  "wechat_secret": "..."
}
```

### 获取方式

| 配置项 | 用途 | 获取地址 |
|--------|------|----------|
| brave_api_key | 搜索素材 | https://brave.com/search/api/ |
| doubao_api_key | 生成封面 | https://www.volcengine.com/ → 豆包大模型 |
| wechat_appid | 自动发布 | 微信公众平台 → 开发 → 基本配置 |
| wechat_secret | 自动发布 | 微信公众平台 → 开发 → 基本配置 |

---

## 用户交互选项

每个步骤完成后，给用户选项：
- ✅ **确认并继续** - 进入下一步
- 🔄 **重新生成** - 当前步骤重做
- ⏭️ **跳过** - 使用默认或跳过此步
- ❌ **终止** - 结束整个流程

---

## 项目文件

```
/Users/an/code/wxauto/
├── package.json              # Node.js 项目配置
├── index.js                  # 主入口
├── test.js                   # 测试脚本
├── config.json               # 配置文件（使用后生成）
├── config.json.example       # 配置示例
├── SKILL.md                  # 本文档
├── README.md                 # 项目说明
├── references/
│   ├── writing-style.md      # 11个内容洞见维度写作指南
│   └── wechat-api.md         # 微信公众号 API 参考
└── scripts/
    ├── config.js             # 配置管理
    ├── search.js             # Brave 搜索
    ├── writer.js             # AI 写作（11维度）
    ├── cover.js              # 豆包封面生成
    ├── formatter.js          # 格式编排
    └── publisher.js          # 公众号发布
```

---

## 依赖安装

```bash
cd /Users/an/code/wxauto
npm install
```

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
