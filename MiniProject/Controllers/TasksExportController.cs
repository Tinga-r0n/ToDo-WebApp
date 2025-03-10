using Dapper;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Globalization;
using System.IO;
using System.Text;
using MiniProject.Models;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

using MiniProject.Queries;
namespace MiniProject.Controllers
{

    [Route("api/TasksExport")]
    [ApiController]
    public class TasksExportController : ControllerBase
    {

        [HttpGet("DownloadCsv")]
        public async Task<IActionResult> DownloadCsv([FromQuery] int userId, [FromQuery] bool todayOnly = false)
        {
            IEnumerable<TaskItem> tasks;

            using MySqlConnection conn = new MySqlConnection(Connection.Instance.ConnectionString);
            conn.Open();

            string storedProc = todayOnly ? "getToday_CSV" : "getAll_CSV";

            var parameters = new DynamicParameters();
            parameters.Add("p_user_id", userId, DbType.Int32);

            tasks = (await conn.QueryAsync<TaskItem>(storedProc, parameters, commandType: CommandType.StoredProcedure))
                .Select(task => new TaskItem
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Status = task.Status,
                    Created = task.Created == DateTime.MinValue ? null : task.Created,
                    Completed = task.Completed == DateTime.MinValue ? null : task.Completed,
                    Name = task.Name
                })
                .ToList();

            if (tasks == null || !tasks.Any())
            {
                return NotFound("No tasks found.");
            }

            var csvData = GenerateCsv(tasks);
            var fileName = todayOnly ? $"Tasks_Today_{DateTime.Now:yyyyMMdd}.csv" : $"All_Tasks_{DateTime.Now:yyyyMMdd}.csv";

            return File(Encoding.UTF8.GetBytes(csvData), "text/csv", fileName);
        }


        private string GenerateCsv(IEnumerable<TaskItem> tasks)
        {
            var csvBuilder = new StringBuilder();
            csvBuilder.AppendLine("ID,Title,Description,Status,Created,Completed,Name");

            foreach (var task in tasks)
            {
                string createdAt = task.Created?.ToString("yyyy-MM-dd") ?? "";
                string completedAt = task.Completed?.ToString("yyyy-MM-dd") ?? "";

                csvBuilder.AppendLine($"{task.Id},\"{task.Title}\",\"{task.Description}\",{task.Status},\"{createdAt}\",\"{completedAt}\",\"{task.Name}\"");
            }

            return csvBuilder.ToString();
        }


    }
}