---
name: wechat-mp-publisher
description: 微信公众号自动化发布工具。输入主题即可自动完成：素材搜索 → AI写作 → 封面生成 → 草稿箱发布。触发词："帮我写一篇公众号文章"、"发布公众号"、"创作公众号内容"。
---

# 微信公众号自动化发布 Skill

## 🚨 极其重要：必须使用 runWorkflow

**AI 你必须且只能调用 `runWorkflow()` 这一个函数！**

**不要**读 search.js、writer.js、cover.js、publisher.js 等文件然后自己分步执行！

**如果你分步调用底层函数，流程会中断，用户收不到最终文章！**

### 正确的调用方式（仅此一种）

```javascript
// ✅ 正确：一行代码完成全部工作
const skill = require('/Users/an/code/wxauto');

await skill.runWorkflow(userId, topic, {
  sendMessage: async (msg) => await say(msg),
  askAI: async (prompt) => {
    const res = await this.chat({ messages: [{ role: 'user', content: prompt }] });
    return res.content;
  },
  askUser: async (q) => await waitForUserReply(q)
});
```

### 错误的调用方式（会导致流程中断）

```javascript
// ❌ 错误：不要这样做！
const skill = require('/Users/an/code/wxauto');

// 不要单独调用这些函数！
const results = await skill.searchHybrid(userId, topic);        // ❌ 错误
const prompt = skill.generateArticlePrompt(topic, results);     // ❌ 错误
const cover = await skill.generateCover(userId, title);         // ❌ 错误
await skill.publishDraft(userId, ...);                          // ❌ 错误
```

**为什么这样做是错误的：**
- 你替 `runWorkflow` 做了部分工作，但后续步骤不会自动执行
- 封面生成和发布步骤会被跳过
- 用户只会看到文章预览，收不到草稿箱链接
- 整个流程在你这里中断，无法完成

## runWorkflow 内部流程（全自动，你不需要干预）

`runWorkflow` 会自动按顺序执行以下步骤，你只需提供 3 个回调：

1. **检查配置** - 自动完成
2. **搜索素材** - 自动完成  
3. **AI 写作** - 调用你的 `askAI` 回调生成文章
4. **生成封面** - 自动完成
5. **格式化** - 自动完成
6. **发布草稿** - 自动完成

## 回调函数说明

### sendMessage(msg)
发送进度消息给用户。

```javascript
sendMessage: async (msg) => await say(msg)
```

### askAI(prompt)
**这是你生成文章的地方。** Skill 提供提示词，你生成内容。

```javascript
askAI: async (prompt) => {
  const response = await this.chat({
    messages: [
      { role: 'system', content: '你是专业公众号作者，输出 HTML 格式' },
      { role: 'user', content: prompt }
    ]
  });
  return response.content;
}
```

### askUser(question)
仅在配置阶段询问用户 API Key。

```javascript
askUser: async (question) => {
  await say(question);
  return await waitForUserReply();
}
```

## 完整示例（AI 应该这样写代码）

```javascript
// 处理用户请求
async function handleMessage(userId, text) {
  const skill = require('/Users/an/code/wxauto');
  
  // 提取主题
  const topic = text.replace(/.*公众号|.*文章/, '').trim() || '热门话题';
  
  await say(`📝 开始创作：《${topic}》`);
  
  try {
    // 就这一行！全自动完成从搜索到发布的全部工作
    const result = await skill.runWorkflow(userId, topic, {
      sendMessage: async (msg) => await say(msg),
      askAI: async (prompt) => {
        const res = await this.chat({ messages: [{ role: 'user', content: prompt }] });
        return res.content;
      },
      askUser: async (q) => {
        await say(q);
        return await waitForUserReply();
      }
    });
    
    await say(`🎉 发布成功！请登录微信公众平台查看草稿箱`);
    
  } catch (error) {
    await say(`❌ 失败：${error.message}`);
  }
}
```

## 用户配置

首次使用需要配置 4 个 API Key，`runWorkflow` 会自动引导：

1. **brave_api_key** - Brave Search API（搜索素材）
2. **doubao_api_key** - 豆包 API（生成封面图）
3. **wechat_appid** - 微信公众号 AppID
4. **wechat_secret** - 微信公众号 Secret

## API 参考

### runWorkflow(userId, topic, callbacks)
运行完整工作流。

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户唯一标识，如 `telegram_123456` |
| topic | string | 文章主题 |
| callbacks | object | { sendMessage, askAI, askUser } |

### checkUserReady(userId)
检查用户是否已完成配置。

```javascript
const skill = require('/Users/an/code/wxauto');
const ready = skill.checkUserReady(userId);
// ready.canUse: boolean
// ready.progress: "3/4"
// ready.missing: ["豆包 API Key"]
```

## 项目结构

```
wechat-mp-publisher/
├── index.js          # 主入口，导出 runWorkflow
├── SKILL.md          # 本文档
├── scripts/          # 核心功能模块（由 runWorkflow 调用，你不要直接调用）
└── config/           # 用户配置目录
```

## 依赖

- Node.js >= 16
- axios
- form-data
