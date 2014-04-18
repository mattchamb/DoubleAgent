/// <reference path="ts/node.d.ts" />
/// <reference path="Protowin.ts" />
/// <reference path="Utils.ts" />

import proc = require("child_process");
import http = require("http");
import url = require("url");
import protowin = require("./Protowin");
import utils = require("./Utils");

var spawn = proc.spawn;

interface StoredRequest {
    callback: (respEnv: protowin.ResponseEnv) => void;
    requestEnv: protowin.RequestEnv;
}

class ContinuousDataReader {
    private currentExpectedLength: number;
    private isReadingMessage: boolean;
    private bufferedData: NodeBuffer;

    constructor(private decoder: (data: NodeBuffer) => protowin.ResponseEnv) {
        this.currentExpectedLength = 0;
        this.isReadingMessage = false;
        this.bufferedData = new Buffer(0);
    }

    readData(data: NodeBuffer, callback: (data: protowin.ResponseEnv) => void) {
        this.bufferedData = utils.combineDataBuffers([this.bufferedData, data]);
        if (this.bufferedData.length >= 4 && !this.isReadingMessage) {
            this.currentExpectedLength = this.bufferedData.readInt32BE(0);
            this.bufferedData = this.bufferedData.slice(4); //remove the bytes just read for the expected length.
            this.isReadingMessage = true;
        }

        if (this.bufferedData.length >= this.currentExpectedLength) {
            var response = this.decoder(this.bufferedData);
            this.isReadingMessage = false;
            this.bufferedData = this.bufferedData.slice(this.currentExpectedLength);
            callback(response);
        }
    }

    private readLength(data: NodeBuffer) {
        return data.readInt32BE(0);
    }
}

class Mole {
    private contactProcess: proc.ChildProcess;
    private requests: StoredRequest[];
    private dataReader: ContinuousDataReader;

    constructor(private contactPath: string,
                private args: string[],
                private encoder: (env: protowin.RequestEnv) => NodeBuffer,
                private decoder: (data: NodeBuffer) => protowin.ResponseEnv) {
        this.requests = [];
        this.dataReader = new ContinuousDataReader(decoder);
    }

    spawnContactProcess() {
        console.log("Starting " + this.contactPath + "\n");
        this.contactProcess = spawn(this.contactPath, this.args);
        this.contactProcess.stdout.on("data", (data) => this.readData(data));
    }

    private findStoredRequestByCorrelation(correlationRef: string) : StoredRequest {
        for (var i = 0; i < this.requests.length; i++) {
            var req = this.requests[i];
            if (req.requestEnv.CorrelationReference == correlationRef) {
                return req;
            }
        }
        return null;
    }

    private readData(data: NodeBuffer) {
        this.dataReader.readData(data, (respEnv: protowin.ResponseEnv) => {
            var asdf = this.findStoredRequestByCorrelation(respEnv.Request.CorrelationReference);
            if (asdf == null) {
                console.log("Messed up - couldnt find request for correlation reference: " + respEnv.Request.CorrelationReference);
                return;
            }
            asdf.callback(respEnv);
        });
    }

    processRequest(request: utils.RequestData, callback: (respEnv: protowin.ResponseEnv) => void): void {
        if (!this.contactProcess) {
            throw "The contact process must be spawned.";
        }

        var reqEnv = new protowin.RequestEnv(request);

        this.requests.push({
            callback: callback,
            requestEnv: reqEnv
        });
        var encodedRequest = this.encoder(reqEnv);
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
    var coders = protowin.createProtoCoders();
    return new Mole(path, args, coders.encode, coders.decode);
};

exports.prepareRequest = function (req: http.ServerRequest, callback: (data: utils.RequestData) => void): void {
    var dataBuffers : NodeBuffer[] = [];

    req.on("data", function (data) {
        dataBuffers.push(data);
    });
    req.on("end", function () {
        var body = utils.combineDataBuffers(dataBuffers);
        var parsedUrl = url.parse(req.url);
        var data = {
            body: body,
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