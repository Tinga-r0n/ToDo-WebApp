using Microsoft.AspNetCore.Mvc;
using Dapper;
using MiniProject.Models;
using MySql.Data.MySqlClient;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UpdateTaskController : ControllerBase
    {
        [HttpPatch("{id}")]
        public IActionResult UpdateTask(int id, [FromBody] TodoTask task)
        {
            if (task == null || id != task.id)
            {
                throw new Exception("MISSING_PARAMS");
            }

            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@p_task_id", id);
                parameters.Add("@p_title", task.title);
                parameters.Add("@p_description", task.description);
                parameters.Add("@p_priority_level", task.priority_level);
                parameters.Add("@p_repetition", task.repetition);
                parameters.Add("@p_due_date", task.due_date);
                parameters.Add("@p_user_id", task.user_id);
                int important = task.important.HasValue ? task.important.Value : 0;
                parameters.Add("@p_important", important);
                parameters.Add("@p_color_pick", task.color_pick);
                parameters.Add("@p_estimates", task.estimates);
                parameters.Add("@p_task_days", task.task_days);
                parameters.Add("@p_start_date", task.start_date);


                conn.Execute(QueryStrings.Instance.UpdtateTask, parameters, commandType: System.Data.CommandType.StoredProcedure);
                return Ok(new Response { code = "SUCCESS", message = "Task updated successfully." });
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
    }
}
