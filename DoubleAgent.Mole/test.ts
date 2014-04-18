
/// <reference path="Protowin.ts" />
/// <reference path="Utils.ts" />

import proc = require("child_process");
import http = require("http");
import url = require("url");
import protowin = require("./Protowin");
import utils = require("./Utils");

var spawn = proc.spawn;

class ContinuousDataReader {
    private currentExpectedLength: number;
    private hasStartedReading: boolean;

    private dataBuffer: any;
    constructor() {
        this.currentExpectedLength = 0;
        this.hasStartedReading = false;
    }

    readData(data) {
        
    }

    private readLength(data: NodeBuffer) {
        return data.readInt32BE(0);
    }
}

class Mole {
    private contactProcess: proc.ChildProcess;
    private requests: any[];

    constructor(private contactPath: string,
                private args: string[],
                private encoder: (env: protowin.RequestEnv) => NodeBuffer) {
        this.requests = [];
    }

    spawnContactProcess() {
        console.log("Starting " + this.contactPath + "\n");
        this.contactProcess = spawn(this.contactPath, this.args);
        this.contactProcess.stdout.on("data", (data) => this.readData(data));
    }

    private readData(data) {
        console.log("Received data from process:\n");
        console.log(data);
    }

    processRequest(request: utils.RequestData, callback): void {
        if (!this.contactProcess) {
            throw "The contact process must be spawned.";
        }

        var env = new protowin.RequestEnv(request);

        this.requests.push({
            callback: callback,
            request: env
        });
        var encodedRequest = this.encoder(env);
        this.writeBufferToProcess(encodedRequest);
    }

    private writeBufferToProcess(buffer: NodeBuffer) : void {
        var lengthBuffer = new Buffer(4);
        lengthBuffer.writeInt32BE(buffer.length, 0);
        this.contactProcess.stdin.write(lengthBuffer);
        this.contactProcess.stdin.write(buffer);
    }
}


exports.Mole = function (path, args) {
    var encoder = protowin.createEncoder();
    return new Mole(path, args, encoder);
};

exports.prepareRequest = function (req: http.ServerRequest, callback: (data: utils.RequestData) => void): void {
    var dataBuffers : NodeBuffer[] = [];

    req.on("data", function (data) {
        dataBuffers.push(data);
    });
    req.on("end", function () {
        var parsedUrl = url.parse(req.url);

        var data = {
            body: new Buffer(0),
            headers: req.headers,
            method: req.method,
            path: "",
            pathBase: parsedUrl.pathname,
            httpVersion: req.httpVersion,
            queryString: parsedUrl.search,
            uriScheme: parsedUrl.protocol
        };

        callback(data);
    });
};