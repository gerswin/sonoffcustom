var windowCovers = require('./windowsCoverConfig.js');
var state = require("./state.js");

function setState(device, uid, outlet, action) {
    var d = state.getDeviceById(device);

    if (!d) {
        console.log(('Sonoff device ' + device + ' not found'))
        return ('Sonoff device ' + device + ' not found');
    } else {


        //state.pushMessage({ action: 'update', value: { switch: req.params.state }, target: d.id });
        state.pushMessage({ action: 'update', value: { switch: action }, outlet: outlet, target: d.id });
        console.log({ action: 'update', value: { switch: action }, outlet: outlet, target: d.id });

        //device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
        //state.sendUpdate(device);
        return ({ "status": true })

    }
}

function runDirection(direction, runTime, device, uid, outlet) {
    runTime = Math.abs(runTime)
    var d = state.getDeviceById(device);
    var way = (direction) ? "0" : "1";
    console.log("way", way, "runtime", runTime, "isRF", windowCovers[uid].rf, "state", windowCovers[uid].windowState, "old", windowCovers[uid].oldwindowState)
    if (!windowCovers[uid].rf) {
        //setState(device, uid, way, "on")
        state.pushMessage({ action: 'update', value: { switch: "on" }, outlet: way, target: d.id });

        setTimeout(function() {
            //setState(device, uid, way, "off")
            state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: way, target: d.id });
            windowCovers[uid].runing = false;
            if (windowCovers[uid].lastValue != windowCovers[uid].windowState) {
                console.log("RunFix", "lastValue", windowCovers[uid].lastValue, "currentState", windowCovers[uid].windowState);
                getTime(windowCovers[uid].lastValue, windowCovers[uid].windowState, device, uid, outlet)
            }
        }, runTime);
    } else {
        var resetTime = (direction == 0) ? windowCovers[uid].timeUp : windowCovers[uid].timeDown;
        console.log("reset time", resetTime)
        var start = Date.now();

        setState(device, uid, 0, "on")
        setTimeout(function() {
            setState(device, uid, 0, "off")
            console.log("set", device, uid, way, "on")
            setState(device, uid, way, "on")
            setTimeout(function() {
                var millis = Date.now() - start;
                console.log("seconds elapsed = " + Math.floor(millis / 1000));
                console.log("set off", device, uid, way, "on")

                setState(device, uid, way, "off")
                windowCovers[uid].runing = false;
            }, runTime);
        }, (resetTime * 1000));
    }
}

function getTime(percent, state, device, uid, outlet) {
    windowCovers[uid].oldwindowState = percent;
    windowCovers[uid].runing = true;
    if (!windowCovers[uid].rf) {
        if (windowCovers[uid].windowState > percent) {
            let diff = (windowCovers[uid].windowState - percent)
            let runTime = ((windowCovers[uid].timeDown * diff) / 100) * 1000;
            runDirection(false, runTime, device, uid, 1);
        } else {
            let diff = (windowCovers[uid].windowState - percent)
            let runTime = ((windowCovers[uid].timeUp * diff) / 100) * 1000;
            runDirection(true, runTime, device, uid, 0);
        }
    } else {
        //var d = state.getDeviceById(device);
        if (percent == 0) {
            console.log(percent)
            state.pushMessage({ action: 'update', value: { switch: "on" }, outlet: 1, target: device });

            setTimeout(function() {
                state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 1, target: device });
            }, (50 * 1000));

            return
        }
        if (percent == 100) {
            console.log(percent)

            state.pushMessage({ action: 'update', value: { switch: "on" }, outlet: 0, target: device });

            setTimeout(function() {
                state.pushMessage({ action: 'update', value: { switch: "off" }, outlet: 0, target: device });
            }, (50 * 1000));
            return
        }
        setTimeout(function() {
            if (percent > 50) {
                let runTime = ((windowCovers[uid].timeUp * windowCovers[uid].lastValue) / 100) * 1000;
                runDirection(true, runTime, device, uid, 0);
            } else {
                let runTime = ((windowCovers[uid].timeDown * windowCovers[uid].lastValue) / 100) * 1000;
                runDirection(false, runTime, device, uid, 1);
            }
        }, 5000);
    }
    windowCovers[uid].windowState = percent;
}

module.exports = {
    setState: setState,
    runDirection: runDirection,
    getTime: getTime
}