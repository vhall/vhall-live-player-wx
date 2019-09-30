import myPlugin from '../plugin/index.js';
Page({
  data: {
    definitionsKey: {
      'same': '原画',
      '720p': '超清',
      '480p': '高清',
      '360p': '标清',
      'a': '纯音频'
    },
    showPlayRate: true,
    playRateList: [],
    msg: '',
    timeMsg: '',
    currentTime: '0',
    screenStatus: '',
    showSource:false,
    showLine:false,
    options: {
      roomid: '',
      account: '',
      username: '',
      app_key: '',
      signedat: '',
      sign: ''
    },
    selectType: 'doc',
    videoUrl:'',
    showTool: false,
    docWidth: 375,
    playInfo: {
      sourceInfo: {
        lineTypes: ['线路1', '线路2'],
        qualiTypes: ['same', 'a', '720p', '480p' , '360p']
      },
      currentLineIndex:0,
      currentQuality:'same'
    }
  },
  playStatus(msg){
    console.log('---------------当前播放状态---------------');
    console.log(msg.detail);
  },
  closeChangeType(){
    this.setData({
      showSource: false,
      showLine: false
    });
  },
  changeQualiTypes(){
    this.setData({
      showSource: !this.data.showSource,
      showLine: false
    });
  },
  changeLineTypes(){
    this.setData({
      showLine: !this.data.showLine,
      showSource: false
    });
  },
  changePlayRate(){
      this.setData({
          playRateList: myPlugin.playbackRateList,
          showPlayRate: true
      });
  },
  selectPlayRate(e){
      this.setData({
          showPlayRate: false
      });
      myPlugin.setPlaybackRate(e.target.dataset.type);
  },
  selectQualiTypes(e){
    let playInfo = this.data.playInfo;
    playInfo.currentQuality = e.target.dataset.type;
    this.setData({
      showSource: !this.data.showSource,
      playInfo: playInfo
    });
    myPlugin.changePlaySource({
      currentQuality: e.target.dataset.type
    });
  },
  selectLine(e) {
    let playInfo = this.data.playInfo;
    playInfo.currentLineIndex = e.target.dataset.type;
    this.setData({
      showLine: !this.data.showLine,
      playInfo: playInfo
    });
    myPlugin.changePlaySource({
      currentLineIndex: e.target.dataset.type
    });
  },
  selectMenu(e) {
    this.setData({
      selectType: e.target.dataset.type
    });
    this.mathWidth();
  },
  getPlaySource(source){
    let playInfo = source.detail;
    playInfo.sourceInfo.qualiTypes.sort().reverse();
    this.setData({
      playInfo: playInfo
    });
    this.setData({
      msg: JSON.stringify(playInfo)
    });
  },
  bindPlay() {
    myPlugin.play();
  },
  bindPause() {
    myPlugin.pause();
  },
  bindSeekTo() {
    myPlugin.seek(30);
  },
  bindFullScreen() {
    //myPlugin.fullScreen();/* 参数选填 0，90，-90,默认为0 */
    myPlugin.fullScreen(90);
  },
  bindExitFullScreen() {
    this.setData({
      screenStatus: ''
    });
    myPlugin.exitFullScreen();
  },
  changeDocStatus(msg){
    console.log(msg.detail);
    wx.showToast({
      title: msg.detail.msg,
      icon: 'none',
      duration: 2000
    });
  },
  onGetMessage(msg) {
    console.log('收到sdk通知消息');
    console.log(msg.detail);
    this.setData({
      msg: JSON.stringify(msg.detail)
    });
    let contentMsg = '';
    switch (msg.detail.type) {
      case 'start':
        contentMsg = '直播开始,进入直播';
        break;
      case 'over':
        contentMsg = '直播结束';
        break;
      case 'kickout':
        contentMsg = '直播被踢出';
        break;
      case 'kickoutRestore':
        contentMsg = '恢复踢出';
        break;
    }
    let _this = this;
    wx.showModal({
      title: '提示',
      content: contentMsg,
      success: function (res) {
        if (res.confirm) {
          console.log('用户点击确定');
          if (msg.detail.type =='start'){
            myPlugin.setOptions(_this.data.options);
          }
        } else if (res.cancel) {
          console.log('用户点击取消')
        }
      }
    })
  },
  errorFn(e) {
    console.error(e.detail);
    wx.showToast({
      title: e.detail.msg,
      icon: 'none',
      duration: 2000
    });
    this.setData({
      msg: JSON.stringify(e.detail)
    });
  },
  screenChange(e) {
    console.log(e.detail);
    this.setData({
      msg: JSON.stringify(e.detail)
    });
  },
  waiting(e) {
    /* 直播时不会调用此函数 */
    this.setData({
      msg: JSON.stringify(e.detail)
    });
  },
  playUpdate(e) {
    /* 播放进度变化时触发, 直播时不会调用此函数 */
    this.setData({
      currentTime: e.detail.currentTime,
      timeMsg: JSON.stringify(e.detail)
    });
  },
  onLoad(option) {
    console.log(option);
    this.setData({
      options:option
    });
  },
  mathWidth(){
    /* 计算容器的宽度 */
    wx.createSelectorQuery().select('#docId').boundingClientRect((rect) => {
      console.log(rect.width);
      this.setData({
        docWidth: rect.width
      });
    }).exec();
  },
  onReady() {
    myPlugin.setOptions(this.data.options);
    this.mathWidth();
  }
});
