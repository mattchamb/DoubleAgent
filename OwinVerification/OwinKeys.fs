module OwinKeys

[<Literal>]
let Version = "owin.Version"
[<Literal>]
let CallCancelled = "owin.CallCancelled"
[<Literal>]
let ClientCertificate = "ssl.ClientCertificate"

[<Literal>]
let RequestMethod = "owin.RequestMethod"
[<Literal>]
let RequestScheme = "owin.RequestScheme"
[<Literal>]
let RequestPathBase = "owin.RequestPathBase"
[<Literal>]
let RequestPath = "owin.RequestPath"
[<Literal>]
let RequestQueryString = "owin.RequestQueryString"
[<Literal>]
let RequestProtocol = "owin.RequestProtocol"
[<Literal>]
let RequestBody = "owin.RequestBody"
[<Literal>]
let RequestHeaders = "owin.RequestHeaders"
    
[<Literal>]
let ResponseHeaders = "owin.ResponseHeaders"
[<Literal>]
let ResponseBody = "owin.ResponseBody"
[<Literal>]
let ResponseStatusCode = "owin.ResponseStatusCode"
[<Literal>]
let ResponseReasonPhrase = "owin.ResponseReasonPhrase"
[<Literal>]
let ResponseProtocol = "owin.ResponseProtocol"