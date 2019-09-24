var utils = require('./public_func');


function WxVideo(json, context) {

  this.defaultJson = {
    wx: null,  // 微信 obj
    livePlayerKey: '',  // liveplayer 动态更换src的变量key
    id_: '',  // 播放器 liveplayer id
    type_: 'rtmp',  // flv or rtmp or mp4 or hls
    baseMode: 'live',  // live or vod
    pushUrl: '',  // 上报地址
    subSrc: [],  // 自定义播放地址 如果不用 userApi 则有效
    catonChangeSrcMaxTime: 10,
    useApi: true,  // 使用调度
    closePush: false,  // 关闭上报
    dispatchDomain: '',  // 调度地址
    vodQuality: ['same'],  // 回放调度需要
    uri: '',  // 回放调度地址需要
    arguments: {
      id: '',
      s: '',
      p: '',
      uid: '',
      aid: '',
      pf: '',
      pd: '',
      vid: '',
      vfid: '',
      guid: '',
      vtype: '',
      topic: '',
      ua: 'vhall-wxapp',
      bf: 3,
      tt: null, // 观看时长,毫秒
      _bc: 0, // 卡顿
      ndi: '',
      _bt: 0, // 恢复时长
      host_user_id: '',
      browser: '',
      tf: 0,  // 本次心跳时长哪的下载流量
      rand: this.random(),
      ver: '',  // 版本号
      si: '',  // 服务器ip
      'from': '',  // 来源标示符
      bu: '',  // 区分业务单元
      app_id: '',  // 应用ID
      biz_role: 0,  // 1代表老师，2代表嘉宾，3代表助教，4代表学员，如果不关注角色请设为0, 数据库存储字段名为 biz_role
      flow_type: 2,  // 上行或是下行流量  int   1代表上行流量，2代表下行流量，0代表默认值
      biz_id: '-', // 业务id  varchar   业务id，'-'代表默认值
      biz_des01: 0, // 业务属性 int   业务属性，1代表小班课，2代表大班课，如果不关注业务属性请设为0
    }
  };  // this.defaultJson finish;

  this.context = context;

  for (var attr in json) {
    if (attr == 'arguments') {
      for (var arg in json['arguments']) {
        this.defaultJson['arguments'][arg] = json['arguments'][arg]
      };
    } else {
      this.defaultJson[attr] = json[attr];
    }
  };

  if (!this.defaultJson.id_) {
    console.log('need dom id');
    return;
  };

  if (!this.defaultJson.wx) {
    console.log('wx object is must!');
    return;
  };

  if (!this.defaultJson.arguments.s) {
    this.defaultJson.arguments.s = utils.videoUuid(32, 32);
  };

  if (!this.defaultJson.arguments.vid) {
    this.defaultJson.arguments.vid = '000000';
  };

  this.carltonCount = 0;  // 卡顿次数
  this.carltonReplay = 0;  // 卡顿持续时间
  this.currentTime = 0;  // 当前播放时间
  this.currentCartonTime = 0;  // 当前卡顿持续时间
  this.tt = 0;  // 上报时间
  this.heartTT = 0;
  this.randomSwitchSrcCount = 0;  // 完整轮训的次数
  this.isFull = false;
  this.ttTimer = null;
  this.liveInfoTimer = null;
  this.minuteHeartLiveTimer = null;
  this.carltonTimer = null;
  this.currentSrc = '';
  this.fetchRs = null;
  this.firstPush = false;
  this.vodInfoTimer = null;  // 回放信息包定时器
  this.minuteHeartVodTimer = null;  // 回放心跳定时器

  this._token = { token: null, date: 0 };
  this.player = (json.player ? json.player : null);
  this.oldDetail = null;
  this._switchIng = false;  // 是否处于切源状态
  this.vodPlayStatus = false;  // vod play status

  this.url = this.defaultJson.pushUrl || 'http://t-dc.e.vhall.com/login';
};

WxVideo.prototype.getSrc = function () {
  if (!this.defaultJson.useApi) {
    return this.defaultJson.subSrc[0]
  } else {
    return ''
  }
};

WxVideo.prototype.switchStatus = function () {  // 显示切源状态 true 在切源， false 不在切源
  return this._switchIng;
};

WxVideo.prototype.updateLivePlayerSrc = function (value) {
  var key = this.defaultJson.livePlayerKey;
  var rs = {};
  rs[key] = value + '?token=' + this._token.token;

  this._switchIng = true;
  this.context.setData(rs);
  this.oldDetail = null;
  this.stopAllTimer();

  this.sleep(2000);
  if (!this.player) {
    if (this.defaultJson.baseMode == 'live') {
      this.player = this.defaultJson.wx.createLivePlayerContext(this.defaultJson.id_);
    } else {
      this.player = this.defaultJson.wx.createVideoContext(this.defaultJson.id_)
    }
  }
  this._play(this);
  this.currentSrc = value;

  if (this.defaultJson.baseMode == 'vod' && this._currentTime()) {
    this.player.seek(this._currentTime());
  };

};

WxVideo.prototype.sleep = function (milliSeconds) {
  var startTime = new Date().getTime(); // get the current time    
  while (new Date().getTime() < startTime + milliSeconds);
};

WxVideo.prototype.play = function () {
  var THIS = this;

  if (!this.defaultJson.useApi) {
    this._switchSrc();

  } else {
    this.fetchSrc({
      callback: function (rs) {
        THIS.currentSrc = rs.currentSrc;
        THIS.updateLivePlayerSrc(THIS.currentSrc);
      }
    });
  }
}; // 开始播放


WxVideo.prototype._play = function (THIS) {

  if (this.defaultJson.baseMode == 'live') {
    // 直播
    this.player.play({
      success: function () {
        if (!THIS.firstPush) {
          THIS.fristLiveStartPlayPush();  // 仅在第一次开始播放的时候 进行上报一次
          THIS.firstPush = true;
        }
      },
      fail: function () {
        THIS.liveFirstPlayErrorPush();  // 上报错误信息
        THIS._switchSrc();  // 切源
      },
      complete: function () {

      }
    })
  } else {
    // 回放
    this.player.play();

    if (!this.vodPlayStatus) {
      this.firstVodStartPlayPush();
      this.vodPlayStatus = true;
    };

  }


};


WxVideo.prototype.stop = function () {
  if (this.defaultJson.baseMode == 'live') {
    this.player.stop();
    this.stopAllTimer();
    this._liveInfo(this, 2002);
  }

};  // 停止


WxVideo.prototype.onBindPlay = function () {  // 回放 组建中绑定使用  判断开始播放使用
  this.startTimer();

  if (!this.vodPlayStatus) return;

  var token = utils.base64encode(JSON.stringify({
    s: this.defaultJson.arguments['s'],
    p: this.defaultJson.arguments['p'],
    uid: this.defaultJson.arguments['uid'],
    aid: this.defaultJson.arguments['aid'],
    pf: this.defaultJson.arguments['pf'],
    ver: this.defaultJson.arguments['ver'],
    vid: this.defaultJson.arguments['vid'],
    vfid: this.defaultJson.arguments['vfid'],
    ndi: this.defaultJson.arguments['ndi'],
    guid: this.defaultJson.arguments['guid'],
    vtype: this.defaultJson.arguments['vtype'],
    topic: this.defaultJson.arguments['topic'],
    fd: this.splitSrc()['fd'],  // 播放地址 uri
    sd: this.splitSrc()['sd'],  // 播放地址 域名,
    errcode: 2002,
    si: this.defaultJson.arguments['si'],
    from: this.defaultJson.arguments['from'],
    app_id: this.defaultJson.arguments['app_id'],
    biz_role: this.defaultJson.arguments['biz_role'],
    flow_type: this.defaultJson.arguments['flow_type'],
    biz_id: this.defaultJson.arguments['biz_id'],
    biz_des01: this.defaultJson.arguments['biz_des01']
  }));

  var url = this.url + '?k=92004&id=' + this.createId() +
    '&s=' + this.defaultJson.arguments['s'] + '&bu=' + this.defaultJson.arguments['bu'] +
    '&token=' + token;

  this.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      console.log('vod start play push finish')
    },
    fail: function (e) {
      console.log('vod start play push fail');
      console.log(e)
      console.log(url)
    }
  })

};

WxVideo.prototype.onBindPause = function () { // 回放组建中绑定使用  判断暂停播放使用
  this.stopAllTimer();
  this._vodInfo(this, 2002);

  var token = utils.base64encode(JSON.stringify({
    s: this.defaultJson.arguments['s'],
    p: this.defaultJson.arguments['p'],
    uid: this.defaultJson.arguments['uid'],
    aid: this.defaultJson.arguments['aid'],
    pf: this.defaultJson.arguments['pf'],
    vid: this.defaultJson.arguments['vid'],
    vfid: this.defaultJson.arguments['vfid'],
    ndi: this.defaultJson.arguments['ndi'],
    guid: this.defaultJson.arguments['guid'],
    vtype: this.defaultJson.arguments['vtype'],
    topic: this.defaultJson.arguments['topic'],
    app_id: this.defaultJson.arguments['app_id'],
    biz_role: this.defaultJson.arguments['biz_role'],
    flow_type: this.defaultJson.arguments['flow_type'],
    biz_id: this.defaultJson.arguments['biz_id'],
    biz_des01: this.defaultJson.arguments['biz_des01']
  }));

  var url = this.url + '?k=92002&id=' + this.createId() +
    '&s=' + this.defaultJson.arguments['s'] + '&bu=' + this.defaultJson.arguments['bu'] +
    '&token=' + token;
  this.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      console.log('vod pause start play push finish')
    },
    fail: function (e) {
      console.log('vod pause start play push fail');
      console.log(e)
    }
  })


}

WxVideo.prototype.onBindEnd = function () {  // 回放组建中绑定使用 点播结束后使用
  this.stopAllTimer();
  this._vodInfo(this, 2002);

  this.vodPlayStatus = false;  // play end
}

WxVideo.prototype.onError = function () {  // 回放组建中绑定使用 点播出错后调用
  this.stopAllTimer();
  this._liveInfo(this, 4001);  // 出现错误进行一次上报
  this._switchSrc();
}


WxVideo.prototype.changeScreen = function (type_) {
  if (!this.isFull) {
    this.player.requestFullScreen(type_);
    this.isFull = true;
  } else {
    this.player.exitFullScreen();
    this.isFull = false;
  };
};  // 全屏


WxVideo.prototype.random = function () {
  var array = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  return parseInt(
    String(array[Math.floor(Math.random() * array.length)]) +
    String(array[Math.floor(Math.random() * array.length)]) +
    String(array[Math.floor(Math.random() * array.length)])
  );
};  // function random finish;


WxVideo.prototype.createId = function () {
  var time = new Date();
  return time.getTime() + this.random();
};


WxVideo.prototype._currentTime = function () {
  return this.currentTime;
}


WxVideo.prototype.splitSrc = function () {
  var fd = '';
  var sd = '';
  if (this.currentSrc) {
    fd = this.currentSrc.split('.com/')[1];
    sd = this.currentSrc.split('.com/')[0];
  }
  return { fd: fd, sd: sd }
}

/*   数据上报   */

WxVideo.prototype.startTimer = function () {
  this.ttCounter();
  if (this.defaultJson.baseMode == 'live') {
    this.liveInfo();
    this.liveHeart();
  } else {
    this.vodInfo();
    this.vodHeart();
  }

}


WxVideo.prototype.stopAllTimer = function () {
  if (this.ttTimer) {
    clearInterval(this.ttTimer);  // 关闭统计播放时长的
    this.ttTimer = null;
  };

  if (this.liveInfoTimer) {
    clearInterval(this.liveInfoTimer);
    this.liveInfoTimer = null;
  };

  if (this.vodInfoTimer) {
    console.log('close vodinfotimer')
    clearInterval(this.vodInfoTimer);
    this.vodInfoTimer = null;
  };

  if (this.minuteHeartVodTimer) {
    clearInterval(this.minuteHeartVodTimer);
    this.minuteHeartVodTimer = null;
  };

  if (this.minuteHeartLiveTimer) {
    clearInterval(this.minuteHeartLiveTimer);
    this.minuteHeartLiveTimer = null;
  };

  if (this.carltonTimer) {
    clearInterval(this.carltonTimer);
    this.carltonTimer = null;
  };

}


WxVideo.prototype.ttCounter = function () {
  var THIS = this;

  if (!THIS.ttTimer) {
    THIS.ttTimer = setInterval(function () {  // 监听播放累加
      THIS.tt++;
      THIS.heartTT++;
      THIS.currentTime++;
    }, 1000);
  };
};

// 点播上报
WxVideo.prototype.firstVodStartPlayPush = function () {
  var THIS = this;
  this.isFirst = false;
  this._startPlayPush();
};

WxVideo.prototype._startPlayPush = function () {
  var token = utils.base64encode(JSON.stringify({
    s: this.defaultJson.arguments['s'],
    p: this.defaultJson.arguments['p'],
    uid: this.defaultJson.arguments['uid'],
    aid: this.defaultJson.arguments['aid'],
    pf: this.defaultJson.arguments['pf'],
    vid: this.defaultJson.arguments['vid'],
    vfid: this.defaultJson.arguments['vfid'],
    ndi: this.defaultJson.arguments['ndi'],
    guid: this.defaultJson.arguments['guid'],
    vtype: this.defaultJson.arguments['vtype'],
    topic: this.defaultJson.arguments['topic'],
    app_id: this.defaultJson.arguments['app_id'],
    biz_role: this.defaultJson.arguments['biz_role'],
    flow_type: this.defaultJson.arguments['flow_type'],
    biz_id: this.defaultJson.arguments['biz_id'],
    biz_des01: this.defaultJson.arguments['biz_des01']
  }));

  var url = this.url + '?k=92001&id=' + this.createId() +
    '&s=' + this.defaultJson.arguments['s'] + '&bu=' + this.defaultJson.arguments['bu'] +
    '&token=' + token;
  this.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      console.log('vod start play push finish')
    },
    fail: function (e) {
      console.log('vod start play push fail');
      console.log(e)
    }
  })
};

WxVideo.prototype.vodInfo = function () {
  var THIS = this;
  if (THIS.vodInfoTimer) return;
  THIS.vodInfoTimer = setInterval(THIS._vodInfo, 30000, THIS, 2002)
};

WxVideo.prototype._vodInfo = function (THIS, errcode) {
  var token = utils.base64encode(JSON.stringify({
    s: THIS.defaultJson.arguments['s'],
    p: THIS.defaultJson.arguments['p'],
    uid: THIS.defaultJson.arguments['uid'],
    aid: THIS.defaultJson.arguments['aid'],
    pf: THIS.defaultJson.arguments['pf'],
    ver: THIS.defaultJson.arguments['ver'],
    vid: THIS.defaultJson.arguments['vid'],
    vfid: THIS.defaultJson.arguments['vfid'],
    ndi: THIS.defaultJson.arguments['ndi'],
    guid: THIS.defaultJson.arguments['guid'],
    vtype: THIS.defaultJson.arguments['vtype'],
    topic: THIS.defaultJson.arguments['topic'],
    fd: THIS.splitSrc()['fd'],  // 播放地址 uri
    tt: THIS.tt * 1000,
    sd: THIS.splitSrc()['sd'],  // 播放地址 域名,
    errcode: errcode,
    si: THIS.defaultJson.arguments['si'],
    from: THIS.defaultJson.arguments['from'],
    app_id: THIS.defaultJson.arguments['app_id'],
    biz_role: THIS.defaultJson.arguments['biz_role'],
    flow_type: THIS.defaultJson.arguments['flow_type'],
    biz_id: THIS.defaultJson.arguments['biz_id'],
    biz_des01: THIS.defaultJson.arguments['biz_des01']
  }));

  var url = THIS.url + '?k=92002&id=' + THIS.createId() +
    '&s=' + THIS.defaultJson.arguments['s'] + '&bu=' + THIS.defaultJson.arguments['bu'] +
    '&token=' + token;

  console.log('test', url)

  THIS.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      THIS.tt = 0;
      console.log('vodinfo start play push finish')
    },
    fail: function (e) {
      console.log('vodinfo start play push fail');
      console.log(e)
      console.log(url)
    }
  })


}


// 直播心跳检测
WxVideo.prototype.vodHeart = function () {
  var THIS = this;

  if (this.minuteHeartVodTimer) {
    return;
  };

  this.minuteHeartVodTimer = setInterval(function () {

    var token = utils.base64encode(JSON.stringify({
      s: THIS.defaultJson.arguments['s'],
      p: THIS.defaultJson.arguments['p'],
      uid: THIS.defaultJson.arguments['uid'],
      aid: THIS.defaultJson.arguments['aid'],
      pf: THIS.defaultJson.arguments['pf'],
      fd: THIS.splitSrc()['fd'],  // 播放地址 uri
      si: THIS.defaultJson.arguments['si'],
      sd: THIS.splitSrc()['sd'],  // 播放地址 域名
      tt: THIS.heartTT * 1000,
      ua: THIS.defaultJson.arguments['ua'],
      vid: THIS.defaultJson.arguments['vid'],
      vfid: THIS.defaultJson.arguments['vfid'],
      ndi: THIS.defaultJson.arguments['ndi'],
      guid: THIS.defaultJson.arguments['guid'],
      vtype: THIS.defaultJson.arguments['vtype'],
      topic: THIS.defaultJson.arguments['topic'],
      host_user_id: '',
      brower: '',
      tf: '',
      app_id: THIS.defaultJson.arguments['app_id'],
      biz_role: THIS.defaultJson.arguments['biz_role'],
      flow_type: THIS.defaultJson.arguments['flow_type'],
      biz_id: THIS.defaultJson.arguments['biz_id'],
      biz_des01: THIS.defaultJson.arguments['biz_des01']
    }));

    var url = THIS.url + '?k=92003&id=' + THIS.createId() +
      '&s=' + THIS.defaultJson.arguments['s'] + '&bu=' + THIS.defaultJson.arguments['bu'] +
      '&token=' + token;

    THIS.defaultJson.wx.request({
      url: url,
      method: 'GET',
      success: function (data) {
        THIS.heartTT = 0;
        console.log('vod heart push finish')
      },
      fail: function (e) {
        console.log('vod heart push fail');
      }
    })

    THIS.heartTT = 0;
  }, 60000);
};  // function liveHeart finish;



// 直播上报
WxVideo.prototype.fristLiveStartPlayPush = function () {
  this._liveStartPlayPush();
};  // 开始播放的时候进行推送


WxVideo.prototype._liveStartPlayPush = function () {
  var token = utils.base64encode(JSON.stringify({
    s: this.defaultJson.arguments['s'],
    uid: this.defaultJson.arguments['uid'],
    aid: this.defaultJson.arguments['aid'],
    pf: this.defaultJson.arguments['pf'],
    ver: this.defaultJson.arguments['ver'],
    vid: this.defaultJson.arguments['vid'],
    vfid: this.defaultJson.arguments['vfid'],
    ndi: this.defaultJson.arguments['ndi'],
    guid: this.defaultJson.arguments['guid'],
    vtype: this.defaultJson.arguments['vtype'],
    topic: this.defaultJson.arguments['topic'],
    app_id: this.defaultJson.arguments['app_id'],
    biz_role: this.defaultJson.arguments['biz_role'],
    flow_type: this.defaultJson.arguments['flow_type'],
    biz_id: this.defaultJson.arguments['biz_id'],
    biz_des01: this.defaultJson.arguments['biz_des01']
  }));

  var url = this.url + '?k=102001&id=' + this.createId() +
    '&s=' + this.defaultJson.arguments['s'] + '&bu=' + this.defaultJson.arguments['bu'] +
    '&token=' + token;

  this.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      console.log('start play push finish')
    },
    fail: function (e) {
      console.log('start play push fail');
      console.log(e)
    }
  })

};  // _liveStartPlayPush finish;


WxVideo.prototype.liveInfo = function () {
  var THIS = this;

  if (THIS.liveInfoTimer)
    return;
  THIS.liveInfoTimer = setInterval(THIS._liveInfo, 30000, THIS, 2002);
};  // liveInfo finish;


WxVideo.prototype._liveInfo = function (THIS, errCode) {

  var token = utils.base64encode(JSON.stringify({
    s: THIS.defaultJson.arguments['s'],
    p: THIS.defaultJson.arguments['p'],
    uid: THIS.defaultJson.arguments['uid'],
    aid: THIS.defaultJson.arguments['aid'],
    pf: THIS.defaultJson.arguments['pf'],
    ver: THIS.defaultJson.arguments['ver'],
    vid: THIS.defaultJson.arguments['vid'],
    vfid: THIS.defaultJson.arguments['vfid'],
    ndi: THIS.defaultJson.arguments['ndi'],
    guid: THIS.defaultJson.arguments['guid'],
    vtype: THIS.defaultJson.arguments['vtype'],
    topic: THIS.defaultJson.arguments['topic'],
    fd: THIS.splitSrc()['fd'],  // 播放地址 uri
    tt: THIS.tt * 1000,
    bc: THIS.carltonCount,  // 卡顿
    bt: THIS.carltonReplay,  // 卡顿持续时间
    sd: THIS.splitSrc()['sd'],  // 播放地址 域名,
    errcode: errCode,
    si: THIS.defaultJson.arguments['si'],
    from: THIS.defaultJson.arguments['from'],
    app_id: THIS.defaultJson.arguments['app_id'],
    biz_role: THIS.defaultJson.arguments['biz_role'],
    flow_type: THIS.defaultJson.arguments['flow_type'],
    biz_id: THIS.defaultJson.arguments['biz_id'],
    biz_des01: THIS.defaultJson.arguments['biz_des01']
  }));

  var url = THIS.url + '?k=102002&id=' + THIS.createId() +
    '&s=' + THIS.defaultJson.arguments['s'] + '&bu=' + THIS.defaultJson.arguments['bu'] +
    '&token=' + token;
  THIS.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      console.log('info push finish')
    },
    fail: function (e) {
      console.log('info push fail');
    }
  })
  THIS.tt = 0;
  THIS.carltonCount = 0;
  THIS.carltonReplay = 0;
};  // function _liveinfo finish;


// 直播心跳检测
WxVideo.prototype.liveHeart = function () {
  var THIS = this;

  if (this.minuteHeartLiveTimer) {
    return;
  };

  this.minuteHeartLiveTimer = setInterval(function () {

    var token = utils.base64encode(JSON.stringify({
      s: THIS.defaultJson.arguments['s'],
      p: THIS.defaultJson.arguments['p'],
      uid: THIS.defaultJson.arguments['uid'],
      aid: THIS.defaultJson.arguments['aid'],
      pf: THIS.defaultJson.arguments['pf'],
      fd: THIS.splitSrc()['fd'],  // 播放地址 uri
      si: THIS.defaultJson.arguments['si'],
      sd: THIS.splitSrc()['sd'],  // 播放地址 域名
      tt: THIS.heartTT * 1000,
      ua: THIS.defaultJson.arguments['ua'],
      vid: THIS.defaultJson.arguments['vid'],
      vfid: THIS.defaultJson.arguments['vfid'],
      ndi: THIS.defaultJson.arguments['ndi'],
      guid: THIS.defaultJson.arguments['guid'],
      vtype: THIS.defaultJson.arguments['vtype'],
      topic: THIS.defaultJson.arguments['topic'],
      host_user_id: '',
      brower: '',
      tf: '',
      app_id: THIS.defaultJson.arguments['app_id'],
      biz_role: THIS.defaultJson.arguments['biz_role'],
      flow_type: THIS.defaultJson.arguments['flow_type'],
      biz_id: THIS.defaultJson.arguments['biz_id'],
      biz_des01: THIS.defaultJson.arguments['biz_des01']
    }));

    var url = THIS.url + '?k=102003&id=' + THIS.createId() +
      '&s=' + THIS.defaultJson.arguments['s'] + '&bu=' + THIS.defaultJson.arguments['bu'] +
      '&token=' + token;

    THIS.defaultJson.wx.request({
      url: url,
      method: 'GET',
      success: function (data) {
        console.log('heart push finish')
      },
      fail: function (e) {
        console.log('heart push fail');
      }
    })

    THIS.heartTT = 0;
  }, 60000);
};  // function liveHeart finish;


// 直播开始时失败
WxVideo.prototype.liveFirstPlayErrorPush = function () {
  var THIS = this;

  var token = utils.base64encode(JSON.stringify({
    s: THIS.defaultJson.arguments['s'],
    p: THIS.defaultJson.arguments['p'],
    uid: THIS.defaultJson.arguments['uid'],
    aid: THIS.defaultJson.arguments['aid'],
    pf: THIS.defaultJson.arguments['pf'],
    ver: THIS.defaultJson.arguments['ver'],
    fd: THIS.splitSrc()['fd'],  // 播放地址 uri
    errcode: 4001,
    si: THIS.defaultJson.arguments['si'],
    sd: THIS.splitSrc()['sd'],  // 播放地址 域名
    vid: THIS.defaultJson.arguments['vid'],
    vfid: THIS.defaultJson.arguments['vfid'],
    ndi: THIS.defaultJson.arguments['ndi'],
    guid: THIS.defaultJson.arguments['guid'],
    vtype: THIS.defaultJson.arguments['vtype'],
    topic: THIS.defaultJson.arguments['topic'],
    app_id: THIS.defaultJson.arguments['app_id'],
    biz_role: THIS.defaultJson.arguments['biz_role'],
    flow_type: THIS.defaultJson.arguments['flow_type'],
    biz_id: THIS.defaultJson.arguments['biz_id'],
    biz_des01: THIS.defaultJson.arguments['biz_des01']
  }));

  var url = THIS.url + '?k=104001&id=' + THIS.createId() +
    '&s=' + THIS.defaultJson.arguments['s'] + '&bu=' + THIS.defaultJson.arguments['bu'] +
    '&token=' + token;

  THIS.defaultJson.wx.request({
    url: url,
    method: 'GET',
    success: function (data) {
      console.log('start fail push finish')
    },
    fail: function (e) {
      console.log('start fail push fail');
    }
  });
};  // function liveFirstPlayErrorPush finish;



/*  切源  */


WxVideo.prototype.checkToken = function () {
  var currentTime = new Date().getTime();

  console.log('token date', currentTime - this._token.date);

  if (currentTime - this._token.date >= 300000) {
    return false;
  } else {
    return true;
  };
};


// 初始化直接调用即可 参数可以为空 {} 后期验证token过期，通过当前清晰度 获取完新的资源后通过callback去拿到新的资源
WxVideo.prototype.fetchSrc = function (json) {

  if (!this.defaultJson.useApi) return;  // 关闭使用api则不进行
  var args = this.defaultJson.arguments;

  var _defaultJson = {
    qualityStr: '480p',  // 默认清晰度
    callback: null
  };

  for (var attr in json) {
    _defaultJson[attr] = json[attr];
  };

  var wx = this.defaultJson.wx;

  if (this.defaultJson.baseMode == 'live') {
    var url = this.defaultJson.dispatchDomain + '/api/dispatch_play?webinar_id=' + args.aid + '&rand=' + args.rand + '&uid=' + args.uid + '&bu=' + args.bu;
  } else {
    var url = this.defaultJson.dispatchDomain + '/api/dispatch_replay?webinar_id=' + args.aid + '&rand=' + args.rand + '&uid=' + args.uid + '&bu=' + args.bu + '&quality=' + JSON.stringify(this.defaultJson.vodQuality) + '&uri=' + this.defaultJson.uri;
  }

  // url = 'https://t-mss.e.vhall.com/api/dispatch_replay?webinar_id=9320432d&rand=881&uid=9320432d_vhallyun_412715&uri=/vhallyun/vhallrecord/lss_0bc36d14/20180426141728_a694eb45/record.m3u8&bu=1&quality=[]'
  console.log(url)


  var THIS = this;

  wx.request({
    url: url,
    method: 'GET',
    success: function (res) {
      var _data = res.data;

      if (_data.msg == 'success' && _data.code == '200') {
        var data = _data.data;
        var initToken = data.token;

        var _tokenCrc32 = utils.crc32(initToken.split('_')[0].split('').reverse().join('')).toString(16);
        var token = _tokenCrc32.toUpperCase() + '_' + initToken.split('_')[1];

        if (THIS.defaultJson.baseMode == 'live') {
          if (THIS.defaultJson.type_ == 'flv') {
            THIS.viewUrl = data.httpflv_urls;
            var _rs = initHandleSrc(THIS.viewUrl, 'httpflv_url', token, _defaultJson.qualityStr)
          } else {
            THIS.viewUrl = data.rtmp_urls;
            var _rs = initHandleSrc(THIS.viewUrl, 'rtmp_url', token, _defaultJson.qualityStr)
          }
        } else {
          // 回放
          if (THIS.defaultJson.type_ == 'hls') {
            THIS.viewUrl = data.hls_domainnames;
            var _rs = initHandleSrc(THIS.viewUrl, 'hls_domainname', token, _defaultJson.qualityStr)
          } else {
            THIS.viewUrl = data.mp4_domainnames;
            var _rs = initHandleSrc(THIS.viewUrl, 'mp4_domainname', token, _defaultJson.qualityStr)
          }
        }

        _rs['token'] = token;
        _rs['currentSrc'] = THIS.defaultJson.subSrc[0];
        THIS.currentSrc = _rs['currentSrc'];

        THIS._token = { token: token, 'date': new Date().getTime() }
        _defaultJson.callback && _defaultJson.callback(_rs);
      };
    },
    fail: function (e) {

    }
  }); // request finish;


  // 调度地址初始化
  function initHandleSrc(viewUrl, key_, token, standard) {
    var isExists = false;
    var choiceClearStatus = [];

    for (attr in viewUrl) {
      if (attr == standard) {
        isExists = true;
      }

      choiceClearStatus.push(attr);
    };

    // 如果当前的清晰度不存在，就从当前拥有的清晰度里取一个出来
    var _standard = isExists ? standard : 'same';

    THIS.defaultJson.subSrc = [];  // 先清空

    for (var i = 0, n = viewUrl[_standard].length; i < n; i++) {
      THIS.defaultJson.subSrc.push(viewUrl[_standard][i][key_])
    };

    THIS.subSrcMaxIndex = THIS.defaultJson.subSrc.length - 1;  // 获取最大索引
    THIS.subSrcIndex = 0;  // 初始化当前索引为0

    THIS.choiceClearStatus = choiceClearStatus;  // 可选清晰度
    THIS.currentClearStatus = _standard;  // 当前清晰度

    return {
      currentClearStatus: _standard,  // 上来默认480清晰度
      choiceClearStatus: choiceClearStatus,  // 可选择的清晰度类型
    }

  };  // function initLiveHandleSrc finish;


};  // fetchSrc finish;


// 切换源
WxVideo.prototype.switchSrc = function () {
  var arraySrc = this.defaultJson.subSrc;
  var src;

  if (arguments.length == 1) {
    src = arguments[0];
  } else {
    if (arraySrc <= 1) {
      console.log('current Src length <= 1, so can not switch src')
      return;
    };

    if (this.subSrcIndex >= this.subSrcMaxIndex) {
      this.subSrcIndex = 0;
      this.randomSwitchSrcCount++;
    } else {
      this.subSrcIndex++;
    };

    src = arraySrc[this.subSrcIndex];
  }

  return src;

};  // switchSrc finish;


// 切换清晰度
WxVideo.prototype.switchQualityLevel = function (key_) {
  var data = this.viewUrl[key_];

  if (!data) {
    console.log('no this quality');
    return;
  };

  if (this.defaultJson.type == 'flv') {
    var keyName = 'httpflv_url';
  } else {
    var keyName = 'rtmp_url';
  };

  this.defaultJson.subSrc = [];

  for (var i = 0, n = data.length; i < n; i++) {
    this.defaultJson.subSrc.push(data[i][keyName]);
  };

  this.subSrcMaxIndex = this.defaultJson.subSrc.length - 1;  // 获取最大索引
  this.subSrcIndex = 0;
  this.currentClearStatus = key_;  // 调整新的清晰度

  this.updateLivePlayerSrc(this.switchSrc(this.defaultJson.subSrc[0]));

}


WxVideo.prototype._switchSrc = function () {

  var THIS = this;

  if (!THIS.defaultJson.useApi) {  // 不用接口的切缘
    if (THIS.defaultJson.subSrc.length > 1) {
      THIS.updateLivePlayerSrc(THIS.switchSrc());  // 更换
    } else if (THIS.defaultJson.subSrc.length == 1) {
      THIS.updateLivePlayerSrc(THIS.getSrc())
    } else {
      console.log('subSrc not src to play!')
    }

    return;
  }

  if (THIS.checkToken()) {

    if (THIS.randomSwitchSrcCount >= 2) {  // 轮训超过2次 切到same
      if (THIS.currentClearStatus != 'same') {
        THIS.switchQualityLevel('same');  // 方法体内已经调用了 switchsrc
      }
    } else {
      THIS.updateLivePlayerSrc(THIS.switchSrc());
    }

  } else {

    THIS.fetchSrc({
      qualityStr: THIS.currentClearStatus || '480p',
      callback: function (rs) {
        if (!rs || !rs.currentSrc) return;

        if (THIS.randomSwitchSrcCount >= 2) {  // 轮训超过2次 切到same
          if (THIS.currentClearStatus != 'same') {
            THIS.switchQualityLevel('same');
          }
        } else {
          THIS.updateLivePlayerSrc(THIS.switchSrc());  // 更换
        };
      }
    })
  };

}; // _switchSrc finish;


// bindstatechange 用于 live-player 属性 bindstatechange="bindstatechange"
WxVideo.prototype.bindstatechange = function (detail) {

  if (!detail) {
    console.log('no detail');
    return;
  }
  var _detail = parseInt(detail);
  var THIS = this;

  if (detail == 2105) {

    if (THIS.oldDetail == detail) return;

    if (this.carltonTimer) return;
    console.log('kadun');

    if (this.ttTimer) {  // 卡顿期间关闭时间记录
      clearInterval(this.ttTimer);
      this.ttTimer = null;
    }
    this.stopAllTimer();  // 卡顿期间关闭所有定时任务

    this.carltonCount++;

    this.carltonTimer = setInterval(function () {
      THIS.carltonReplay++;
      THIS.currentCartonTime++;

      if (THIS.currentCartonTime >= THIS.defaultJson.catonChangeSrcMaxTime) {

        THIS._switchSrc();

        THIS.currentCartonTime = 0;
      };

    }, 1000)
    THIS.oldDetail = detail;
  } else {
    if (this.carltonTimer) {
      console.log('kadun huifu')
      clearInterval(this.carltonTimer);
      this.carltonTimer = null;
      this.ttCounter();  //  卡顿恢复 继续记录时间
      this.currentCartonTime = 0;
    };

    if (detail == 2006) {  // 播放结束
      THIS.oldDetail == detail;
      console.log('jieshou')
      this.stopAllTimer();
      // else if 所有错误类
    } else if (detail == 2101 || detail == 2102 || detail == 3001 || detail == 3002 || detail == 3003 || detail == 3005) {
      console.log('yichang', detail);
      THIS.oldDetail = detail;
      THIS.stopAllTimer();
      THIS._liveInfo(THIS, 4001);  // 出现错误进行一次上报
      THIS._switchSrc();
    } else if (detail = 2004) {
      THIS._switchIng = false;  // 正式播放 证明切源过程结束
      if (THIS.oldDetail == detail) {
        return;
      } else {
        console.log('kaibo', detail)
        THIS.startTimer();
        THIS.oldDetail = detail;
      }

    }

  };

};


module.exports = WxVideo;


