using Dapper;
using Microsoft.AspNetCore.Mvc;
using MiniProject.Models;
using MiniProject.Queries;
using MySql.Data.MySqlClient;
using System.Data;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/{controller}")]
    public class AddRemarksController : Controller
    {
        [HttpPost]
        public IActionResult Index([FromBody] Remarks remarks)
        {
            if (remarks.Id <= 0 || remarks.Remarks_Text.Equals(string.Empty))
            {
                throw new Exception("MISSING_PARAMS");
            }

            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                var parameters = new DynamicParameters();
                parameters.Add("@p_user_id", remarks.Id);
                parameters.Add("@p_note", remarks.Remarks_Text);

                var result = conn.Execute(QueryStrings.Instance.Remarks, parameters, commandType: System.Data.CommandType.StoredProcedure);

                return Ok(new Response { code = "SUCCESS", message = "remarks successfully added!" });
            }
            catch (MySqlException myx)
            {
                return BadRequest(new Response { code = "MYSQL_ERROR", error = $"Error Details: {myx.Message}" });
            }
            catch (Exception ex)
            {
                if (ex.Message.Contains("MISSING_PARAMS"))
                {
                    return BadRequest(new Response { code = "ERROR", error = "missing remarks data." });
                }
                return BadRequest(new Response { code = "ERROR", error = $"Error Details: {ex.Message}" });
            }
        }


        [HttpGet("{userId}")]
        public IActionResult GetRemarks(int userId, [FromQuery] string date)
        {
            try
            {
                using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
                conn.Open();

                // If date is not provided, use today's date
                string formattedDate = string.IsNullOrEmpty(date) ? DateTime.UtcNow.ToString("yyyy-MM-dd") : date;

                var parameters = new { p_userId = userId, p_date = formattedDate };

                // Use the stored procedure name from QueryStrings instance
                string remark = conn.QueryFirstOrDefault<string>(
                    QueryStrings.Instance.GetRemarks,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                if (remark == null)
                {
                    return Ok(new { code = "NO_REMARKS", remark = "" });
                }

                return Ok(new { code = "SUCCESS", remark });
            }
            catch (MySqlException myx)
            {
                return BadRequest(new Response { code = "MYSQL_ERROR", error = $"Error Details: {myx.Message}" });
            }
        }
    }


    }
