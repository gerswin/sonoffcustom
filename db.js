const lokijs = require('lokijs');

//get devices config
//var config = JSON.parse(fs.readFileSync('/home/gerswin/homekit/config.json'));

//create devices db
var db = new lokijs("db.json");
//db.saveDatabase();

//create devices collection



module.exports =  db.addCollection('devices');