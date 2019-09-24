const colors = {
  c14090412: 'rgba(215,0,172,.8)',
  c26584: 'rgba(0,103,216,.8)',
  c50973: 'rgba(0,199,29,.8)',
  c16762624: 'rgba(255,199,0,.8)',
  c16646400: 'rgba(254,1,0,.8)',
  c0: 'rgba(0,0,0,.8)',
  cf: 'rgba(0,0,0,0)'
};
let lineWidth = 4;
/* 画线 */
function drawLine(cxt,option) {
  cxt.setStrokeStyle(colors['c'+option.color]);
  cxt.setLineWidth(option.lineWidth * option.ratio);
  cxt.setLineCap('round');
  cxt.moveTo(option.data[0][0] * option.ratio, option.data[0][1] * option.ratio);
  for (let i = 0; i < option.data.length;i++){
    let point = option.data[i];
    cxt.lineTo(point[0] * option.ratio, point[1] * option.ratio);
  }
  cxt.stroke();
  cxt.draw(true);
}
/* 画圆 */
function drawEllipse(cxt, option) {
  var op = option;
  var sx = 0;
  var sy = 0;
  var xr = 0;
  var yr = 0;
  if (op.type === 20) {
    //椭圆
    xr = (op.tPoint[0] - op.sPoint[0]) / 2 * op.ratio;
    yr = (op.tPoint[1] - op.sPoint[1]) / 2 * op.ratio;
  } else if (op.type === 21) {
    //正圆
    xr = yr = (Math.abs(op.tPoint[0] - op.sPoint[0]) > Math.abs(op.tPoint[1] - op.sPoint[1]) ? op.tPoint[1] - op.sPoint[1] : op.tPoint[0] - op.sPoint[0]) / 2 * op.ratio;
  }
  sx = op.sPoint[0] * op.ratio + xr;
  sy = op.sPoint[1] * op.ratio + yr;
  let r = (xr + yr)/2;
  cxt.arc(sx, sy, r, 0, 2 * Math.PI, true);
  cxt.setStrokeStyle(colors['c' + option.color]);
  cxt.setLineWidth(option.lineWidth * option.ratio);
  cxt.stroke();
  cxt.draw(true);
}

/* 画矩形 */
function drawRect(cxt, data) {
  var op = data;
  cxt.setStrokeStyle(colors['c' + op.color]);
  cxt.setLineWidth(data.lineWidth * op.ratio);
  cxt.strokeRect(op.sPoint[0] * op.ratio, op.sPoint[1] * op.ratio, (op.tPoint[0] - op.sPoint[0]) * op.ratio, (op.tPoint[1] - op.sPoint[1]) * op.ratio);
  cxt.draw(true);
}

/* 写字 */
function drawText(cxt, data) {
  var op = data;
  var fontStyle = "";
  if (op.fi === 1) {
    fontStyle += "italic ";
  }
  if (op.fb === 1) {
    fontStyle += "bold ";
  }
  fontStyle += op.fs * op.ratio + "px 'Microsoft YaHei'";
  cxt.font = fontStyle;
  cxt.setFontSize(op.fs);
  cxt.setFillStyle(colors['c' + op.color]);
  cxt.fillText(unescape(op.ft), op.sPoint[0]*op.ratio, op.sPoint[1]*op.ratio);
  cxt.draw(true);
}

/* 画双箭头线 */
function drawArrow(cxt, data) {
  var ctx = cxt;
  var op = data;
  var fromX = op.sPoint[0] * data.ratio;
  var fromY = op.sPoint[1] * data.ratio;
  var toX = op.tPoint[0] * data.ratio;
  var toY = op.tPoint[1] * data.ratio;
  var theta = 30,
    headlen = 5,
    color = colors['c' + op.color],
    angle = Math.atan2(fromY - toY, fromX - toX) * 180 / Math.PI,
    angle1 = (angle + theta) * Math.PI / 180,
    angle2 = (angle - theta) * Math.PI / 180,
    topX = headlen * Math.cos(angle1),
    topY = headlen * Math.sin(angle1),
    botX = headlen * Math.cos(angle2),
    botY = headlen * Math.sin(angle2);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  if (op.type === 31) {
    var arrowX = fromX - topX;
    var arrowY = fromY - topY;
    ctx.moveTo(arrowX, arrowY);
    ctx.lineTo(fromX, fromY);
    var arrowX0 = fromX - botX;
    var arrowY0 = fromY - botY;
    ctx.lineTo(arrowX0, arrowY0);
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
  }
  var arrowX1 = toX + topX;
  var arrowY1 = toY + topY;
  ctx.moveTo(arrowX1, arrowY1);
  ctx.lineTo(toX, toY);
  var arrowX2 = toX + botX;
  var arrowY2 = toY + botY;
  ctx.lineTo(arrowX2, arrowY2);

  ctx.setFillStyle(color)
  ctx.setStrokeStyle(color);
  ctx.setLineWidth(2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  cxt.draw(true);
}

/* 画锚点 */
function drawAnchor(cxt, data) {
  var ctx = cxt;
  var op = data;
  var r = 10 * op.ratio;
  ctx.fillStyle = colors['c' + op.color];
  ctx.setFillStyle(colors['c' + op.color]);
  var sx = op.sPoint[0] * op.ratio;
  var sy = op.sPoint[1] * op.ratio
  ctx.beginPath();
  ctx.arc(sx + r, sy + r, r, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(sx, sy + r + 2);
  ctx.lineTo(sx + r * 2, sy + r + 2);
  ctx.lineTo(sx + r, sy + r * 3);
  ctx.closePath();
  ctx.fill();
  ctx.setFillStyle(colors['cf']);
  ctx.beginPath();
  ctx.arc(sx + r, sy + r, r * 0.55, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
  cxt.draw(true);
}

/* 清除画布 */
function clearDraw(cxt,rect) {
  if(rect.length!=4){
    console.error('clearDraw传入参数不正确!');
    return;
  }
  cxt.clearRect(rect[0], rect[1], rect[2], rect[3]);
  cxt.draw();
}

module.exports = {
  drawLine: drawLine,
  drawEllipse: drawEllipse,
  drawRect: drawRect,
  drawText: drawText,
  drawArrow: drawArrow,
  drawAnchor: drawAnchor,
  clearDraw: clearDraw
};
