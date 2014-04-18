using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using DoubleAgent.Protowin;
using Nancy;
using Nancy.Owin;
using System.Threading;

namespace DoubleAgent.Contact
{
    //using AppFunc = Func<IDictionary<string, object>, Task>;

    public class Thing : NancyModule
    {
        public Thing()
        {
            Get["/"] = x =>
            {
                return "Hello world from Nancy!!!!";
            };
        }
    }

    public static class OwinConstants
    {
        public const string Version = "owin.Version";
        public const string RequestMethod = "owin.RequestMethod";
        public const string RequestScheme = "owin.RequestScheme";
        public const string RequestPathBase = "owin.RequestPathBase";
        public const string RequestPath = "owin.RequestPath";
        public const string RequestQueryString = "owin.RequestQueryString";
        public const string RequestProtocol = "owin.RequestProtocol";
        public const string RequestBody = "owin.RequestBody";
        public const string RequestHeaders = "owin.RequestHeaders";
        public const string CallCancelled = "owin.CallCancelled";

        public const string ResponseHeaders = "owin.ResponseHeaders";
        public const string ResponseBody = "owin.ResponseBody";
        public const string ResponseStatusCode = "owin.ResponseStatusCode";
        public const string ResponseReasonPhrase = "owin.ResponseReasonPhrase";

        public const string ClientCertificate = "ssl.ClientCertificate";
    }


    class Program
    {
        private static IDictionary<string, string[]> ExtractHeaders(Headers headers)
        {
            return headers.ValueList.ToDictionary(h => h.Key, h => new[] { h.Value });
        }

        private static IDictionary<string, object> ExtractEnvironment(RequestEnvironment req)
        {
            var env = new Dictionary<string, object>();
            env[OwinConstants.CallCancelled] = CancellationToken.None;
            env[OwinConstants.Version] = "1.0";
            env[OwinConstants.RequestBody] = new MemoryStream(req.RequestBody.ToByteArray());
            env[OwinConstants.RequestHeaders] = ExtractHeaders(req.RequestHeaders);
            env[OwinConstants.RequestMethod] = req.RequestMethod;
            env[OwinConstants.RequestPath] = req.RequestPath;
            env[OwinConstants.RequestPathBase] = req.RequestPathBase;
            env[OwinConstants.RequestProtocol] = req.RequestProtocol;
            env[OwinConstants.RequestQueryString] = req.RequestQueryString;
            env[OwinConstants.RequestScheme] = req.RequestScheme;
            env[OwinConstants.ResponseHeaders] = new Dictionary<string, string[]>();
            env[OwinConstants.ResponseBody] = new MemoryStream();
            return env;
        }

        private static Headers PackageHeaders(IDictionary<string, string[]> headers)
        {
            var builder = Headers.CreateBuilder();
            
            var headerBuilder = HeaderValue.CreateBuilder();
            
            foreach (var item in headers)
	        {
                var val = item.Value.SingleOrDefault();
                headerBuilder.SetKey(item.Key);
                headerBuilder.SetValue(val ?? string.Empty);
                builder.AddValue(headerBuilder.Build());
	        }
            return builder.Build();
        }

        private static ResponseEnvironment PackageResponse(RequestEnvironment req, IDictionary<string, object> env)
        {
            var responseStream = (MemoryStream)env[OwinConstants.ResponseBody];
            var responseHeaders = (IDictionary<string, string[]>)env[OwinConstants.ResponseHeaders];
            var statusCode = (int)env[OwinConstants.ResponseStatusCode];
            var resp = ResponseEnvironment.CreateBuilder()
                            .SetResponseBody(Google.ProtocolBuffers.ByteString.CopyFrom(responseStream.ToArray()))
                            .SetRequest(req)
                            .SetResponseHeaders(PackageHeaders(responseHeaders))
                            .SetResponseProtocol(req.RequestProtocol)
                            .SetResponseReasonPhrase(string.Empty)
                            .SetResponseStatusCode(statusCode).Build();

            return resp;
        }

        static void Main(string[] args)
        {
            var nancy = new NancyOwinHost(null, new NancyOptions()
                {
                    PerformPassThrough = _ => false,
                });

            try
            {
                var stream = Console.OpenStandardInput();
                var ostream = Console.OpenStandardOutput();
                using (var reader = new BinaryReader(stream, Encoding.UTF8, true))
                using (var writer = new BinaryWriter(ostream))
                {
                    while (true)
                    {
                        var messageLength = IPAddress.NetworkToHostOrder(reader.ReadInt32());

                        var bytes = reader.ReadBytes(messageLength);

                        var req = RequestEnvironment.CreateBuilder().MergeFrom(bytes).Build();
                        //var headers = Headers.CreateBuilder().AddValue(HeaderValue.CreateBuilder().SetKey("Test").SetValue("TestVal"));
                        //var reasq = RequestEnvironment.CreateBuilder()
                        //    .SetCorrelationReference("asdf")
                        //    .SetRequestBody(Google.ProtocolBuffers.ByteString.CopyFrom(new byte[] { 1, 2, 3 }))
                        //    .SetRequestHeaders(headers)
                        //    .SetRequestMethod("asdf")
                        //    .SetRequestPath("asdf")
                        //    .SetRequestPathBase("asdf")
                        //    .SetRequestProtocol("asdf")
                        //    .SetRequestQueryString("asdf")
                        //    .SetRequestScheme("asdf")
                        //    .Build();

                        var env = ExtractEnvironment(req);
                        try
                        {
                            var t = nancy.Invoke(env);

                            t.Wait();
                        } 
                        catch(Exception ex)
                        {
                            File.WriteAllText("nancyLog.txt", ex.ToString());
                        }

                        var asdf = PackageResponse(req, env);
                        var data = asdf.ToByteArray();
                        
                        //var resp = ResponseEnvironment.CreateBuilder()
                        //    .SetResponseBody(Google.ProtocolBuffers.ByteString.CopyFrom(new byte[] { 1, 2, 3 }))
                        //    .SetRequest(req)
                        //    .SetResponseHeaders(req.RequestHeaders)
                        //    .SetResponseProtocol(req.RequestProtocol)
                        //    .SetResponseReasonPhrase(string.Empty)
                        //    .SetResponseStatusCode(200).Build();

                        //var data = resp.ToByteArray();

                        writer.Write(IPAddress.HostToNetworkOrder(data.Length));
                        writer.Write(data, 0, data.Length);
                        writer.Flush();
                    }
                }
            }
            catch (Exception ex)
            {
                File.WriteAllText("log.txt", ex.ToString());
                throw;
            }
        }
    }
}
