/// <reference path="./Protowin.ts" />

import protowin = require("Protowin");


export function extractHttpHeaders(headersObject): protowin.HeaderValue[] {
    var headers = [];
    for (var headerKey in headersObject) {
        headers.push({
            Key: headerKey,
            Value: [headersObject[headerKey]]
        });
    }
    return headers;
};

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
