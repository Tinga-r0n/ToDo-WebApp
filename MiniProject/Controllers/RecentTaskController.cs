using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MySql.Data.MySqlClient;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/{controller}")]
    public class RecentTaskController : Controller
    {
        [HttpGet]
        public IActionResult Index()
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                //Getting Recent Task
                var recentTask = conn.Query<dynamic>(QueryStrings.Instance.RecentTask, null, commandType: System.Data.CommandType.StoredProcedure);

                return Ok(new Response { code = "SUCCESS", message = "Successfully get task.", data = recentTask });
            }
            catch (MySqlException myx)
            {
                return BadRequest(new Response { code = "MYSQL_ERROR", error = $"Error Details: {myx.Message}" });
            }
            catch (Exception ex)
            {
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }
    }
}
