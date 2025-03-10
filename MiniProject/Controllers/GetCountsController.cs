using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MySql.Data.MySqlClient;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class GetCountsController : Controller
    {
        [HttpGet("{userId}")] // Accept userId as a route parameter
        public IActionResult Index(int userId)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                // Define parameters
                var parameters = new { p_user_id = userId };

                // Getting All Counts for Task with user filtering
                var countTask = conn.Query<dynamic>(QueryStrings.Instance.CountTask, parameters, commandType: System.Data.CommandType.StoredProcedure);
                
                if (!countTask.Any())
                {
                    throw new Exception("NO_RECORDS");
                }

                return Ok(new Response { code = "SUCCESS", message = "Successfully retrieved task counts.", data = countTask });
            }
            catch (MySqlException myx)
            {
                return BadRequest(new Response { code = "MYSQL_ERROR", error = $"Error Details: {myx.Message}" });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("NO_RECORDS"))
                {
                    return NotFound(new Response { code = "NOT_FOUND", message = "No task available." });
                }
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }
    }
}
