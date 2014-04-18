using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Net;
using DoubleAgent.Protowin;

namespace DoubleAgent.Contact
{
    class Program
    {
        static void Main(string[] args)
        {
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

                        var resp = ResponseEnvironment.CreateBuilder()
                            .SetResponseBody(Google.ProtocolBuffers.ByteString.CopyFrom(new byte[] { 1, 2, 3 }))
                            .SetRequest(req)
                            .SetResponseHeaders(req.RequestHeaders)
                            .SetResponseProtocol(req.RequestProtocol)
                            .SetResponseReasonPhrase(string.Empty)
                            .SetResponseStatusCode(200).Build();

                        var data = resp.ToByteArray();

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
