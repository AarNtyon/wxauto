---
name: wechat-mp-publisher
description: 微信公众号自动化发布工具。输入主题即可自动完成：素材搜索 → AI写作 → 封面生成 → 草稿箱发布。触发词：「帮我写一篇公众号文章」「发布公众号」「创作公众号内容」。
---

# 微信公众号自动化发布 Skill

## ⛔ 唯一正确做法：调用 `runWorkflow`

```javascript
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

> **重要**：`require('/Users/an/code/wxauto')` 只暴露 `runWorkflow` 和 `checkUserReady` 两个函数。不存在其他可调用的函数，不要试图分步调用。

---

## `runWorkflow` 自动完成的 6 个步骤

| 步骤 | 说明 |
|------|------|
| 1 检查配置 | 自动检测，不完整则引导用户填写 4 个 API Key |
| 2 搜索素材 | Brave API 自动搜索相关素材 |
| 3 AI 写作 | **调用你的 `askAI` 回调**，传入 prompt，你返回文章内容 |
| 4 生成封面 | 豆包 API 自动生成封面图 |
| 5 格式化 | 自动转换为微信公众号 HTML |
| 6 发布草稿 | 自动发布到微信公众号草稿箱 |

你只需要提供 3 个回调函数，其余全部自动完成。

---

## `askAI` 回调的关键要求

`runWorkflow` 调用 `askAI(prompt)` 时，**你必须让 AI 严格按以下 XML 格式输出**：

```xml
<title>文章标题</title>
<digest>一句话摘要，50字以内</digest>
<content>
[直接输出 HTML，section > p 结构，全内联样式]
</content>
<hook>引导评论的话术</hook>
```

在调用 `askAI` 时，建议在 system prompt 中强调：
```
你是专业公众号作者，必须严格按照 XML 标签格式输出，不要添加任何 XML 标签之外的内容。
```

---

## 回调函数说明

### `sendMessage(msg)` — 发送进度给用户
```javascript
sendMessage: async (msg) => await say(msg)
```

### `askAI(prompt)` — 你生成文章的地方
```javascript
askAI: async (prompt) => {
  const res = await this.chat({
    messages: [
      { role: 'system', content: '你是专业公众号作者，必须严格按照 XML 标签格式输出' },
      { role: 'user', content: prompt }
    ]
  });
  return res.content;
}
```

### `askUser(question)` — 仅配置阶段使用
```javascript
askUser: async (q) => await waitForUserReply(q)
```

---

## 用户配置（首次使用自动引导）

| Key | 用途 |
|-----|------|
| `brave_api_key` | Brave Search（搜索素材）|
| `doubao_api_key` | 豆包 API（生成封面图）|
| `wechat_appid` | 微信公众号 AppID |
| `wechat_secret` | 微信公众号 Secret |

---

## 检查用户是否就绪

```javascript
const skill = require('/Users/an/code/wxauto');
const ready = skill.checkUserReady(userId);
// { canUse: boolean, progress: "3/4", missing: ["豆包 API Key"] }
```

---

## 依赖
- Node.js >= 16
- axios
- form-data
