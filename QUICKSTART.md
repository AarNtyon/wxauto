# 快速开始 - 微信公众号发布 Skill

## 用户使用流程

### 1. 用户说触发词
用户说："帮我写一篇关于 AI 发展趋势的公众号文章"

### 2. Kimi 执行流程

#### 第一步：检查配置
```python
import sys
sys.path.insert(0, '/Users/an/code/wxauto')
from scripts.config import check_config, init_config_interactive

missing = check_config()
if missing:
    print("⚠️ 需要配置以下 API Key 才能继续:")
    for item in missing:
        print(f"  - {item}")
    
    # 交互式配置
    init_config_interactive()
```

如果配置不完整，提示用户输入：
- 微信公众号 AppID
- 微信公众号 Secret
- 豆包 API Key
- Brave Search API Key

#### 第二步：搜索素材
```python
from scripts.search import search_topic, format_search_results

results = search_topic("AI 发展趋势", count=5)
print(format_search_results(results))
```

**向用户展示搜索结果，等待确认**

#### 第三步：生成文章
```python
from scripts.writer import generate_article_prompt

prompt = generate_article_prompt("AI 发展趋势", results)
# 将 prompt 发送给 AI 生成文章
```

**展示生成的文章给用户，等待确认**

#### 第四步：生成封面
```python
from scripts.cover import format_style_options, generate_cover

print(format_style_options())
# 让用户选择风格

cover_url = generate_cover(title, style="creative")
```

**展示封面，等待确认**

#### 第五步：格式编排
```python
from scripts.formatter import markdown_to_wechat_html

html = markdown_to_wechat_html(content)
```

**展示 HTML 效果，等待确认**

#### 第六步：发布
```python
from scripts.publisher import publish_draft

media_id = publish_draft(title, html, digest, cover_url)
print(f"✅ 发布成功！Media ID: {media_id}")
```

---

## 关键要点

1. **必须先检查配置** - 没有配置无法调用 API
2. **每个步骤都要等待用户确认** - 这是分步确认模式
3. **使用 Python 导入模块** - 不要直接用 shell 执行 .py 文件
4. **错误处理** - API 调用可能失败，需要 try-except

---

## 用户交互选项

每个步骤完成后，给用户选项：
- ✅ **确认并继续** - 进入下一步
- 🔄 **重新生成** - 当前步骤重做
- ⏭️ **跳过** - 使用默认或跳过此步
- ❌ **终止** - 结束整个流程
