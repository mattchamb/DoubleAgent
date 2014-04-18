/// <reference path="ts/node.d.ts" />
/// <reference path="Utils.ts" />

var uuid = require("uuid");
var fs = require("fs");
var protobuf = require("protobuf.js");
var proto2json = require("proto2json");
import utils = require("./Utils");

// This request should match the agent.proto definition.
export class RequestEnv {
    RequestBody: NodeBuffer;
    RequestHeaders: Headers;
    RequestMethod: string;
    RequestPath: string;
    RequestPathBase: string;
    RequestProtocol: string;
    RequestQueryString: string;
    RequestScheme: string;
    CorrelationReference: string;

    constructor(asdf : utils.RequestData) {
        this.CorrelationReference = uuid.v1();
        this.RequestBody = asdf.body;
        this.RequestHeaders = { Value: utils.extractHttpHeaders(asdf.headers) };
        this.RequestMethod = asdf.method;
        this.RequestPath = asdf.path;
        this.RequestPathBase = asdf.pathBase;
        this.RequestProtocol = asdf.httpVersion;
        this.RequestQueryString = asdf.queryString;
        this.RequestScheme = asdf.uriScheme;
    }
}

export interface ResponseEnv {
    ResponseBody: number[];
    ResponseHeaders: Headers;
    ResponseStatusCode: number;
    ResponseReasonPhrase: string;
    ResponseProtocol: string;
    Request: RequestEnv;
}

export interface Headers {
    Value: HeaderValue[];
}

export interface HeaderValue {
    Key: string;
    Value: string;
}

export function createProtoCoders() {
    var translator;
    proto2json.parse(fs.readFileSync("./agent.proto", "utf8"), function (err, result) {
        if (err) {
            console.log(err);
        }
        translator = new protobuf(result);
    });
    function encode(req: RequestEnv): NodeBuffer {
        var buf = <NodeBuffer>translator.encode('RequestEnvironment', req);
        return buf;
    }
    function decode(data: NodeBuffer): ResponseEnv {
        var ret = translator.decode("ResponseEnvironment", data);
        return ret;
    }
    return {
        encode: encode,
        decode: decode
    };
}



