using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MySql.Data.MySqlClient;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/AllTask")]
    public class AllTaskController : Controller
    {
        [HttpGet]

        public IActionResult Index(int? user_id, string? created_at)

        {
            try
            {
                if (user_id == null)
                {
                    return Unauthorized(new Response { code = "UNAUTHORIZED", message = "User ID is required." });
                }


                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();


                var parameter = new DynamicParameters();



                parameter.Add("@p_user_id", user_id);
                parameter.Add("@p_created_date", string.IsNullOrEmpty(created_at) ? null : created_at);
             


                var allTask = conn.Query<dynamic>(QueryStrings.Instance.AllTask, parameter, commandType: System.Data.CommandType.StoredProcedure);

                if (!allTask.Any())
                {
                    return NotFound(new Response { code = "NOT_FOUND", message = "No tasks available.", data = new List<object>() });
                }
                return Ok(new Response { code = "SUCCESS", message = "Successfully retrieved tasks.", data = allTask });

            }

            catch (Exception ex)
            {
                if (ex.Message.Contains("NO_RECORDS"))
                {
                    return Ok(new Response { code = "SUCCESS", message = "No tasks available.", data = new List<object>() });
                }
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }

        }

        [HttpPut("UpdateStatus")]
        public IActionResult UpdateTaskStatus(int taskId, string newStatus)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameter = new DynamicParameters();
                parameter.Add("@p_task_id", taskId);
                parameter.Add("@p_new_status", newStatus);

                int rowsAffected = conn.Execute(QueryStrings.Instance.Update_status, parameter, commandType: System.Data.CommandType.StoredProcedure);

                if (rowsAffected > 0)
                {
                    return Ok(new Response { code = "SUCCESS", message = "Task status updated successfully." });
                }
                else
                {
                    return NotFound(new Response { code = "NOT_FOUND", message = "Task not found or no changes made." });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }

        [HttpGet("backlog")]

        public IActionResult Backlog(int? user_id)

        {
            try
            {
                if (user_id == null)
                {
                    return Unauthorized(new Response { code = "UNAUTHORIZED", message = "User ID is required." });
                }


                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();


                var parameter = new DynamicParameters();



                parameter.Add("@p_user_id", user_id);



                var allTask = conn.Query<dynamic>(QueryStrings.Instance.Backlog, parameter, commandType: System.Data.CommandType.StoredProcedure);

                if (!allTask.Any())
                {
                    return NotFound(new Response { code = "NOT_FOUND", message = "No tasks available.", data = new List<object>() });
                }
                return Ok(new Response { code = "SUCCESS", message = "Successfully retrieved tasks.", data = allTask });

            }

            catch (Exception ex)
            {
                if (ex.Message.Contains("NO_RECORDS"))
                {
                    return Ok(new Response { code = "SUCCESS", message = "No tasks available.", data = new List<object>() });
                }
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }

        }

        [HttpGet("GetInpro")]

        public IActionResult GetInproTask(int? user_id, string? created_at)

        {
            try
            {
                if (user_id == null)
                {
                    return Unauthorized(new Response { code = "UNAUTHORIZED", message = "User ID is required." });
                }


                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();


                var parameter = new DynamicParameters();



                parameter.Add("@p_user_id", user_id);
                parameter.Add("@p_created_date", string.IsNullOrEmpty(created_at) ? null : created_at);



                var allTask = conn.Query<dynamic>(QueryStrings.Instance.GetInprogress, parameter, commandType: System.Data.CommandType.StoredProcedure);

                if (!allTask.Any())
                {
                    return NotFound(new Response { code = "NOT_FOUND", message = "No tasks available.", data = new List<object>() });
                }
                return Ok(new Response { code = "SUCCESS", message = "Successfully retrieved tasks.", data = allTask });

            }

            catch (Exception ex)
            {
                if (ex.Message.Contains("NO_RECORDS"))
                {
                    return Ok(new Response { code = "SUCCESS", message = "No tasks available.", data = new List<object>() });
                }
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }

        }

    }
}