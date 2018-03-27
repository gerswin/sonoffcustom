const mqtt = require('mqtt');

var MQTT_ADDR = "mqtt://192.168.0.22";
var MQTT_PORT = 1883;




//var stream = net.createConnection(MQTT_PORT, { user: 'admin', password: 'public', clientId: 'sonoffserver', protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout: 1000, debug: true });




const client = mqtt.connect(MQTT_ADDR, { user: 'admin', password: 'public', clientId: 'sonoffserver', protocolId: 'MQIsdp', protocolVersion: 3, connectTimeout: 1000, debug: true });

/// create client for mqtt 
client.on('connect', function() {
    client.publish("ok", "ok");
});

//conn.publish("hello", "dsds");
client.on('connect', function () {
    client.subscribe('tele/sonoff/INFO2')

});

client.on('message', function (topic, message) {
    let msg = JSON.parse(message.toString())
    console.log(msg.IPAddress)

 
})