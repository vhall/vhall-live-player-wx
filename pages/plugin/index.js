const Sdk = require('./sdk/sdk.js')
export const Vhall = {
    Event: Sdk.Vhall.Event,
    Player: Sdk.Vhall.Player,
    VideoJs: Sdk.Vhall.VideoJs,
    VhallMain: Sdk.Vhall.VhallMain,
    DrawUtil: Sdk.Vhall.DrawUtil,
    DocHelp: Sdk.Vhall.DocHelp,
    Socket: Sdk.Vhall.Socket
}
export default {
    play: Sdk.default.play,
    seek: Sdk.default.seek,
    pause: Sdk.default.pause,
    fullScreen: Sdk.default.fullScreen,
    exitFullScreen: Sdk.default.exitFullScreen,
    changePlaySource:Sdk.default.changePlaySource,
    setPlaybackRate: Sdk.default.playbackRate,
    playbackRateList: Sdk.default.getPlaybackRate,
    setOptions: Sdk.default.setOptions
}
