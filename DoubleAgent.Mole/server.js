
var http = require('http');
var port = process.env.port || 1337;

var doubleAgent = require("./DoubleAgent.js");

var mole = doubleAgent.Mole("..\\DoubleAgent.Contact\\bin\\Debug\\DoubleAgent.Contact.exe", []);
mole.spawnContactProcess();

http.createServer(function (req, res) {
    doubleAgent.prepareRequest(req, function (data) {
        console.log(data);
        mole.processRequest(data, function (respData) {
            console.log(respData);
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(new Buffer(respData.ResponseBody));
        });
    });
}).listen(port);