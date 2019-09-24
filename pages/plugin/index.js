var Player = require('./sdk/player.js');
import Event from './sdk/event';

module.exports = {
  play: Player.play,
  seek: Player.seek,
  pause: Player.pause,
  fullScreen: Player.fullScreen,
  exitFullScreen: Player.exitFullScreen,
  changePlaySource: Player.changePlay,
  setOptions: function (options) {
    Event.trigger('initVhall',options);
  }
};