using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System;
using System.Data;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TimeTrackingController : Controller
    {
        [HttpPost("add-time-spent")]
        public IActionResult AddTimeSpent([FromBody] TimeTrackingRequest request)
        {
            if (request == null || request.TaskId <= 0 || string.IsNullOrEmpty(request.TimeSpent))
            {
                return BadRequest(new { code = "ERROR", message = "Invalid request data." });
            }

            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@TaskId", request.TaskId, DbType.Int32);
                parameters.Add("@TimeSpent", request.TimeSpent, DbType.String);

                int rowsAffected = conn.Execute("sp_AddTimeSpent", parameters, commandType: CommandType.StoredProcedure);

                if (rowsAffected > 0)
                {
                    return Ok(new { code = "SUCCESS", message = "Time spent added successfully." });
                }

                return BadRequest(new { code = "ERROR", message = "Failed to add time spent." });
            }
            catch (MySqlException myx)
            {
                return BadRequest(new { code = "MYSQL_ERROR", error = myx.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { code = "ERROR", error = ex.Message });
            }
        }
    }

    public class TimeTrackingRequest
    {
        public int TaskId { get; set; }
        public string TimeSpent { get; set; } // Example: "2w 4d 6h 45m"
    }
}
