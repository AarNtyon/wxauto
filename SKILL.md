---
name: wechat-mp-publisher
description: 微信公众号自动化发布工具。输入主题即可自动完成：素材搜索 → AI写作 → 封面生成 → 草稿箱发布。触发词："帮我写一篇公众号文章"、"发布公众号"、"创作公众号内容"。
---

# 微信公众号自动化发布 Skill

## ⚠️ 重要：使用方式

**AI 必须且只能使用 `runWorkflow()` 函数，不要分步调用底层函数！**

### 路径说明

Skill 安装路径：`~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/skills/wechat-mp-publisher`

AI 引用时使用：**`require('./wechat-mp-publisher')`** 或根据环境使用绝对路径。

### 正确的使用方式

当用户说"帮我写一篇关于 XXX 的公众号文章"时：

```javascript
// 获取 skill 路径（根据安装位置调整）
const skillPath = '~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/skills/wechat-mp-publisher';
const skill = require(skillPath);

// 检查用户是否已配置（可选但推荐）
const ready = skill.checkUserReady(userId);
if (!ready.canUse) {
  // 运行工作流，内部会自动引导配置
  await skill.runWorkflow(userId, topic, callbacks);
  return;
}

// 运行完整工作流（内部自动执行全部6步）
await skill.runWorkflow(userId, topic, {
  sendMessage: async (msg) => await say(msg),
  askAI: async (prompt) => {
    // AI 自己生成文章内容
    const res = await this.chat({ messages: [{ role: 'user', content: prompt }] });
    return res.content;
  },
  askUser: async (q) => await waitForUserReply(q)
});
```

### 禁止这样做 ❌

```javascript
// 不要分步调用底层函数！
const skill = require(skillPath);

// ❌ 错误：AI 不应该这样调用
await skill.searchHybrid(userId, topic);      // 不要直接调用
await skill.generateCover(userId, title);     // 不要直接调用
await skill.publishDraft(userId, ...);        // 不要直接调用
```

## runWorkflow 内部流程

AI 调用 `runWorkflow()` 后，**内部自动按顺序执行**：

1. **检查配置** - 如未完成，自动引导用户配置
2. **搜索素材** - 使用 Brave Search 搜索相关素材
3. **AI 写作** - 调用 `askAI(prompt)` 让 AI 生成文章
4. **生成封面** - 自动使用 `creative` 风格生成封面
5. **格式化** - 格式化为微信公众号 HTML
6. **发布草稿** - 发布到微信公众号草稿箱

**AI 不需要干预任何步骤，只需提供 3 个回调函数！**

## 回调函数说明

### sendMessage(msg)
发送进度消息给用户。

```javascript
sendMessage: async (msg) => await say(msg)
```

### askAI(prompt)
**这是 AI 生成文章的地方！** Skill 提供提示词，AI 自己生成内容。

```javascript
askAI: async (prompt) => {
  // AI 使用提示词生成文章内容
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
仅在配置阶段询问用户 API Key，其他时候不需要。

```javascript
askUser: async (question) => {
  await say(question);
  return await waitForUserReply();
}
```

## 完整示例

```javascript
// 处理用户请求
async function handleMessage(userId, text) {
  const skillPath = '~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/skills/wechat-mp-publisher';
  const skill = require(skillPath);
  
  // 提取主题
  const topic = text.replace(/.*公众号|.*文章/, '').trim() || '热门话题';
  
  await say(`📝 开始创作：《${topic}》`);
  
  try {
    // 一行代码完成全部工作！
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

配置存储在 `config/user_{userId}/config.json`，多用户隔离。

## API 参考

### runWorkflow(userId, topic, callbacks)
运行完整工作流。

| 参数 | 类型 | 说明 |
|------|------|------|
| userId | string | 用户唯一标识，如 `telegram_123456` |
| topic | string | 文章主题 |
| callbacks | object | 包含 sendMessage, askAI, askUser |

### checkUserReady(userId)
检查用户是否已完成配置。

```javascript
const skillPath = '~/.local/share/uv/tools/kimi-cli/lib/python3.13/site-packages/kimi_cli/skills/wechat-mp-publisher';
const skill = require(skillPath);
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
├── scripts/
│   ├── config.js     # 配置管理
│   ├── search.js     # 混合搜索
│   ├── writer.js     # AI 写作提示词
│   ├── formatter.js  # HTML 格式化
│   ├── cover.js      # 封面生成
│   └── publisher.js  # 公众号发布
└── config/           # 用户配置目录
```

## 依赖

- Node.js >= 16
- axios
- form-data
