using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MySql.Data.MySqlClient;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/{controller}")]
    public class AchievementsController : Controller
    {
        [HttpGet("{userId}")] // Accept userId as a route parameter
        public IActionResult Index(int userId, string date)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                // Define parameters
                var parameters = new { p_user_id = userId, p_created_date = date };

                // Fetch achievements for the specific user
                var achievements = conn.Query<dynamic>(
                    QueryStrings.Instance.Achievements,
                    parameters,
                    commandType: System.Data.CommandType.StoredProcedure
                );

                return Ok(new Response { code = "SUCCESS", message = "Successfully retrieved achievements.", data = achievements });
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

        [HttpGet("getAll")]
        public IActionResult GetAchievements(int userId)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                // Define parameters
                var parameters = new { p_user_id = userId };

                // Fetch achievements for the specific user
                var achievements = conn.Query<dynamic>(
                    QueryStrings.Instance.AllAchievments,
                    parameters,
                    commandType: System.Data.CommandType.StoredProcedure
                );

                return Ok(new Response { code = "SUCCESS", message = "Successfully retrieved achievements.", data = achievements });
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




        [HttpPost("AddAchievement")]

        public IActionResult AddAchievement([FromBody] Unplanned task)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();

                //Adding Title
                parameters.Add("@p_user_id", task.user_id);
                parameters.Add("@p_title", task.title);
                parameters.Add("@p_description", task.description);

                parameters.Add("@p_time_spent", task.time_spent);

                conn.Execute(Queries.QueryStrings.Instance.AddAchievement, parameters, commandType: System.Data.CommandType.StoredProcedure);
                return Ok(new Response { code = "SUCCESS", message = "Successfully Save." });
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

        [HttpPost("UndoTask")]
        public IActionResult UndoTask([FromBody] UndoTaskRequest request)
        {
            try
            {
                using (var connection = new MySqlConnection(Connection.Instance.ConnectionString))
                {
                    connection.Open();

                    // Check if the task is unplanned before undoing
                    var isUnplanned = connection.QuerySingleOrDefault<int>(
                        "SELECT is_unplaned FROM `tg_todo_app`.`task` WHERE id = @task_id",
                        new { task_id = request.task_id }
                    );

                    if (isUnplanned == 1)
                    {
                        return BadRequest(new Response { code = "ERROR", message = "This task cannot be undone because it is unplanned." });
                    }

                    // Proceed to undo the task
                    connection.Execute("CALL undo_task(@task_id)", new { task_id = request.task_id });

                    return Ok(new Response { code = "SUCCESS", message = "Task undone successfully!" });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }
    }
    }
