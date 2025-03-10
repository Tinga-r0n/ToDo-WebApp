using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MySql.Data.MySqlClient;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/{controller}")]
    public class MarkTaskController : Controller
    {
        // This controller will update and records the task when its done.
        [HttpPut("{task_id}")]
        public IActionResult Index(int task_id, [FromQuery] int time_spent_minutes)
        {
            if (task_id <= 0)
            {
                throw new Exception("MISSING_PARAMS");
            }

            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@task_id", task_id);
                parameters.Add("@time_spent_minutes", time_spent_minutes);
                conn.Execute(QueryStrings.Instance.MarkTask, parameters, commandType: System.Data.CommandType.StoredProcedure);

                return Ok(new Response { code = "SUCCESS", message = "Task successfully added to achievements." });
            }
            catch (MySqlException myx)
            {
                return BadRequest(new Response { code = "MYSQL_ERROR", error = $"Error Details: {myx.Message}" });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("MISSING_PARAMS"))
                {
                    return BadRequest(new Response { code = "ERROR", error = "Invalid task data." });
                }
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }




        [HttpPost("mark-task")]
        public async Task<IActionResult> MarkTask([FromBody] MarkTaskRequest request)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                {
                    await conn.ExecuteAsync("CALL mark_task(@task_id, @time_spent_minutes)",
                        new { task_id = request.TaskId, time_spent_minutes = request.TimeSpent });

                    return Ok(new { message = "Task updated successfully" });
                }
            }
            catch (Exception ex)
            {

                return StatusCode(500, "An error occurred while processing your request.");
            }
        }


        [HttpGet("{task_id}/timeSpent")]
        public IActionResult GetTimeSpent(int task_id)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@task_id", task_id);

                // Assuming there's a query that sums the time spent for a task.
                var result = conn.QuerySingleOrDefault<int?>("SELECT SUM(time_spent_minutes) FROM time_spent_log WHERE task_id = @task_id", parameters);

                // If the result is null, return 0 as the timeSpent value
                var timeSpent = result ?? 0;

                return Ok(new { timeSpent });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while fetching time spent.");
            }
        }
    }

    }



