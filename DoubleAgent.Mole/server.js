

var http = require('http');
var port = process.env.port || 1337;

var doubleAgent = require("./test.js");

var mole = doubleAgent.Mole("..\\DoubleAgent.Contact\\bin\\Debug\\DoubleAgent.Contact.exe", []);
mole.spawnContactProcess();

http.createServer(function (req, res) {
    var asdf = doubleAgent.extractFields(req);
    console.log(asdf);
    mole.processRequest(asdf);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hello World\n');
}).listen(port);