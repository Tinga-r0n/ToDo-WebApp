using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/DeleteTask")] 
    public class DeleteTaskController : ControllerBase
    {
        [HttpDelete("{task_id}")] 
        public IActionResult DeleteTask(int task_id)
        {
            try
            {
                if (task_id <= 0)
                {
                    throw new Exception("NO_TASK_ID");  
                }

                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@task_id", task_id);

                int rowsAffected = conn.Execute(QueryStrings.Instance.DeleteTask, parameters, commandType: System.Data.CommandType.StoredProcedure);

                if (rowsAffected > 0)
                {
                    return Ok(new { code = "SUCCESS", message = "Task successfully deleted." });
                }
                throw new Exception("NOT_FOUND");
            }
            catch (MySqlException myx)
            {
                return BadRequest(new { code = "MYSQL_ERROR", error = $"Error Details: {myx.Message}" });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("NOT_FOUND")) 
                {
                    return NotFound(new { code = "NOT_FOUND", error = "Task not found." });
                }
                if (ex.Message.Contains("NO_TASK_ID")) 
                {
                    return BadRequest(new { code = "ERROR", error = "Invalid task ID" });
                }
                return BadRequest(new { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }
    }
}
