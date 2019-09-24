import VhallMain from '../../sdk/vhallMain.js';
import Event from '../../sdk/event.js';
import DrawUtil from '../../sdk/drawUtil.js';
import { timeOut, noloading} from '../../api/config.js';

Component({
  data: {
    canvasId: 'VHALL_canvas_' + new Date().getTime(),
    backgroundImageUrl:'',
    imageUrl:'',
    tempImageUrl:'',
    playStatus:1,
    showtype:false,
    docStatus:false,
    doc:{
      srv: "",
      currStep: "",
      currPage: "1",
      currFile: "",
      totalPage: "",
      whiteBoard: "",
      whiteBoardUrl: ""
    },
    playerRect: {
      width:0,
      heigth:0
    },
    lineWidth:3,
    msgList:[],
    whiteBoardList:[]
  },
  properties: {
    docWidth: { 
      type: Number, 
      value: 375
    }
  },
  attached: function () {
    let _this = this;
    wx.getSystemInfo({
      success: function (res) {
        let h = (res.windowWidth / 1024) * 768;
        _this.setData({
          playerRect: {
            width: res.windowWidth,
            heigth: h
          }
        });
      }
    });
  },
  ready: function () {
    this.cxt = wx.createCanvasContext(this.data.canvasId, this);
    let _this = this;
    Event.trigger('finishDoc', {
      success: function (doc) {
        _this.setData({
          docStatus: doc.show
        });
        if (doc.show==1){ // 此时开启了文档
          _this.triggerEvent("docStatus", {
            type: 1,
            msg: '开启文档'
          });
        }else{
          _this.triggerEvent("docStatus", {
            type: 0,
            msg: '关闭文档'
          });
        }
        if (doc.currFile && doc.currPage){
          let imgUrl = 'https:' + doc.srv + '/' + doc.currFile + '/' + doc.currPage + '.jpg';
          if (doc.whiteBoard==1){/* 开启了白板 */
            _this.setData({
              playStatus: 1,
              doc: doc,
              tempImageUrl: imgUrl,
              showtype: true,
              imageUrl: ''
            });
          }else{
            _this.setData({
              playStatus: 1,
              doc: doc,
              tempImageUrl: imgUrl,
              imageUrl: imgUrl
            });
          }
        }else{
          _this.data.doc.srv = doc.srv;
          _this.setData({
            playStatus: 3,
            backgroundImageUrl: noloading
          });
        }  
      }
    });
    VhallMain.on('flashMsgDoc', (msg) => {
      if (this.data.playStatus == 1) {
        let st = setTimeout(() => {
          clearTimeout(st);
          this.flashMsgDealWith(msg);
        }, timeOut);
      } else if (this.data.playStatus == 3) {
        this.flashMsgDealWith(msg);
      }
    });
  },
  methods: {
    flashMsgDealWith(msg){
      if (msg.type == 'doc_add' || msg.type == 'board_add') {  //画图
        msg.data.matchType = this.data.imageUrl;
        if (this.data.showtype){ //白板绘制数据
          this.data.whiteBoardList.push(msg.data);
        }else{
          this.data.msgList.push(msg.data);
        }
        this.drawCanvas(msg.data);
      } else if (msg.type == 'doc_delAll' || msg.type == "board_delAll") { //清空画布 
        this.eraserCanvas();
      } else if (msg.type == 'doc_del') { //橡皮擦 
        this.eraserCanvas(msg.data.id);  
      } else if (msg.type == 'flipOver') { //翻页 
        this.setData({
          tempImageUrl: 'https:' + this.data.doc.srv + '/' + msg.doc + '/' + msg.page + '.jpg',
          imageUrl: 'https:' + this.data.doc.srv + '/' + msg.doc + '/' + msg.page + '.jpg'
        });
        this.renewDraw();
      } else if (msg.type == 'change_showtype'){ //改变展示状态 
        if (msg.showType==0){ //关闭白板
          this.setData({
            showtype:false,
            imageUrl: this.data.tempImageUrl
          });
          
        } else if (msg.showType == 1) {//开启白板
          this.setData({
            showtype: true,
            imageUrl:''
          });
        }
        this.renewDraw();
      } else if (msg.type == '*watchDisplay') { //开启关闭文档
        this.setData({
          docStatus: msg.status
        });
        if (msg.status == 0) {
          this.triggerEvent("docStatus", {
            type: 0,
            msg: '关闭文档'
          });
        } else if (msg.status == 1) {
          this.triggerEvent("docStatus", {
            type: 1,
            msg: '开启文档'
          });
          this.renewDraw();
        }
      }else if (msg.type == 'board_init') { //初始化画板
        
      } 
    },
    renewDraw(){ //重新绘制
      DrawUtil.clearDraw(this.cxt, [0, 0, this.data.docWidth, 1000]);
      let drawDataList = [];
      if (this.data.showtype == 0) { //关闭白板
        drawDataList = this.data.msgList;
      }else{
        drawDataList = this.data.whiteBoardList;
      }
      drawDataList.forEach((item) => {
        if (item.matchType == this.data.imageUrl){
          this.drawWith(item);
        }
      });
    },
    eraserCanvas(msgId){
      let drawDataList = [];
      if (this.data.showtype == 0) { //关闭白板
        drawDataList = this.data.msgList;
      } else {
        drawDataList = this.data.whiteBoardList;
      }
      let temMsgList = [];
      drawDataList.forEach((item) => {
        if (msgId) { /* 橡皮擦擦除 */
          if (item.matchType == this.data.imageUrl) {
            if (msgId != item.id) {
              temMsgList.push(item);
            }
          }else{
            temMsgList.push(item);
          } 
        } else if (item.matchType !== this.data.imageUrl) { /* 清空当前画板 */
          temMsgList.push(item);
        }
      });
      if (this.data.showtype == 0) { //关闭白板
        this.data.msgList = temMsgList;
      } else {
        this.data.whiteBoardList = temMsgList;
      }
      this.renewDraw();
    }, 
    drawCanvas(data){
      this.setData({
        lineWidth: (data.lineSize ? data.lineSize:this.data.lineWidth)
      });
      data.ratio = this.data.docWidth / data.p_w;
      data.lineWidth = this.data.lineWidth;
      this.drawWith(data);
    },
    drawWith(data){
      //let systemInfo = wx.getStorageSync("systemInfo");
      let ratio = (data.ratio ? data.ratio : this.data.docWidth / 1024);
      data.ratio = ratio;
      if (data.type == 1) { //画线
        DrawUtil.drawLine(this.cxt, {
          color: data.color,
          lineWidth: data.lineWidth,
          data: data.points,
          ratio: ratio
        });
      } else if (data.type == 20 || data.type == 21) { //画圆
        DrawUtil.drawEllipse(this.cxt, data);
      } else if (data.type == 22) { //矩形
        DrawUtil.drawRect(this.cxt, data);
      } else if (data.type == 4) { //写字
        DrawUtil.drawText(this.cxt, data);
      } else if (data.type == 31 || data.type == 30) { //画箭头线
        DrawUtil.drawArrow(this.cxt, data);
      } else if (data.type == 7) { //画锚点
        DrawUtil.drawAnchor(this.cxt, data);
      }
    },
    errorShow(e){
      let url = 'https:' + this.data.doc.srv.replace('document', 'static/img/mobile/doc_error.png');
      this.setData({
        backgroundImageUrl: url
      });
    }
  }
})