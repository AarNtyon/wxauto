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

## 上传永久素材（图片）

用于上传图文消息封面图，素材永久保存。

```http
POST https://api.weixin.qq.com/cgi-bin/material/add_material?access_token={access_token}&type=image
Content-Type: multipart/form-data
```

参数：
- `media` - 多媒体文件（form-data）
- `type` - 媒体文件类型，此处为 `image`

响应：
```json
{
  "media_id": "MEDIA_ID",
  "url": "URL"
}
```

## 上传临时素材（备用）

临时素材接口，3天后失效。

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
