/**
 * sdk 统一入口
 */
import Event from './event.js';
import Login from '../api/login.js';
import {Error} from '../api/config.js';

function init(option) {
  if (typeof option == "undefined") {
    option = {};
    Event.trigger('error',{
      code: '20001',
      msg: Error['20001']
    });
    return console.error("请先阅读文档传入正确参数");
  }
  if (!option.roomid || !option.app_key || !option.signedat || !option.sign || !option.username) {
    Event.trigger('error',{
        code: '20001',
        msg: Error['20001']
    });
    return console.error("有必填项未填");
  }
  var options = {
    account: option.account,
    email: option.email,
    roomid: option.roomid,
    username: option.username,
    app_key: option.app_key,
    signedat: option.signedat,
    sign: option.sign
  };
  return Login.login(options);
}

function getDocs(url) {
  return Login.getDocs(url);
}

module.exports = {
  init: init,
  getDocs: getDocs,
  on: Event.listen,
  remove: Event.remove,
  removeAll: Event.removeAll
};
