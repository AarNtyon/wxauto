---
name: wechat-mp-publisher
description: 微信公众号自动化发布工具。输入主题即可自动完成：素材搜索 → AI写作 → 封面生成 → 草稿箱发布。触发词："帮我写一篇公众号文章"、"发布公众号"、"创作公众号内容"。
---

# 微信公众号自动化发布 Skill

## 使用方式（AI 调用）

### 完整工作流（推荐）

当用户说"帮我写一篇关于 XXX 的公众号文章"时，AI 应该这样调用：

```javascript
const skill = require('/Users/an/code/wxauto');

// 1. 先检查用户是否已配置
const ready = skill.checkUserReady(userId);
if (!ready.canUse) {
  // 引导用户完成配置
  await say(`您需要完成配置才能使用，进度：${ready.progress}`);
  return;
}

// 2. 运行完整工作流
await skill.runWorkflow(userId, topic, {
  // 发送消息给用户
  sendMessage: async (msg) => await say(msg),
  
  // AI 生成文章内容（这是关键！AI 自己生成）
  askAI: async (prompt) => {
    // AI 使用 prompt 生成文章内容
    const response = await this.chat({
      messages: [
        { role: 'system', content: '你是专业公众号作者，直接输出 HTML 格式文章' },
        { role: 'user', content: prompt }
      ]
    });
    return response.content;
  },
  
  // 询问用户（配置阶段使用）
  askUser: async (question) => {
    await say(question);
    return await waitForUserReply();
  }
});
```

### 工作流程（6步）

AI 调用 `runWorkflow()` 后，会自动执行：

1. **检查配置** - 检查用户是否已完成 4 项配置
2. **搜索素材** - 使用 Brave Search 搜索相关素材
3. **AI 写作** - AI 根据提示词生成文章（调用 askAI）
4. **生成封面** - 使用豆包 API 生成封面图
5. **格式化** - 格式化为微信公众号 HTML
6. **发布草稿** - 发布到微信公众号草稿箱

### 重要：AI 写作步骤

第 3 步 "AI 写作" 是 AI **自己生成**文章，不是调用外部 API。

Skill 会提供 `prompt`，AI 需要：
1. 调用 `askAI(prompt)` - 实际上就是 AI 自己处理这个 prompt
2. 返回的文章内容会被解析并继续后续步骤

### 配置项

用户需要配置 4 个 API Key：

```
1. brave_api_key    - Brave Search API（搜索素材）
2. doubao_api_key   - 豆包 API（生成封面图）
3. wechat_appid     - 微信公众号 AppID
4. wechat_secret    - 微信公众号 Secret
```

首次使用会引导用户逐项配置。

## 示例代码

```javascript
// 处理用户请求
async function handleMessage(userId, text) {
  const skill = require('/Users/an/code/wxauto');
  
  // 检查用户是否就绪
  const ready = skill.checkUserReady(userId);
  if (!ready.canUse) {
    await say(`⚙️ 首次使用需要配置 API Key\n进度：${ready.progress}\n请回复 "/config" 开始配置`);
    return;
  }
  
  // 提取主题
  const topic = text.replace(/.*公众号|.*文章/, '').trim();
  if (!topic) {
    await say('请告诉我文章主题，例如：帮我写一篇关于 AI 的公众号文章');
    return;
  }
  
  // 运行完整工作流
  await say(`📝 开始创作：《${topic}》`);
  
  try {
    const result = await skill.runWorkflow(userId, topic, {
      sendMessage: async (msg) => await say(msg),
      askAI: async (prompt) => {
        // AI 自己生成文章内容
        const res = await this.chat({ messages: [{ role: 'user', content: prompt }] });
        return res.content;
      },
      askUser: async (q) => {
        await say(q);
        return await waitForReply();
      }
    });
    
    await say(`✅ 发布成功！Media ID: ${result.media_id}`);
    
  } catch (error) {
    await say(`❌ 失败：${error.message}`);
  }
}
```

## 底层 API（高级使用）

如需自定义流程，可使用底层函数：

```javascript
const skill = require('/Users/an/code/wxauto');

// 配置相关
skill.getConfigStatus(userId);        // 获取配置状态
skill.generateWelcomeMessage(userId); // 生成欢迎消息
skill.forceCompleteConfig(userId, sendMessageFn, waitForReplyFn); // 强制完成配置

// 搜索
skill.searchHybrid(userId, topic);    // 混合搜索

// 写作
skill.generateArticlePrompt(topic, searchResults); // 生成写作提示词
skill.parseArticleOutput(aiOutput);   // 解析 AI 输出

// 格式化
skill.formatToHtml(content, { title, lead, includeHeader: false });

// 封面
skill.generateCover(userId, title, style); // 生成封面图

// 发布
skill.publishDraft(userId, title, content, digest, coverUrl, author);
```

## 多租户说明

- 每个用户的配置完全隔离
- 配置存储在 `config/user_{userId}/config.json`
- `userId` 建议使用 `telegram_123456` 格式

## 依赖

- Node.js >= 16
- axios
- form-data

## 项目结构

```
wxauto/
├── index.js          # 主入口，导出 runWorkflow 等函数
├── scripts/
│   ├── config.js     # 多租户配置管理
│   ├── search.js     # 混合搜索
│   ├── writer.js     # AI 写作提示词生成
│   ├── formatter.js  # HTML 格式编排
│   ├── cover.js      # 封面生成
│   └── publisher.js  # 公众号发布
└── config/           # 用户配置目录（gitignore）
    └── user_{id}/
        └── config.json
```
