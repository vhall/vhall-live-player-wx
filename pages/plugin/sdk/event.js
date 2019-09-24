var clientList = {},
    listen = null,
    trigger = null,
    remove = null;

listen = function(key, fn) {
    if (!clientList[key]) {
        clientList[key] = [];
    }

    clientList[key].push(fn);

};

trigger = function() {
    var arrArgs = Array.prototype.slice.call(arguments),
        key = Array.prototype.shift.call(arrArgs),
        fns = clientList[key];

    if (fns && fns.length >= 0) {

        for (var i = 0, len = fns.length; i < len; i++) {
            fns[i].apply(null, arrArgs);
        }
    }
};

remove = function(key, fn) {
    var fns = clientList[key];

    if (!fns) {
        return false;
    }
    if (!fn) {
        fns && (fns.length = 0); //如果没有传入具体fn就直接取消key对应事件的订阅
    } else {
        for (var l = fns.length - 1; l >= 0; l--) {
            var _fn = fns[l];
            if (_fn === fn) {
                fns.splice(l, 1); //删除订阅者的回调函数
            }
        }
    }
    clientList[key] = fns;
};

var removeAll = function() {
  clientList = [];
};


module.exports = {
    listen: listen,
    trigger: trigger,
    remove: remove,
    removeAll: removeAll
};
