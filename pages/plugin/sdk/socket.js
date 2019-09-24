import Event from './event.js';
import {Error} from '../api/config.js';

const io = require('./weapp.socket.io.js')

let count = 0;
var socketObject = {
    init: function(options) {
      this.options = options;
      let url = 'wss://' + options.socketSrv + '?app=vhall&token=' + options.socketToken + '&transport=websocket&_=' + new Date().getTime();
      let socket = io(url);
      // socket.on('open', (data) => {
      //   fn('open');
      // });
      // socket.on('connect', (data) => {
      //   fn('connect');
      // });
      // socket.on('close', (data) => {
      //   fn('close');
      // });
      socket.open();
      socket.on('flashMsg', (msg)=> {
        msg = this.transData(msg);
        Event.trigger("flashMsgDoc", msg);
        //fn(msg);
      });
      socket.on('cmd', (msg)=> {
        msg = this.transData(msg);
        if (msg.type == '*watchDisplay') {
          Event.trigger("flashMsgDoc", msg);
        } else {
          Event.trigger("cmdMsg", msg);
        }
      });
      socket.on('online', (msg)=> {
        msg = this.transData(msg);
        Event.trigger("onlineMsg", msg);
      });
      wx.onNetworkStatusChange((res)=>{
        if (res.isConnected && socket) {
          socket.open();
        }
      });
      return socket;
    },
    transData:function(msg){
      if (typeof msg == 'string'){
        msg = JSON.parse(msg);
      }
      return msg;
    }
};

module.exports = socketObject;