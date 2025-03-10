using System.Net.NetworkInformation;

namespace MiniProject
{
    public class Connection
    {
        private static readonly object _InstanceLock = new();

        private static Connection  _Credentials;
        private readonly string _ConnectionString = new ConfigurationBuilder().AddJsonFile("appsettings.json").Build().GetSection("Connection")["Config"];
        public string ConnectionString => _ConnectionString;

        public static Connection Instance { get {
                if (_Credentials == null)
                {
                    lock (_InstanceLock)
                    {
                        if (_Credentials == null)
                        {
                            _Credentials = new Connection();
                        }
                    }
                }
                return _Credentials;
            } 
        }
    }
}
