const mqtt = require('mqtt');
const spawn = require('child_process').spawn;
const dns = require('dns');
const axios = require('axios');
const path = require('path');

//const ws = require("nodejs-websocket");
const fs = require('fs');
// ----------- https server ------------------------
// Import libraries
const express = require('express');
const server = express();
const bodyParser = require('body-parser')
const https = require('https');
const http = require('http');
var windowCovers = require('./windowsCoverConfig.js');

var windowsFunc = require("./windowsCoverFunctions.js");
var state = require("./state.js");

var devicesDb = require('./db.js');
var ws = require('./ws.js');

var config = JSON.parse(fs.readFileSync('/home/gerswin/homekit/config.json'));
//var config = JSON.parse(fs.readFileSync('config.json'));


//our server ip
const serverIP = "192.168.1.20";


//mqtt client
var client = {};


//serverIP = add
client = mqtt.connect("mqtt://" + serverIP, { user: 'admin', password: 'public', clientId: 'sonoffserver', protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout: 1000, debug: true });
client.on('connect', function() {
    client.publish("ok", "ok");
});


//set initialized parameters


// device in der liste finden
function conmmute(uid, action) {
    let cnf = []
    var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
    var dev = devicesDb.find()
    dev.forEach(function(item) {
        if (item.device in configDevices) {
            configDevices[item.device].forEach(function(i, idx) {
                if (uid == i.uid) {
                    console.log("conmmute", i)
                    var d = state.getDeviceById(i.device);
                    pushMessage({ action: 'update', value: { switch: action }, outlet: i.outlet, target: d.id });
                }
            });
        }
    });
}

// Register body-parser
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// Create https server & run
https.createServer({
    key: fs.readFileSync('./certs/66805011.key'),
    cert: fs.readFileSync('./certs/66805011.cert')
}, server).listen(config.server.httpsPort, function() {
    //console.log('SONOFF API Server Started On Port %d', config.server.httpsPort);
});


// server.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/static/index.html'));
// });

server.use('/', express.static('static'))

server.get('/configDevice', function(req, res) {
    let out = fs.openSync('./out.log', 'a');
    let err = fs.openSync('./out.log', 'a');

    spawn('node', ['setupdevice.js'], {
        stdio: ['ignore', out, err], // piping stdout and stderr to out.log
        detached: true
    }).unref();

    res.json({ "status": true }); // echo the result back

});


server.get('/homekit', function(req, res) {
    ind = 1
    try {
        let cnf = []
        var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
        var dev = devicesDb.find()
        dev.forEach(function(item) {
            if (item.device in configDevices) {
                configDevices[item.device].forEach(function(i, idx) {
                    i['state'] = (item.state[idx].switch == 'on') ? true : false
                    ind = ind + 1
                    i['intID'] = ind
                    cnf.push(i)
                });
            }
        });
        Object.keys(configDevices).forEach(function(item) {
            if (configDevices[item][0].type == "mqtt") {
                cnf.push(configDevices[item][0])
            }
        });

        res.json(cnf); // echo the result back
    } catch (error) {
        //throw error
        res.json({ "status": false, error: error }); // echo the result back

    }

});


server.get('/homeb', function(req, res) {
    try {
        let cnf = []
        var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
        var dev = devicesDb.find()
        dev.forEach(function(item) {
            if (item.device in configDevices) {
                configDevices[item.device].forEach(function(a, idx) {
                    cnf.push({
                        accessory: "http-switch",
                        name: a.name,
                        checkStatus: "polling",
                        pollingInterval: 10000,
                        statusUrl: "http://192.168.1.20:1081/status/" + a.uid,
                        statusRegex: "state:true",
                        onUrl: "http://192.168.1.20:1081/status/" + a.uid + "/on",
                        offUrl:"http://192.168.1.20:1081/status/" + a.uid + "/off",
                        httpMethod: "GET"
                    })
                });
            }
        });

        res.json(cnf); // echo the result back
    } catch (error) {
        //throw error
        res.json({ "status": false, error: error }); // echo the result back

    }

});
server.get('/loki', function(req, res) {
    res.json(devicesDb.find())


});
server.get('/windows/:device/:uid/:outlet/set/:value', function(req, res) {
    // var d = state.getDeviceById(req.params.deviceId);


    //lastValue = req.params.value
    let runing = windowCovers[req.params.uid].runing
    let windowState = windowCovers[req.params.uid].windowState
    windowCovers[req.params.uid].lastValue = req.params.value

    if (!runing) {
        windowsFunc.getTime(req.params.value, windowState, req.params.device, req.params.uid, req.params.outlet);
    } else {
        console.log("rin")
    }
    res.json(req.params)


});
server.get('/status/:uid/:action', function(req, res) {
    conmmute(req.params.uid, req.params.action)

    res.json({ "state": req.params.action }); // echo the result back
});
server.get('/status/:uid', function(req, res) {
    //conmmute(req.params.uid,req.params.action)
    try {
        let cnf = []
        var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
        var dev = devicesDb.find()
        dev.forEach(function(item) {
            if (item.device in configDevices) {
                configDevices[item.device].forEach(function(i, idx) {
                    i['state'] = (item.state[idx].switch == 'on') ? true : false
                    if (i.uid == req.params.uid) {
                        cnf.push(i)
                    }

                });
            }
        });


        res.send("state:"+cnf[0].state); // echo the result back
    } catch (error) {
        //throw error
        res.json({ "status": false, error: error }); // echo the result back

    }
});
server.post('/savecnf', function(req, res) {
    let configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
    console.log(serverIP)
    let cnf = req.body
    Object.keys(req.body).forEach(function(item) {
        console.log()
        if (cnf[item][0].type == "mqtt") {
            let url = "http://" + cnf[item][0].device + "/sv?w=5&r=1&p1=********&b1=on&a1=" + cnf[item][0].name + "&b2=0"
            axios.get(url)
                .then(function(response) {
                    console.log(response);
                })
                .catch(function(error) {
                    console.log(error);
                });

            url = "http://" + cnf[item][0].device + "/sv?w=2&r=1&mh=" + serverIP + "&ml=1883&mc=" + cnf[item][0].name + "_DVES_%2506X&mu=admin&mp=public&mt=" + cnf[item][0].uid + "&mf=%25topic%25%2F%25prefix%25%2F"
            axios.get(url)
                .then(function(response) {
                    console.log(response);
                })
                .catch(function(error) {
                    console.log(error);
                });


        }
        configDevices[item] = cnf[item]



    });
    //console.log(config)
    var body = '';

    fs.writeFile('static/devices.json', JSON.stringify(configDevices), (err) => {
        // throws an error, you could also catch it here
        if (err) throw err;

        // success case, the file was saved
        //     console.log('Lyric saved!');
    });
    // req.on('close', function (){
    //     //console.log("emd")
    //     fs.appendFile(filePath, body, function() {
    //         res.end();
    //     });
    // });
    //console.log(req.body); // your JSON

    res.send(req.body); // echo the result back
});

// Create https server & run
http.createServer(server).listen(config.server.httpPort, function() {
    console.log('API Server Started On Port %d', config.server.httpPort);
});

// Register routes
server.post('/dispatch/device', function(req, res) {
    //console.log('REQ | %s | %s ', req.method, req.url);
    //console.log('REQ | %s', JSON.stringify(req.body));

    res.json({
        "error": 0,
        "reason": "ok",
        "IP": serverIP,
        "port": config.server.websocketPort
    });
});

//switch the device via postman (https) <= does not work from browser!!
server.get('/devices/:deviceId/:uid/:outlet/:state', function(req, res) {

    console.log('GET | %s | %s ', req.method, req.params);
    var d = state.getDeviceById(req.params.deviceId);
    if (!d) {
        res.status(404).send('Sonoff device ' + req.params.deviceId + ' not found');
    } else {
        res.json({ "status": false }); // echo the result back


        //state.pushMessage({ action: 'update', value: { switch: req.params.state }, target: d.id });
        state.pushMessage({ uid: req.params.uid, action: 'update', value: { switch: req.params.state }, outlet: req.params.outlet, target: d.id });
        //device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
        //state.sendUpdate(device);

    }
});

server.get('/v2/devices/:deviceId/:outlet/:state/:type', function(req, res) {

    //console.log('GET | %s | %s ', req.method, req.url);
    if (req.params.type == "sonoff") {
        var d = state.getDeviceById(req.params.deviceId);
        if (!d) {
            res.status(404).send('Sonoff device ' + req.params.deviceId + ' not found');
        } else {
            res.json({ "status": true }); // echo the result back


            //state.pushMessage({ action: 'update', value: { switch: req.params.state }, target: d.id });
            state.pushMessage({ action: 'update', value: { switch: req.params.state }, outlet: req.params.outlet, target: d.id });
            //device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
            //state.sendUpdate(device);

        }
    }
    if (req.params.type == "mqtt") {

        res.json({ "status": true, "type": req.params.type }); // echo the result back

        console.log("cmd", req.params.deviceId + "/cmnd/POWER", req.params.state)
        //state.pushMessage({ action: 'update', value: { switch: req.params.state }, target: d.id });
        client.publish(req.params.deviceId + "/cmnd/POWER", req.params.state);

        //device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
        //state.sendUpdate(device);


    }

});



//get a list of known devices via postman (https) <= does not work from browser!!
server.get('/devices/:deviceId', function(req, res) {
    //console.log('GET | %s | %s ', req.method, req.url);
    var d = state.getDeviceById(req.params.deviceId);
    if (!d) {
        res.status(404).send('Sonoff device ' + req.params.deviceId + ' not found');
    } else {
        res.json({ id: d.id, state: d.state, model: d.model, kind: d.kind, version: d.version });
    }
});


//get a list of known devices via postman (https) <= does not work from browser!!
server.get('/devicesmqtt', function(req, res) {
    var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));
    axios.get('http://localhost:1082')
        .then(function(response) {
            //res.json(response.data)
            res.json(response.data.map(x => { return { id: x.id, name: x.name, register: (x.name in configDevices ? true : false), type: x.type } }));

        })
        .catch(function(error) {
            console.log(error);
        });

    //console.log('GET | %s | %s ', req.method, req.url);
    // res.json(state.knownDevices.map(x => { return { id: x.id, rssi: x.rssi, mac: x.mac, register: (x.id in configDevices ? true : false), state: x.state, model: x.model, kind: x.kind, version: x.version, type: "sonoff" } }));
});
// -

//get a list of known devices via postman (https) <= does not work from browser!!
server.get('/devices', function(req, res) {
    var configDevices = JSON.parse(fs.readFileSync('./static/devices.json'));

    //console.log('GET | %s | %s ', req.method, req.url);
    res.json(state.knownDevices.map(x => { return { id: x.id, rssi: x.rssi, mac: x.mac, register: (x.id in configDevices ? true : false), state: x.state, model: x.model, kind: x.kind, version: x.version, type: "sonoff" } }));
});
// ----------- https server ------------------------

// setup a server, that will res to the SONOFF reqs
// this is the replacement for the SONOFF cloud!
ws.listen(config.server.websocketPort, serverIP);