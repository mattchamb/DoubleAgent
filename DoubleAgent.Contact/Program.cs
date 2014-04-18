using System;
using System.Collections.Generic;
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
            var stream = Console.OpenStandardInput();
            var ostream = Console.OpenStandardOutput();
            using (var reader = new BinaryReader(stream, Encoding.UTF8, true))
            using(var writer = new BinaryWriter(ostream))
            {
                while (true)
                {
                    var messageLength = IPAddress.NetworkToHostOrder(reader.ReadInt32());

                    var bytes = reader.ReadBytes(messageLength);

                    var req = RequestEnvironment.CreateBuilder().MergeFrom(bytes).Build();

                    writer.Write(IPAddress.HostToNetworkOrder(req.RequestHeaders.ValueList.Count));

                    writer.Flush();
                }
            }
        }
    }
}
