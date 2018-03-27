const http = require('http');
const url = require('url');
const fs = require('fs');
var request = require('request');

var WiFiControl = require('wifi-control');

//config parameters for SONOFF
var apSSID = "ITEAD-10";
var apPWD = "12345678";


//  Initialize wifi-control package with verbose output
WiFiControl.init({
    debug: true
});

const dns = require('dns')

var serverIP = "";
  serverIP = "192.168.1.20";

//initialize the SONOFF after it has been found
// - set the wlan-network that the sonoff should use
// - set server to which the sonoff should connect (instead of its original cloud)
var _initDevice = () => {
    http.get('http://10.10.7.1/device', (res) => {
        if (res.statusCode !== 200) {
            console.log('Unable to connect to the target device. Code: ' + res.statusCode);
            res.resume();
            return;
        }
        res.setEncoding('utf8');
        var data = '';
        res.on('data', (c) => data += c);
        res.on('end', () => {
            var response = JSON.parse(data);
            var device = {
                deviceid: response.deviceid,
                apikey: response.apikey
            };

            console.log('device: ' + JSON.stringify(device));
            console.log({
                "version": 4,
                "ssid": "Parawebs Co.",
                "password": "parawebsca",
                "serverName": "192.168.0.8",
                "port": "1080"
            })
            //send configuration to device, so that it will use that server as its cloud
            request.post('http://10.10.7.1/ap', {
                json: true, body: {
                    "version": 4,
                "ssid": "Parawebs Co.",
                "password": "parawebsca",
                "serverName": "192.168.0.8",
                "port": "1080"
                }
            }, (err, response, body) => {
                if (!err && response.statusCode == 200) {
                    console.log(JSON.stringify(response) + "\t" + JSON.stringify(body));
                }
                else {
                    console.log('Unable to configure endpoint ' + err);
                }
            });
        });
    }).on('error', (e) => {
        console.log(`Unable to establish connection to the device: ${e}`);
    });
};

// ----------------------------------------------------------------
// run .....
// - scan for SONOFF wlan = ITEAD-100xxxxxx
// - connect to SONOFF
// - setup SONOFF to use local PC as cloud
// -----------------------------------------------------------------
console.log(serverIP)
var find = setInterval(() => {
    WiFiControl.scanForWiFi(function (err, response) {
        if (err) console.log(err);
        var apNet = response.networks.find(n => n.ssid.startsWith(apSSID));

        if (!apNet) {
            console.log('ERR | ' + Date.now() + ' | Sonoff is not in pairing mode. Please, Long press until led start blinking fast.');
        } else {
            console.log('OK | Sonoff found in pairing mode.');
            apSSID = apNet.ssid;
            clearInterval(find);
            apNet.password = apPWD;
            WiFiControl.connectToAP(apNet, function (err, response) {
                if (err) console.log(err);
                console.log('OK | Sonoff paired.', response);
                _initDevice();
            });
        }
    });
}, 500);
