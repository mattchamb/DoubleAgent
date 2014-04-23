module OwinRuleset
open System
open System.Collections.Generic
open System.IO
open System.Threading

let requiredRequestKeys = 
    [
        OwinKeys.RequestBody;
        OwinKeys.RequestHeaders;
        OwinKeys.RequestMethod;
        OwinKeys.RequestPath;
        OwinKeys.RequestPathBase;
        OwinKeys.RequestProtocol;
        OwinKeys.RequestQueryString;
        OwinKeys.RequestScheme;
        OwinKeys.Version;
        OwinKeys.CallCancelled
    ]

let requiredResponseKeys = 
    [
        OwinKeys.ResponseBody;
        OwinKeys.ResponseHeaders;
    ]

type OwinCompliance =
    | Compliant
    | ComplianceWarning of section: string * reason: string
    | NonCompliant of section: string * reason: string

type OwinEnv = IDictionary<string, Object>
type OwinCheck = OwinEnv -> OwinCompliance

let notNull (env: OwinEnv) = 
    match env with
    | null -> NonCompliant ("3.2", "The environment dictionary MUST be non-null.")
    | _ -> Compliant

let isMutableDictionary (dict: IDictionary<string, _>) =
    let refa = dict
    let refb = dict
    let randomKey = Guid.NewGuid().ToString()
    refa.Add(randomKey, Unchecked.defaultof<_>)
    refb.ContainsKey randomKey

let isMutable (env: OwinEnv) =
    match isMutableDictionary env with
    | true -> Compliant
    | false -> NonCompliant ("3.2", "The environment dictionary MUST be mutable.")
    
let containsRequiredKeys (env: OwinEnv) =
    let missingKeys = requiredRequestKeys
                      |> List.filter (fun key -> not(env.ContainsKey key))
    match missingKeys with
    | [] -> Compliant
    | _ -> NonCompliant ("3.2", sprintf "The environment dictionary MUST contain the keys: %A" missingKeys)

let valuesNotNull (env: OwinEnv) =
    let nullValues = requiredRequestKeys
                      |> List.filter (fun key -> env.[key] = null)
    match nullValues with
    | [] -> Compliant
    | _ -> NonCompliant ("3.2", sprintf "The values associated with the keys MUST be non-null: %A" nullValues)

let assertType<'T> key (env: OwinEnv) section = 
    match env.[key] with
    | :? 'T -> Compliant
    | _ -> NonCompliant (section, sprintf "The value for key '%s' MUST be of type '%s'" key (typeof<'T>.Name))

let reqBodyType (env: OwinEnv) =
    assertType<Stream> OwinKeys.RequestBody env "3.4"

let reqHeaderType (env: OwinEnv) =
    assertType<IDictionary<string, string array>> OwinKeys.RequestHeaders env "3.2.1"

let reqMethodType (env: OwinEnv) =
    assertType<String> OwinKeys.RequestMethod env "3.2.1"

let reqPathType (env: OwinEnv) =
    assertType<String> OwinKeys.RequestPath env "3.2.1"

let reqPathBaseType (env: OwinEnv) =
    assertType<String> OwinKeys.RequestPathBase env "3.2.1"

let reqProtocolType (env: OwinEnv) =
    assertType<String> OwinKeys.RequestProtocol env "3.2.1"
    
let reqQueryStringType (env: OwinEnv) =
    assertType<String> OwinKeys.RequestQueryString env "3.2.1"
    
let reqSchemeType (env: OwinEnv) =
    assertType<String> OwinKeys.RequestScheme env "3.2.1"

let reqCallCancelledType (env: OwinEnv) =
    assertType<CancellationToken> OwinKeys.CallCancelled env "3.2.3"

let reqOwinVersionType (env: OwinEnv) =
    assertType<string> OwinKeys.Version env "3.2.3"
    
let complianceChecks =
    [
        notNull;
        isMutable;
        containsRequiredKeys;
        valuesNotNull;
        reqBodyType;
        reqHeaderType;
        reqMethodType;
        reqPathType;
        reqPathBaseType;
        reqProtocolType;
        reqQueryStringType;
        reqSchemeType;
        reqCallCancelledType;
        reqOwinVersionType
    ]
