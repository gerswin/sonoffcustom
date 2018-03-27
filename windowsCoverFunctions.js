var windowCovers = require('./windowsCoverConfig.js');
var state = require("./state.js");

function goUp(device, uid) {
    state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 1, target: device });
    state.pushMessage({ action: 'update', value: { switch: "on" }, outlet: 0, target: device });
    setTimeout(function() {
        state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 1, target: device });
        state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 0, target: device });
        windowCovers[uid].runing = false;
    }, 60 * 1000);
}

function goDown(device, uid) {
    state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 0, target: device });
    state.pushMessage({ action: 'update', value: { switch: "on" }, outlet: 1, target: device });
    setTimeout(function() {
        state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 1, target: device });
        state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 0, target: device });
        windowCovers[uid].runing = false;
    }, 60 * 1000);
}

function getTime(percent, state, device, uid, outlet) {
    console.log("percent", percent)
    windowCovers[uid].runing = false;
    if (percent > 50) {
        console.log("go up")
        goUp(device, uid)
    } else if (percent < 50) {
        goDown(device, uid)
        console.log("go down")
    } else {
        console.log("to do");
    }
}

module.exports = {
    //setState: setState,
    //runDirection: runDirection,
    getTime: getTime
}