import Event from './event.js';

import {EVENTE} from '../api/config.js';

function play() {
  Event.trigger("control", EVENTE.EVENT_PLAY);
}

function pause() {
  Event.trigger("control", EVENTE.EVENT_PAUSE);
}

function seek(second) {
  Event.trigger("control", EVENTE.EVENT_SEEK, second);
}

function fullScreen(typeValue) {
  typeValue = typeValue ? typeValue : 0;
  if (!(typeValue == 0 || typeValue == 90 || typeValue == -90)){
    typeValue = 0;
  }
  Event.trigger("control", EVENTE.EVENT_FULLSCREEN, typeValue);
}

function exitFullScreen() {
  Event.trigger("control", EVENTE.EVENT_EXIT_FULLSCREEN);
}

function awakenVhall(){
  Event.trigger("control", EVENTE.EVENT_AWAKE);
}

function changePlay(msg){
    Event.trigger("control", EVENTE.EVENT_CHANGESOURCE, msg);
}

module.exports = {
  play: play,
  pause: pause,
  seek: seek,
  fullScreen: fullScreen,
  exitFullScreen: exitFullScreen,
  changePlay: changePlay
};