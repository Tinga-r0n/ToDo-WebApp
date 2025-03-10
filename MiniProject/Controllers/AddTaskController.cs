using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MySql.Data.MySqlClient;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/{controller}")]
    public class AddTaskController : ControllerBase
    {
        [HttpPost]

        public IActionResult AddTask([FromBody] TodoTask task)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();

                //Adding Title
                parameters.Add("@p_title", task.title);
                parameters.Add("@p_description", task.description);

                //Adding Priority Level
                int priorityLevel = (int)((task.priority_level.HasValue) ? task.priority_level : 1);
                parameters.Add("@p_priority_level", priorityLevel);

                //Adding Repetition
                int repetition = (int)((task.repetition.HasValue) ? task.repetition : 1);
                parameters.Add("@p_repetition", repetition);

                //Adding Due Date
                DateTime date = (DateTime)(task.due_date.HasValue ? task.due_date : DateTime.Now);
                parameters.Add("@p_due_date", date);

                //Adding User Id
                parameters.Add("@p_user_id", task.user_id);

                //Adding important field
                int important = (int)((task.important.HasValue) ? task.important : 0);
                parameters.Add("@p_important", important);

                //add start date
                parameters.Add("@p_start_date", task.start_date);

                //add color_pick
                parameters.Add("@p_color_pick", task.color_pick);

                //add estimates
                parameters.Add("@p_estimates", task.estimates);
                parameters.Add("@p_task_days", task.task_days);

                conn.Execute(Queries.QueryStrings.Instance.AddTask, parameters, commandType: System.Data.CommandType.StoredProcedure);
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

        // New API for Adding a Note
        [HttpPost("add-note")]
        public IActionResult AddNote([FromBody] NoteRequest request)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@p_task_id", request.TaskId);
                parameters.Add("@p_note", request.Note);

                // Execute Stored Procedure for Adding Note
                conn.Execute(Queries.QueryStrings.Instance.Note, parameters, commandType: System.Data.CommandType.StoredProcedure);

                return Ok(new Response { code = "SUCCESS", message = "Note added successfully." });
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
    

    [HttpGet("get-notes/{taskId}")]
        public IActionResult GetNotes(int taskId)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@p_task_id", taskId);

                var notes = conn.Query(Queries.QueryStrings.Instance.GetNotes, parameters, commandType: System.Data.CommandType.StoredProcedure).ToList();

                return Ok(new Response { code = "SUCCESS", data = notes });
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

