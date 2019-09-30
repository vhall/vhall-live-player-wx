const V_EVENTE = {
  EVENT_PLAY: 'play',
  EVENT_PAUSE: 'pause',
  EVENT_SEEK: 'seek',
  EVENT_FULLSCREEN: 'fullScreen',
  EVENT_EXIT_FULLSCREEN:'exitFullScreen',
  EVENT_AWAKE: 'awakeUp',
  EVENT_CHANGESOURCE: 'changeSource',
  EVENT_BACKRATE: 'playbackRate'
};

const ErrorCode ={
    "10000": "消息体格式不正确",
    "10001": "输入不能为空",
    "10002": "当前用户被禁言",
    "10003": "聊天输入不能超过140个字符",
    "10004": "当前已开启全员禁言",
    "10005": "当前活动不在直播",
    "10006": "当前活动未开启问答",
    "10007": "当前用户被踢出",
    "20000": "接口请求成功",
    "20001": "验证信息不正确",
    "20002": "回放状态，暂未开放...",
    "20003": "接口请求失败",
    "20004": "活动不存在",
    "30000": "准备就绪",
    "40000": "视频或者音频解析错误:开发工具不支持播放格式，请使用微信扫一扫!",
    "40001": "直播中不能seek",
    "40002": "视频等待缓冲中...",
    "50400": "用户身份认证错误",
    "50401": "用户发送消息频次超过限制",
    "50402": "活动xxx发送消息频次超过限制",
    "50403": "自定义广播消息内容长度超过限制"
};
export const EVENTE = V_EVENTE;
export const Error = ErrorCode;
export const timeOut = 10000;
export const vhall = 'https://t.e.vhall.com/'; /* 接口地址 */
export const pushLogUrl = 'https://la.e.vhall.com/login'; /* 日志上报地址 */
export const videoDefault = 'https://cnstatic01.e.vhall.com/static/img/v35-webinar.png'; /* 播放占位图片 */
export const noloading = 'https://cnstatic01.e.vhall.com/static/img/mobile/doc_noloading.png'; /* 文档占位图片 */
