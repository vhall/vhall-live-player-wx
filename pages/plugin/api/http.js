import * as Config from './config.js';

function get(url,data,configKey){
  let VALL_URL = Config[configKey] || Config['vhall'];
  VALL_URL = VALL_URL + url;
  if(url.indexOf('https://')!=-1){
    VALL_URL = url;
  }
  return new Promise(function (resolve, reject) {
    wx.request({
      url: VALL_URL+'?_='+new Date().getTime(),
      data: data,
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        resolve(res)
      },
      fail: function(error){
        reject(error);
      }
    });
  })
}

function post(url, data, configKey) {
  let VALL_URL = Config[configKey]||Config['vhall'];
  return new Promise(function (resolve, reject) {
    wx.request({
      url: VALL_URL + url,
      data: data,
      method:'POST',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success: function (res) {
        resolve(res)
      },
      fail: function (error) {
        reject(error);
      }
    });
  })
}

export default {
  reqGet: get,
  reqPost: post
}
