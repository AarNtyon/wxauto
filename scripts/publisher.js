/**
 * 微信公众号发布模块
 */
const axios = require('axios');
const FormData = require('form-data');
const { getConfig } = require('./config');

const WECHAT_API_BASE = 'https://api.weixin.qq.com/cgi-bin';

/**
 * 获取微信 access_token
 * @returns {Promise<string>} access_token
 */
async function getAccessToken() {
  const appid = getConfig('wechat_appid');
  const secret = getConfig('wechat_secret');

  if (!appid || !secret) {
    throw new Error('微信公众号 AppID 或 Secret 未配置');
  }

  try {
    const response = await axios.get(`${WECHAT_API_BASE}/token`, {
      params: {
        grant_type: 'client_credential',
        appid: appid,
        secret: secret
      },
      timeout: 30000
    });

    const data = response.data;
    if (data.access_token) {
      return data.access_token;
    } else {
      throw new Error(`获取 access_token 失败: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    throw new Error(`获取 access_token 失败: ${error.message}`);
  }
}

/**
 * 上传图片到微信永久素材库
 * @param {string} accessToken - 微信 access_token
 * @param {string} imageUrl - 图片 URL
 * @returns {Promise<string>} 图片的 media_id
 */
async function uploadImage(accessToken, imageUrl) {
  try {
    // 先下载图片
    console.log('下载封面图片...');
    const imgResponse = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });

    // 使用永久素材接口上传
    const url = `${WECHAT_API_BASE}/material/add_material`;
    
    const formData = new FormData();
    formData.append('media', Buffer.from(imgResponse.data), {
      filename: 'cover.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('type', 'image');

    console.log('上传永久素材...');
    const response = await axios.post(url, formData, {
      params: { 
        access_token: accessToken,
        type: 'image'
      },
      headers: formData.getHeaders(),
      timeout: 60000
    });

    const data = response.data;
    if (data.media_id) {
      console.log('永久素材上传成功，media_id:', data.media_id);
      return data.media_id;
    } else if (data.url) {
      // 有些情况下返回 url
      console.log('素材上传成功，url:', data.url);
      return data.url;
    } else {
      throw new Error(`上传图片失败: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    if (error.response) {
      console.error('API 响应:', error.response.status, error.response.data);
      throw new Error(`上传图片失败 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`上传图片失败: ${error.message}`);
  }
}

/**
 * 创建图文消息草稿
 * @param {string} accessToken - 微信 access_token
 * @param {string} title - 文章标题
 * @param {string} content - 正文内容（HTML）
 * @param {string} digest - 摘要
 * @param {string} thumbMediaId - 封面图片 media_id
 * @param {string} author - 作者（可选）
 * @returns {Promise<string>} 草稿的 media_id
 */
async function createDraft(accessToken, title, content, digest, thumbMediaId, author = '') {
  try {
    const url = `${WECHAT_API_BASE}/draft/add`;
    
    const data = {
      articles: [
        {
          title: title,
          content: content,
          thumb_media_id: thumbMediaId,
          author: author,
          digest: digest,
          content_source_url: '',
          need_open_comment: 1,
          only_fans_can_comment: 0
        }
      ]
    };

    console.log('创建草稿...');
    const response = await axios.post(url, data, {
      params: { access_token: accessToken },
      timeout: 30000
    });

    const result = response.data;
    if (result.media_id) {
      console.log('草稿创建成功，media_id:', result.media_id);
      return result.media_id;
    } else {
      throw new Error(`创建草稿失败: ${JSON.stringify(result)}`);
    }
  } catch (error) {
    if (error.response) {
      console.error('API 响应:', error.response.status, error.response.data);
      throw new Error(`创建草稿失败 (${error.response.status}): ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`创建草稿失败: ${error.message}`);
  }
}

/**
 * 发布文章到草稿箱（完整流程）
 * @param {string} title - 文章标题
 * @param {string} content - 正文 HTML
 * @param {string} digest - 摘要
 * @param {string} coverUrl - 封面图片 URL
 * @param {string} author - 作者（可选）
 * @returns {Promise<Object>} 包含 media_id 和 url
 */
async function publishDraft(title, content, digest, coverUrl, author = '') {
  console.log('开始发布流程...');
  
  const accessToken = await getAccessToken();
  console.log('access_token 获取成功');
  
  // 上传封面图到永久素材库
  console.log('上传封面图...');
  const thumbMediaId = await uploadImage(accessToken, coverUrl);
  
  // 创建草稿
  console.log('创建图文草稿...');
  const mediaId = await createDraft(accessToken, title, content, digest, thumbMediaId, author);
  
  return {
    media_id: mediaId,
    url: `https://mp.weixin.qq.com/s/${mediaId}`, // 草稿链接
    thumb_media_id: thumbMediaId
  };
}

module.exports = {
  getAccessToken,
  uploadImage,
  createDraft,
  publishDraft
};
