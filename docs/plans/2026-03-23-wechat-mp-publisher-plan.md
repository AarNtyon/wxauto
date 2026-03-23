# 微信公众号自动化发布 Skill 实施计划

> **For Kimi:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 创建一个完整的微信公众号自动化发布 skill，支持从主题输入到草稿箱发布的全流程，采用分步确认模式。

**Architecture:** 使用模块化设计，每个功能（搜索、写作、封面、编排、发布）独立成模块，通过 SKILL.md 统一调度和协调。配置存储在 JSON 文件中，各模块通过标准接口交互。

**Tech Stack:** Python 3.8+, requests, Brave Search API, 豆包 API, 微信公众号 API

---

## 前置检查

- [ ] 确认 `/Users/an/.config/agents/skills/` 目录存在且有写入权限
- [ ] 确认 Python 3.8+ 已安装

---

## Task 1: 创建 Skill 目录结构

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/`
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/`
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/references/`

**Step 1: 创建目录结构**

```bash
mkdir -p /Users/an/.config/agents/skills/wechat-mp-publisher/{scripts,references}
ls -la /Users/an/.config/agents/skills/wechat-mp-publisher/
```

**Expected:** 目录创建成功，包含 scripts 和 references 子目录

---

## Task 2: 创建微信公众号 API 参考文档

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/references/wechat-api.md`

**Step 1: 写入 API 参考文档**

```markdown
---
name: wechat-api-reference
description: 微信公众号 API 接口参考文档
---

# 微信公众号 API 参考

## 获取 Access Token

```http
GET https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid={appid}&secret={secret}
```

响应：
```json
{
  "access_token": "ACCESS_TOKEN",
  "expires_in": 7200
}
```

## 上传图片素材

```http
POST https://api.weixin.qq.com/cgi-bin/media/uploadimg?access_token={access_token}
Content-Type: multipart/form-data
```

## 新增草稿

```http
POST https://api.weixin.qq.com/cgi-bin/draft/add?access_token={access_token}
Content-Type: application/json

{
  "articles": [
    {
      "title": "TITLE",
      "content": "CONTENT",
      "thumb_media_id": "THUMB_MEDIA_ID",
      "author": "AUTHOR",
      "digest": "DIGEST",
      "content_source_url": "CONTENT_SOURCE_URL"
    }
  ]
}
```

响应：
```json
{
  "media_id": "MEDIA_ID"
}
```
```

**Step 2: 验证文件创建**

```bash
cat /Users/an/.config/agents/skills/wechat-mp-publisher/references/wechat-api.md
```

**Expected:** 文件内容正确显示

---

## Task 3: 创建配置模块

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/config.py`

**Step 1: 编写配置模块**

```python
"""配置管理模块"""
import json
import os
from pathlib import Path

CONFIG_FILE = Path(__file__).parent.parent / "config.json"

DEFAULT_CONFIG = {
    "wechat_appid": "",
    "wechat_secret": "",
    "doubao_api_key": "",
    "brave_api_key": ""
}


def load_config():
    """加载配置"""
    if not CONFIG_FILE.exists():
        return DEFAULT_CONFIG.copy()
    with open(CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_config(config):
    """保存配置"""
    with open(CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)


def get_config(key):
    """获取指定配置项"""
    config = load_config()
    return config.get(key)


def set_config(key, value):
    """设置指定配置项"""
    config = load_config()
    config[key] = value
    save_config(config)


def check_config():
    """检查配置是否完整"""
    config = load_config()
    missing = []
    for key in ["wechat_appid", "wechat_secret", "doubao_api_key", "brave_api_key"]:
        if not config.get(key):
            missing.append(key)
    return missing


def init_config_interactive():
    """交互式初始化配置"""
    print("📝 首次使用，请配置以下信息：\n")
    config = load_config()
    
    config["wechat_appid"] = input("微信公众号 AppID: ").strip()
    config["wechat_secret"] = input("微信公众号 Secret: ").strip()
    config["doubao_api_key"] = input("豆包 API Key: ").strip()
    config["brave_api_key"] = input("Brave Search API Key: ").strip()
    
    save_config(config)
    print("\n✅ 配置已保存！")
    return config
```

**Step 2: 验证配置模块**

```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && python -c "
from scripts.config import load_config, save_config, check_config
config = load_config()
print('Default config:', config)
missing = check_config()
print('Missing keys:', missing)
"
```

**Expected:** 输出默认配置和缺失的 keys 列表

---

## Task 4: 创建搜索模块

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/search.py`

**Step 1: 编写搜索模块**

```python
"""Brave Search 模块"""
import requests
from .config import get_config

BRAVE_API_URL = "https://api.search.brave.com/res/v1/web/search"


def search_topic(topic, count=5):
    """
    搜索主题相关素材
    
    Args:
        topic: 搜索主题
        count: 返回结果数量
    
    Returns:
        list: 搜索结果列表，每项包含 title, description, url
    """
    api_key = get_config("brave_api_key")
    if not api_key:
        raise ValueError("Brave API Key 未配置")
    
    headers = {
        "Accept": "application/json",
        "X-Subscription-Token": api_key
    }
    
    params = {
        "q": topic,
        "count": count,
        "offset": 0,
        "mkt": "zh-CN"
    }
    
    response = requests.get(BRAVE_API_URL, headers=headers, params=params, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    results = []
    
    for item in data.get("web", {}).get("results", []):
        results.append({
            "title": item.get("title", ""),
            "description": item.get("description", ""),
            "url": item.get("url", "")
        })
    
    return results


def format_search_results(results):
    """格式化搜索结果用于展示"""
    if not results:
        return "未找到相关素材"
    
    lines = ["🔍 搜索结果：\n"]
    for i, r in enumerate(results, 1):
        lines.append(f"{i}. **{r['title']}**")
        lines.append(f"   {r['description'][:100]}...")
        lines.append(f"   链接: {r['url']}\n")
    
    return "\n".join(lines)
```

**Step 2: 语法检查**

```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && python -m py_compile scripts/search.py && echo "Syntax OK"
```

**Expected:** 输出 "Syntax OK"

---

## Task 5: 创建写作模块

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/writer.py`

**Step 1: 编写写作模块**

```python
"""AI 写作模块 - 生成公众号文章"""


def generate_article_prompt(topic, search_results):
    """
    生成写作提示词
    
    Args:
        topic: 文章主题
        search_results: 搜索结果列表
    
    Returns:
        str: 完整的写作提示词
    """
    search_context = "\n".join([
        f"- {r['title']}: {r['description'][:200]}"
        for r in search_results[:3]
    ])
    
    prompt = f"""请为一篇微信公众号文章撰写内容。

主题：{topic}

参考素材：
{search_context}

要求：
1. 标题吸引人，简洁有力
2. 正文结构清晰，有小标题
3. 语言风格符合公众号调性：亲切、易读、有价值
4. 开头吸引人，结尾有总结或互动
5. 字数控制在 800-1500 字

请按以下格式输出：
标题：[文章标题]

摘要：[一句话摘要，50字以内]

正文：
[正文内容，使用 Markdown 格式]
"""
    return prompt


def parse_article_output(output):
    """
    解析 AI 生成的文章内容
    
    Args:
        output: AI 返回的原始文本
    
    Returns:
        dict: 包含 title, digest, content
    """
    lines = output.strip().split("\n")
    
    title = ""
    digest = ""
    content_lines = []
    in_content = False
    
    for line in lines:
        if line.startswith("标题：") or line.startswith("标题:"):
            title = line.split("：", 1)[1].strip() if "：" in line else line.split(":", 1)[1].strip()
        elif line.startswith("摘要：") or line.startswith("摘要:"):
            digest = line.split("：", 1)[1].strip() if "：" in line else line.split(":", 1)[1].strip()
        elif line.startswith("正文：") or line.startswith("正文:"):
            in_content = True
        elif in_content:
            content_lines.append(line)
    
    content = "\n".join(content_lines).strip()
    
    return {
        "title": title,
        "digest": digest,
        "content": content
    }
```

**Step 2: 语法检查**

```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && python -m py_compile scripts/writer.py && echo "Syntax OK"
```

**Expected:** 输出 "Syntax OK"

---

## Task 6: 创建封面生成模块

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/cover.py`

**Step 1: 编写封面生成模块**

```python
"""封面图片生成模块 - 调用豆包 API"""
import requests
from .config import get_config

DOUBAO_API_URL = "https://ark.cn-beijing.volces.com/api/v3/images/generations"

COVER_STYLES = {
    "realistic": "写实风格，真实照片质感",
    "illustration": "插画风格，色彩丰富",
    "minimal": "极简风格，扁平化设计",
    "creative": "创意设计，富有想象力"
}


def generate_cover_prompt(title, style="creative"):
    """
    生成封面图片提示词
    
    Args:
        title: 文章标题
        style: 风格类型
    
    Returns:
        str: 图片生成提示词
    """
    style_desc = COVER_STYLES.get(style, COVER_STYLES["creative"])
    
    prompt = f"""为一篇微信公众号文章生成封面图。

文章主题：{title}
风格要求：{style_desc}

要求：
- 画面简洁，主题突出
- 适合作为文章首图（横版 900x383）
- 视觉吸引力强，能引起点击欲望
- 不要有文字
"""
    return prompt


def generate_cover(title, style="creative"):
    """
    生成封面图片
    
    Args:
        title: 文章标题
        style: 风格类型
    
    Returns:
        str: 生成的图片 URL
    """
    api_key = get_config("doubao_api_key")
    if not api_key:
        raise ValueError("豆包 API Key 未配置")
    
    prompt = generate_cover_prompt(title, style)
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "doubao-image",
        "prompt": prompt,
        "size": "1024x576"  # 接近 900x383 的比例
    }
    
    response = requests.post(DOUBAO_API_URL, headers=headers, json=data, timeout=60)
    response.raise_for_status()
    
    result = response.json()
    
    # 豆包 API 返回格式可能不同，根据实际情况调整
    if "data" in result and len(result["data"]) > 0:
        return result["data"][0].get("url", "")
    
    raise RuntimeError(f"封面生成失败: {result}")


def format_style_options():
    """格式化风格选项用于展示"""
    lines = ["🎨 请选择封面风格：\n"]
    for key, desc in COVER_STYLES.items():
        lines.append(f"- `{key}`: {desc}")
    return "\n".join(lines)
```

**Step 2: 语法检查**

```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && python -m py_compile scripts/cover.py && echo "Syntax OK"
```

**Expected:** 输出 "Syntax OK"

---

## Task 7: 创建格式编排模块

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/formatter.py`

**Step 1: 编写格式编排模块**

```python
"""公众号格式编排模块"""
import re


def markdown_to_wechat_html(markdown_text):
    """
    将 Markdown 转换为微信公众号 HTML
    
    Args:
        markdown_text: Markdown 格式文本
    
    Returns:
        str: 微信公众号支持的 HTML
    """
    html = markdown_text
    
    # 转义 HTML 特殊字符
    html = html.replace("&", "&amp;")
    html = html.replace("<", "&lt;")
    html = html.replace(">", "&gt;")
    
    # 标题
    html = re.sub(r'^### (.*?)$', r'<h3>\1</h3>', html, flags=re.MULTILINE)
    html = re.sub(r'^## (.*?)$', r'<h2>\1</h2>', html, flags=re.MULTILINE)
    html = re.sub(r'^# (.*?)$', r'<h1>\1</h1>', html, flags=re.MULTILINE)
    
    # 粗体和斜体
    html = re.sub(r'\*\*\*(.*?)\*\*\*', r'<strong><em>\1</em></strong>', html)
    html = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', html)
    html = re.sub(r'\*(.*?)\*', r'<em>\1</em>', html)
    
    # 引用
    html = re.sub(r'^&gt; (.*?)$', r'<blockquote>\1</blockquote>', html, flags=re.MULTILINE)
    
    # 无序列表
    def process_ul(match):
        items = match.group(0).strip().split('\n')
        list_items = []
        for item in items:
            item_text = re.sub(r'^[\s]*[-*+]\s*', '', item)
            list_items.append(f"<li>{item_text}</li>")
        return f"<ul>{''.join(list_items)}</ul>"
    
    html = re.sub(r'(^[\s]*[-*+]\s*.*?$\n?)+', process_ul, html, flags=re.MULTILINE)
    
    # 有序列表
    def process_ol(match):
        items = match.group(0).strip().split('\n')
        list_items = []
        for item in items:
            item_text = re.sub(r'^[\s]*\d+\.\s*', '', item)
            list_items.append(f"<li>{item_text}</li>")
        return f"<ol>{''.join(list_items)}</ol>"
    
    html = re.sub(r'(^[\s]*\d+\.\s*.*?$\n?)+', process_ol, html, flags=re.MULTILINE)
    
    # 代码块
    html = re.sub(r'```(.*?)```', r'<pre><code>\1</code></pre>', html, flags=re.DOTALL)
    
    # 行内代码
    html = re.sub(r'`(.*?)`', r'<code>\1</code>', html)
    
    # 链接
    html = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2">\1</a>', html)
    
    # 图片
    html = re.sub(r'!\[([^\]]*)\]\(([^)]+)\)', r'<img src="\2" alt="\1" />', html)
    
    # 段落（空行分隔）
    paragraphs = html.split('\n\n')
    formatted_paragraphs = []
    for p in paragraphs:
        p = p.strip()
        if p and not p.startswith('<'):
            p = f"<p>{p}</p>"
        formatted_paragraphs.append(p)
    html = '\n'.join(formatted_paragraphs)
    
    # 换行转 <br>
    html = html.replace('\n', '<br/>')
    
    return html


def add_wechat_styles(html_content):
    """
    添加微信公众号样式
    
    Args:
        html_content: HTML 内容
    
    Returns:
        str: 带样式的 HTML
    """
    # 微信公众号不支持外部 CSS，这里只是预留接口
    # 实际使用时可以通过微信编辑器的样式功能调整
    return html_content
```

**Step 2: 语法检查**

```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && python -m py_compile scripts/formatter.py && echo "Syntax OK"
```

**Expected:** 输出 "Syntax OK"

---

## Task 8: 创建公众号发布模块

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/publisher.py`

**Step 1: 编写发布模块**

```python
"""微信公众号发布模块"""
import requests
import json
from .config import get_config

WECHAT_API_BASE = "https://api.weixin.qq.com/cgi-bin"


def get_access_token():
    """获取微信 access_token"""
    appid = get_config("wechat_appid")
    secret = get_config("wechat_secret")
    
    if not appid or not secret:
        raise ValueError("微信公众号 AppID 或 Secret 未配置")
    
    url = f"{WECHAT_API_BASE}/token"
    params = {
        "grant_type": "client_credential",
        "appid": appid,
        "secret": secret
    }
    
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    if "access_token" in data:
        return data["access_token"]
    else:
        raise RuntimeError(f"获取 access_token 失败: {data}")


def upload_image(access_token, image_url):
    """
    上传图片到微信素材库
    
    Args:
        access_token: 微信 access_token
        image_url: 图片 URL
    
    Returns:
        str: 图片的 media_id
    """
    # 先下载图片
    img_response = requests.get(image_url, timeout=30)
    img_response.raise_for_status()
    
    url = f"{WECHAT_API_BASE}/media/uploadimg"
    params = {"access_token": access_token}
    
    files = {
        "media": ("cover.jpg", img_response.content, "image/jpeg")
    }
    
    response = requests.post(url, params=params, files=files, timeout=30)
    response.raise_for_status()
    
    data = response.json()
    if "url" in data:
        return data["url"]  # 返回图片 URL
    else:
        raise RuntimeError(f"上传图片失败: {data}")


def create_draft(access_token, title, content, digest, thumb_url, author=""):
    """
    创建图文消息草稿
    
    Args:
        access_token: 微信 access_token
        title: 文章标题
        content: 正文内容（HTML）
        digest: 摘要
        thumb_url: 封面图片 URL
        author: 作者（可选）
    
    Returns:
        str: 草稿的 media_id
    """
    url = f"{WECHAT_API_BASE}/draft/add"
    params = {"access_token": access_token}
    
    data = {
        "articles": [
            {
                "title": title,
                "content": content,
                "thumb_media_id": thumb_url,
                "author": author,
                "digest": digest,
                "content_source_url": "",
                "need_open_comment": 1,
                "only_fans_can_comment": 0
            }
        ]
    }
    
    response = requests.post(url, params=params, json=data, timeout=30)
    response.raise_for_status()
    
    result = response.json()
    if "media_id" in result:
        return result["media_id"]
    else:
        raise RuntimeError(f"创建草稿失败: {result}")


def publish_draft(title, content, digest, cover_url, author=""):
    """
    发布文章到草稿箱（完整流程）
    
    Args:
        title: 文章标题
        content: 正文 HTML
        digest: 摘要
        cover_url: 封面图片 URL
        author: 作者（可选）
    
    Returns:
        str: 草稿 media_id
    """
    access_token = get_access_token()
    media_id = create_draft(access_token, title, content, digest, cover_url, author)
    return media_id
```

**Step 2: 语法检查**

```bash
cd /Users/an/.config/agents/agents/skills/wechat-mp-publisher && python -m py_compile scripts/publisher.py && echo "Syntax OK"
```

**Expected:** 输出 "Syntax OK"

---

## Task 9: 创建主 SKILL.md

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/SKILL.md`

**Step 1: 编写 SKILL.md**

```markdown
---
name: wechat-mp-publisher
description: 微信公众号自动化发布全流程工具。支持从主题输入、素材搜索、AI写作、封面生成、格式编排到草稿箱发布的完整工作流。使用分步确认模式，每个阶段都向用户展示结果并获取确认。触发词："帮我写一篇公众号文章"、"发布公众号"、"创作公众号内容"、"公众号文章"、"写公众号"。
---

# 微信公众号自动化发布 Skill

## 快速开始

首次使用需要配置 API 密钥：
```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && python -c "from scripts.config import init_config_interactive; init_config_interactive()"
```

## 工作流程

1. **接收主题** → 用户提出文章主题
2. **搜索素材** → Brave Search 获取相关资料
3. **AI 写作** → 调用写作风格 skill 生成文章
4. **生成封面** → 豆包 API 生成封面图
5. **格式编排** → 转换为公众号 HTML 格式
6. **发布草稿** → 调用微信公众号 API 发布到草稿箱

每个步骤都向用户展示结果并等待确认。

## 模块说明

- `scripts/search.py` - Brave 搜索模块
- `scripts/writer.py` - AI 写作模块
- `scripts/cover.py` - 封面生成模块（豆包 API）
- `scripts/formatter.py` - 格式编排模块
- `scripts/publisher.py` - 公众号发布模块
- `scripts/config.py` - 配置管理

## 封面风格选项

- `realistic` - 写实风格，真实照片质感
- `illustration` - 插画风格，色彩丰富
- `minimal` - 极简风格，扁平化设计
- `creative` - 创意设计，富有想象力

## 依赖

- Python 3.8+
- requests
- Brave Search API key
- 豆包 API key
- 微信公众号 AppID + Secret
```

**Step 2: 验证文件**

```bash
cat /Users/an/.config/agents/skills/wechat-mp-publisher/SKILL.md | head -20
```

**Expected:** 正确显示 SKILL.md 内容

---

## Task 10: 创建 __init__.py 文件

**Files:**
- Create: `/Users/an/.config/agents/skills/wechat-mp-publisher/scripts/__init__.py`

**Step 1: 创建空 __init__.py**

```bash
touch /Users/an/.config/agents/skills/wechat-mp-publisher/scripts/__init__.py
ls -la /Users/an/.config/agents/skills/wechat-mp-publisher/scripts/
```

**Expected:** 目录中包含 `__init__.py` 文件

---

## Task 11: 最终验证

**Step 1: 检查完整目录结构**

```bash
tree /Users/an/.config/agents/skills/wechat-mp-publisher/ 2>/dev/null || find /Users/an/.config/agents/skills/wechat-mp-publisher/ -type f | sort
```

**Expected:** 显示所有创建的文件

**Step 2: 验证所有 Python 文件语法**

```bash
cd /Users/an/.config/agents/skills/wechat-mp-publisher && for f in scripts/*.py; do python -m py_compile "$f" && echo "✓ $f"; done
```

**Expected:** 所有文件都显示 ✓

---

## 后续使用说明

1. **配置 API 密钥**：
   ```bash
   cd /Users/an/.config/agents/skills/wechat-mp-publisher
   python -c "from scripts.config import init_config_interactive; init_config_interactive()"
   ```

2. **使用 Skill**：
   用户说："帮我写一篇关于 AI 发展趋势的公众号文章"

3. **Skill 执行流程**：
   - 检查配置是否完整
   - 调用搜索模块获取素材
   - 展示搜索结果，等待用户确认
   - 调用写作模块生成文章
   - 展示文章内容，等待用户确认
   - 调用封面模块生成封面
   - 展示封面，等待用户选择风格并确认
   - 调用编排模块格式化内容
   - 展示排版效果，等待用户确认
   - 调用发布模块发布到草稿箱
   - 返回草稿链接

---

## 注意事项

- 微信公众号 API 有调用频率限制
- 封面图片需要符合微信规范
- 文章内容需要符合微信公众号内容规范
