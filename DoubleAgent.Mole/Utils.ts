/// <reference path="./Protowin.ts" />
/// <reference path="ts/node.d.ts" />

import protowin = require("Protowin");


export function extractHttpHeaders(headersObject): protowin.HeaderValue[] {
    var headers: protowin.HeaderValue[] = [];
    for (var headerKey in headersObject) {
        headers.push({
            Key: <string>headerKey,
            Value: <string>headersObject[headerKey]
        });
    }
    return headers;
};

function combinedLengths(arr: NodeBuffer[]) {
    var total = 0;
    for (var i = 0; i < arr.length; i++) {
        total += arr[i].length;
    }
    return total;
}

export function combineDataBuffers(buffers: NodeBuffer[]): NodeBuffer {
    var totalSize = combinedLengths(buffers);
    var combined = new Buffer(totalSize);
    var copiedSoFar = 0;
    for (var i = 0; i < buffers.length; i++) {
        var buff = buffers[i];
        copiedSoFar += buff.copy(combined, copiedSoFar);
    }
    return combined;
}

//export function mergePartiallyConsumedBuffers(buf1: NodeBuffer, offset: number, buf2: NodeBuffer): NodeBuffer {
//    var mergedLength = buf1.length + buf2.length - offset;
//    var ret = new Buffer(mergedLength);
//    buf1.copy(ret, 0, offset);
//    buf2.copy(ret, buf1.length - offset);
//    return ret;
//}

export interface RequestData {
    body: NodeBuffer;
    headers: any;
    method: string;
    path: string;
    pathBase: string;
    httpVersion: string;
    queryString: string;
    uriScheme: string;
}
