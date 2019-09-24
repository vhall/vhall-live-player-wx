import Config from './config.js';
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
  // if (options.email) {
  //   _pars.email = options.email;
  // }
  // return Http.reqGet("api/jssdk/v1/webinar/init", _pars);
    return Http.reqGet("api/miniprogram/v1/webinar/init", _pars);
}

function getDocs(url) {
  return Http.reqGet('https:'+url);
}

module.exports = {
  login: login,
  getDocs: getDocs
};
