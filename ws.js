const ws = require("nodejs-websocket");
const fs = require('fs');
const serverIP = "192.168.1.20";
var config = JSON.parse(fs.readFileSync('/home/gerswin/homekit/config.json'));
var state = require("./state.js");

var wsOptions = {
    secure: true,
    key: fs.readFileSync('./certs/66805011.key'),
    cert: fs.readFileSync('./certs/66805011.cert'),
};
function textSend(){
    //console.log("text send");
}
//console.log("ws")
module.exports =  ws.createServer(wsOptions, function(conn) {
    //console.log("WS | Server is up %s:%s to %s:%s", serverIP, config.server.websocketPort, conn.socket.remoteAddress, conn.socket.remotePort);
    conn.on("text", function(str) {
        var data = JSON.parse(str);
        ////console.log('REQ | WS | DEV | %s', JSON.stringify(data));
        res = {
            "error": 0,
            "deviceid": data.deviceid,
            "apikey": "111111111-1111-1111-1111-111111111111"
        };
        if (data.action) {
            switch (data.action) {
                case 'date':
                    res.date = new Date().toISOString();
                    break;
                case 'query':
                    //device wants information
                    var device = state.getDeviceById(data.deviceid);
                    if (!device) {
                        ////console.log('ERR | WS | Unknown device ', data.deviceid);
                    } else {
                       // console.log('INFO | WS | Device %s asks for timers',device.id);

                        /*if(data.params.includes('timers')){
                         if(device.timers){
                          res.params = [{timers : device.timers}];
                         }
                        }*/
                        res.params = {};
                        data.params.forEach(p => {
                            res.params[p] = device[p];
                        });
                    }
                    break;
                case 'update':
                    //device wants to update its state
                    var device = state.getDeviceById(data.deviceid);
                    if (!device) {
                        ////console.log('ERR | WS | Unknown device ', data.deviceid);
                    } else {
                        //console.log(JSON.stringify(data))
                        device.rssi = data.params.rssi
                        device.mac = data.params.staMac
                        device.state = ((data.params.switch != undefined) ? [{ "switch": data.params.switch, "outlet": 0 }] : data.params.switches)
                        //state.sendUpdate(device);
                        device.conn = conn;


                        state.updateKnownDevice(device);
                    }

                    break;
                case 'register':
                    var device = {
                        id: data.deviceid
                    };

                    //this is not valid anymore?! type is not based on the first two chars
                    var type = data.deviceid.substr(0, 2);
                    if (type == '01') device.kind = 'switch';
                    else if (type == '02') device.kind = 'light';
                    else if (type == '03') device.kind = 'sensor'; //temperature and humidity. No timers here;

                    device.version = data.romVersion;
                    device.model = data.model;
                    device.conn = conn;
                    state.updateKnownDevice(device);
                    ////console.log('INFO | WS | Device %s registered', device.id);
                    ////console.log('INFO | WS | Device %s registered', JSON.stringify(data));

                    break;
                default:
                    ////console.log('TODO | Unknown action "%s"', data.action);
                    break;
            }
        } else {
            if (data.sequence && data.deviceid) {
                var device = state.getDeviceById(data.deviceid);
                if (!device) {
                    ////console.log('ERR | WS | Unknown device ', data.deviceid);
                } else {
                    if (device.messages) {
                        var message = device.messages.find(item => item.sequence == data.sequence);
                        if (message) {
                            device.messages = device.messages.filter(function(item) {
                                return item !== message;
                            })
                            device.state = message.params.switch;
                            state.updateKnownDevice(device);
                            ////console.log('INFO | WS | APP | action has been accnowlaged by the device ' + JSON.stringify(data));
                        } else {
                            ////console.log('ERR | WS | No message send, but received an anser', JSON.stringify(data));
                        }
                    } else {
                        ////console.log('ERR | WS | No message send, but received an anser', JSON.stringify(data));
                    }
                }
            } else {
                ////console.log('TODO | WS | Not data action frame\n' + JSON.stringify(data));
            }
        }
        var r = JSON.stringify(res);
        ////console.log('RES | WS | DEV | ' + r);
        conn.sendText(r,textSend);
    });
    conn.on("close", function(code, reason) {
        ////console.log("Connection closed");
    });
})