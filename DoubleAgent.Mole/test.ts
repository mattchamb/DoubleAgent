/// <reference path="ts/node.d.ts" />

import proc = require("child_process");
import http = require("http");
import url = require("url");

var spawn = proc.spawn;

var fs = require("fs");
var protobuf = require("protobuf.js");
var proto2json = require("proto2json");
var uuid = require("uuid");



// interface RequestEnv {
//    body: NodeBuffer[];
//    headers: Header[];
//    method: string;
//    path: string;
//    pathBase: string;
//    protocol: string;
//    queryString: string;
//    uriScheme: string;
// }

// This request should match the agent.proto definition.
interface RequestEnv {
    RequestBody: NodeBuffer;
    RequestHeaders: Headers;
    RequestMethod: string;
    RequestPath: string;
    RequestPathBase: string;
    RequestProtocol: string;
    RequestQueryString: string;
    RequestScheme: string;
    CorrelationReference: string;
}
interface Headers {
    Value: HeaderValue[];
}
interface HeaderValue {
    Key: string;
    Values: string[];
}

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

    private readBuffer: NodeBuffer;

    constructor(private contactPath: string, private args: string[], private translator) {
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

    processRequest(request: RequestEnv, callback): void {
        if (!this.contactProcess) {
            throw "The contact process must be spawned.";
        }
        var correlationReference = uuid.v1();
        request.CorrelationReference = correlationReference;
        var handle = {
            correlation: correlationReference,
            callback: callback,
            request: request
        };
        this.requests.push(handle);
        var encodedRequest = this.encodeRequest(request);
        this.writeBufferToProcess(encodedRequest);
    }

    private encodeRequest(req: RequestEnv) : NodeBuffer {
        var buf = <NodeBuffer>this.translator.encode('RequestEnvironment', req);
        return buf;
    }

    private writeBufferToProcess(buffer: NodeBuffer) : void {
        var lengthBuffer = new Buffer(4);
        lengthBuffer.writeInt32BE(buffer.length, 0);
        this.contactProcess.stdin.write(lengthBuffer);
        this.contactProcess.stdin.write(buffer);
    }
}


exports.Mole = function (path, args) {
    var translator;
    proto2json.parse(fs.readFileSync('./agent.proto', 'utf8'), function (err, result) {
        if (err) {
            console.log(err);
        }
        translator = new protobuf(result);
    });
    return new Mole(path, args, translator);
};

exports.extractFields = function (req: http.ServerRequest): RequestEnv {
    var h = [];
    for (var headerKey in req.headers) {
        h.push({
            Key: headerKey,
            Value: [req.headers[headerKey]]
        });
    }

    var asdf = url.parse(req.url);


    return {
        RequestBody: new Buffer(0),
        RequestHeaders: {
            Value: h
        },
        CorrelationReference: null,
        RequestMethod: req.method,
        RequestPath: "",
        RequestPathBase: asdf.pathname,
        RequestProtocol: req.httpVersion,
        RequestQueryString: asdf.search,
        RequestScheme: asdf.protocol
    };
};