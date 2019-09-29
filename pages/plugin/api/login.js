import Http from './http.js';

function login(options) {
  var _pars = {
    roomid: options.roomid,
    account: options.account,
    username: options.username,
    app_key: options.app_key,
    signedat: options.signedat,
    sign: options.sign
  };
  return Http.reqGet("api/miniprogram/v1/webinar/init", _pars);
}

function getDocs(url) {
  return Http.reqGet('https:'+url);
}

export default {
  login: login,
  getDocs: getDocs
};
