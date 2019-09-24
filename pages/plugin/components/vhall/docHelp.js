import Event from '../../sdk/event.js';

function sendDocMsg(arry,time) {
  time = parseInt(time)
  for(let i=0;i<arry.length;i++){
    let item = arry[i];
    if (time == item.updataTime) {
      Event.trigger("flashMsgDoc", item.doc);
      arry.splice(i,1);//删除已经发送的数据，减少性能损耗及重复绘制问题
      i--;
    }
  }
}
function formartDocs(data){
  let arry = [];
  for (let i = 0; i < data.cuepoint.length; i++) {
    let it = data.cuepoint[i];
    let doc = it.content;
    doc = doc.replace(/\\"/g, '"');
    arry.push({
      doc: JSON.parse(doc),
      updataTime: parseInt(it.created_at)
    });
  }
  return arry;
} 

module.exports = {
  formartDocs: formartDocs,
  sendDocMsg: sendDocMsg
};
