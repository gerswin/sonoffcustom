var express = require('express');
var server = express();
var bodyParser = require('body-parser')
var http = require('http');
var path = require('path');


const fs = require('fs');

var mdns = require('mdns');

var sequence = [
    mdns.rst.DNSServiceResolve()
    , mdns.rst.getaddrinfo({families: [4] })
    ];

const browser = mdns.createBrowser(mdns.tcp('http'),{resolverSequence: sequence});

// Register body-parser
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

var config = JSON.parse(fs.readFileSync('/home/gerswin/homekit/config.json'));

// Create https server & run
// Create https server & run
http.createServer(server).listen(config.server.httpMqtt, function() {
    //console.log('API Server Started On Port %d', config.server.httpPort);
});

// server.get('/', function(req, res) {
//     res.sendFile(path.join(__dirname + '/static/index.html'));
// });

var state = []
browser.on('serviceUp', function(service) {
    if (service.name != undefined) {
        if (service.name.split(" ").length < 2) {
            console.log({ "id":service.addresses[0],"name": service.addresses[0], "type": "mqtt", "host": service.name + ".local" })
            state.push({ "id":service.addresses[0],"name": service.addresses[0], "type": "mqtt", "host": service.name + ".local" })
        }
    }

    console.log("service up: ", service);
});

browser.start();



server.get('/', function(req, res) {
    res.json(state)
});
