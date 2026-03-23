# 微信公众号自动化发布 Skill

一个完整的微信公众号文章创作和发布工具（Node.js 版），**统一使用完整模式运行**。

---

## 🚀 快速开始

### 1. 安装 Node.js

**macOS:**
```bash
brew install node
```

**Windows:**
从 https://nodejs.org 下载安装

**Linux:**
```bash
sudo apt install nodejs npm
```

### 2. 安装依赖

```bash
cd /Users/an/code/wxauto
npm install
```

### 3. 配置 API Key

首次运行时，Kimi 会引导你输入 API Key。

或者手动配置：
```bash
cp config.json.example config.json
# 编辑 config.json 填入你的 API Key
```

需要配置的 API Key：
- **brave_api_key** - 用于搜索素材（推荐）
- **doubao_api_key** - 用于生成封面（推荐）
- **wechat_appid** - 用于自动发布（可选）
- **wechat_secret** - 用于自动发布（可选）

### 4. 使用

对 Kimi 说：
```
帮我写一篇关于 AI 的公众号文章
```

---

## 📊 功能特性

| 功能 | 状态 | 说明 |
|------|------|------|
| 素材搜索 | ✅ | Brave Search API |
| AI 写作 | ✅ | 基于 11 内容洞见维度 |
| 封面生成 | ✅ | 豆包文生图 API |
| 格式编排 | ✅ | Markdown → HTML |
| 自动发布 | ✅ | 微信公众号 API（可选）|

---

## 🎯 触发词

- "帮我写一篇公众号文章"
- "发布公众号"
- "创作公众号内容"
- "公众号文章"
- "写公众号"

---

## 📝 工作流程

1. **检查配置** → 引导输入 API Key（如果缺失）
2. **确认主题** → 确认文章主题
3. **搜索素材** → Brave Search 获取相关资料
4. **AI 写作** → 基于 11 维度生成文章
5. **生成封面** → 豆包 API 生成封面图
6. **格式编排** → 转换为公众号 HTML
7. **发布** → 自动发布或提供手动步骤

---

## ✨ 写作风格

使用 **"11个内容洞见维度"** 写作方法论：

1. **核心观点** - 一句话说清的锐利立场
2. **副观点** - 2-3个支撑性观点
3. **说服策略** - 数据/故事/权威/类比/社会认同
4. **情绪触发点** - 共鸣/紧迫/好奇/优越/恐惧/归属
5. **金句** - 记忆锚点，可独立传播
6. **情感曲线** - 开头张力→中段交替→高潮→余韵
7. **情感层次** - 表层信息→中层态度→深层认同
8. **论证多样性** - 故事、数据、类比、反问等交替
9. **视角转化** - 第一/二/三人称灵活切换
10. **语言风格** - 亲切、口语化、张弛有度
11. **互动钩子** - 降低回复门槛的互动设计

---

## 📁 文件结构

```
wechat-mp-publisher/
├── package.json              # Node.js 项目配置
├── index.js                  # 主入口
├── test.js                   # 测试脚本
├── config.json               # 配置文件
├── config.json.example       # 配置示例
├── SKILL.md                  # Skill 主文档
├── README.md                 # 本文件
├── references/
│   ├── writing-style.md      # 11维度写作指南
│   └── wechat-api.md         # 微信 API 参考
└── scripts/
    ├── config.js             # 配置管理
    ├── search.js             # Brave 搜索
    ├── writer.js             # AI 写作
    ├── cover.js              # 豆包封面生成
    ├── formatter.js          # 格式编排
    └── publisher.js          # 公众号发布
```

---

## 🔧 配置说明

### 获取 API Key

| 配置项 | 用途 | 获取地址 |
|--------|------|----------|
| brave_api_key | 搜索素材 | https://brave.com/search/api/ |
| doubao_api_key | 生成封面 | https://www.volcengine.com/ → 豆包大模型 |
| wechat_appid | 自动发布 | 微信公众平台 → 开发 → 基本配置 |
| wechat_secret | 自动发布 | 微信公众平台 → 开发 → 基本配置 |

### 配置文件示例

```json
{
  "brave_api_key": "你的_brave_key",
  "doubao_api_key": "你的_doubao_key",
  "wechat_appid": "你的_appid",
  "wechat_secret": "你的_secret"
}
```

---

## 🧪 测试

```bash
npm test
```

---

## 📄 License

MIT
