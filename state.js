const fs = require('fs');
const mqtt = require('mqtt');

//mqtt client
var client = {};
var config = JSON.parse(fs.readFileSync('/home/gerswin/homekit/config.json'));
//var config = JSON.parse(fs.readFileSync('config.json'));


//our server ip
const serverIP = "192.168.1.20";


//serverIP = add
client = mqtt.connect("mqtt://" + serverIP, { user: 'admin', password: 'public', clientId: 'sonoffserver', protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout: 1000, debug: true });
client.on('connect', function() {
    client.publish("ok", "ok");
});

var devicesDb = require('./db.js');



var knownDevices = []
var windows ="";

function commute(uid, action) {
    console.log("-----------------------")
    console.log(uid, action)

    console.log("-----------------------")

    let cnf = []
    var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
    var dev = devicesDb.find()
    dev.forEach(function(item) {
        if (item.device in configDevices) {
            configDevices[item.device].forEach(function(i, idx) {
                if (uid == i.uid) {
                    console.log("conmmute", i)
                    var d = getDeviceById(i.device);
                    pushMessage({ action: 'update', value: { switch: action }, outlet: i.outlet, target: d.id });
                }
            });
        }
    });
}


function getDeviceById(deviceId) {
    // getDeviceById = (deviceId) => {
    return knownDevices.find(d => d.id == deviceId);
};


updateKnownDevice = (device) => {
    try {
        var updated = false;
        //console.log("-----------------------")
        var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
        //console.log("inex konow",configDevices[device.id])
        // configDevices[device.id].forEach(function(item, idx) {

        //     if ("commute" in item) {
        //         try {
        //             console.log(device.state[0])
        //             commute(item.commute, device.state[0].switch)
        //         } catch (e) {
        //             //console.log(e)
        //         }
        //         //console.log("make conmmute", item.commute,  device.state.switch)

        //     }

        //     //client.publish(item.uid.toString(), state.toString(),{retain});
        //     //client.publish(item.uid.toString() + "/status", JSON.stringify({ state: state }), { qos: 2, retain: true })

        //     //device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
        //     //state.sendUpdate(device);

        // });
        //console.log("-----------------------")
        for (var i = 0; i < knownDevices.length; i++) {
            if (knownDevices[i].id == device.id) {

                if (device.state != undefined) {
                    knownDevices[i] = device;
                    var results = devicesDb.findOne({ 'device': device.id });
                    results.state = device.state;
                    devicesDb.update(results);

                }
                updated = true;
            }
        }
        if (!updated) {
            knownDevices.push(device);
            if (device.hasOwnProperty('state')) {
                devicesDb.insert({ state: device.state, device: device.id, rssi: device.rssi, model: device.model, version: device.version })
            } else {
                devicesDb.insert({ state: [], device: device.id, rssi: device.rssi, model: device.model, version: device.version })
            }

        }
    } catch (e) {
        //console.log(e)
    }

};

sendUpdate = (device) => {
    var updated = false;
    //try {
    var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
    // configDevices[device.id].forEach(function(item, idx) {

    //     let state = device.state[idx].switch == "on" ? true : false
    //     //console.log("update", item)
    //     if ("commute" in item) {
    //         //console.log("make conmmute",item.commute,item.state)
    //         commute(item.commute, item.state)
    //     }

    //     //client.publish(item.uid.toString(), state.toString(),{retain});
    //     //client.publish(item.uid.toString() + "/status", JSON.stringify({ state: state }), { qos: 2, retain: true })

    //     //device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
    //     //state.sendUpdate(device);
    // });
    //} catch (e) {
    // statements
    //     console.log("error", e);
    // }

};

function textSend(start){
    console.log("state text send");
    var millis = Date.now() - start;
    console.log("starting timer...",Date.now());

    console.log("seconds elapsed = " + Math.floor(millis/1000));

}

pushMessage = a => {
    var rq = {
        "apikey": "111111111-1111-1111-1111-111111111111",
        "action": a.action,
        "deviceid": a.target,
        "params": { "switches": [{ "outlet": parseInt(a.outlet), "switch": a.value.switch }] },
        "userAgent": "app",
        "sequence": Date.now().toString(),
        "ts": 0,
        "from": "app"
    };
    //console.log("value of ", a.value)
    //console.log("value of ", a.outlet)
    var results = devicesDb.findOne({ 'device': a.target });
    results.state[a.outlet] = { "outlet": parseInt(a.outlet), "switch": a.value.switch }
    devicesDb.update(results);
    var r = JSON.stringify(rq);
    console.log('REQ | WS | APP | ' + r);
    var device = getDeviceById(a.target);
    if (!device.messages) device.messages = [];
    device.messages.push(rq);
    console.log(r)
    var start = Date.now();

    console.log("starting timer...",start);
    device.conn.sendText(r,textSend(start));

};




module.exports = {
    getDeviceById: getDeviceById,
    pushMessage: pushMessage,
    sendUpdate: sendUpdate,
    updateKnownDevice: updateKnownDevice,
    knownDevices: knownDevices,
    windows:windows
}