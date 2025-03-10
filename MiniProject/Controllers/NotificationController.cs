using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Dapper;
using MiniProject.Models;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationController : ControllerBase
    {

        private readonly string _connectionString = Connection.Instance.ConnectionString;

        [HttpGet("NotifyTasks")]
        public async Task<IActionResult> NotifyTasks([FromQuery] int userId)
        {
            using var connection = new MySqlConnection(_connectionString);
            var parameters = new { UserId = userId };
            string procedure = QueryStrings.Instance.Notify;
            var notifications = await connection.QueryAsync<TaskNotificationDto>(
                procedure, 
                parameters,
                commandType: System.Data.CommandType.StoredProcedure
            );


            return Ok(notifications);
        }


    //    [HttpPost("MarkAsRead")]
    //    public async Task<IActionResult> MarkNotificationsAsRead(int userId)
    //    {
    //        try
    //        {
    //            using var connection = new MySqlConnection(_connectionString);
    //            string query = @"UPDATE task SET is_read = 1 WHERE user_id = @UserId AND is_read = 0";

    //            int affectedRows = await connection.ExecuteAsync(query, new { UserId = userId });

    //            return Ok(new { message = "Notifications marked as read", affected = affectedRows });
    //        }
    //        catch (Exception ex)
    //        {
           
    //            return StatusCode(500, "An error occurred while updating notifications.");
    //        }
    //    }
    }

}
