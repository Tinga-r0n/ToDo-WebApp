namespace MiniProject.Models
{
    public class Response
    {
        public string code {  get; set; }
        public string message { get; set; }
        public string error { get; set; }
        public object data { get; set; }
    }
}
