using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Dapper;
using MySql.Data.MySqlClient;
using System;
using System.Data;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;

using MiniProject.Models;
using System.Text;
using System.Security.Cryptography;
using MiniProject.Queries;

namespace MiniProject.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LogInController : ControllerBase
    {
        private readonly ILogger<LogInController> _logger;
        private readonly IConfiguration _configuration;

        public LogInController(ILogger<LogInController> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LogInRequest model)
        {
            using (var connection = new MySqlConnection(Connection.Instance.ConnectionString))
            {
                try
                {
                    string procedure = QueryStrings.Instance.GetUserByEmail;
                    var user = await connection.QueryFirstOrDefaultAsync<User>(
                        procedure,
                        new { userEmail = model.Email },
                        commandType: CommandType.StoredProcedure
                    );

                    if (user == null || !VerifyPassword(model.Password, user.password))
                    {
                        return Unauthorized(new { code = "ERROR", message = "Invalid email or password" });
                    }


                    bool isDefaultPassword = user.password.StartsWith("donedash");



                    var cookieOptions = new CookieOptions
                    {
                        HttpOnly = false, 
                        Secure = true, 
                        Expires = DateTime.UtcNow.AddDays(1), 
                        SameSite = SameSiteMode.Strict 
                    };


                    Response.Cookies.Append("UserAuth", $"{user.id}|{user.role}|{user.email}|{isDefaultPassword}", cookieOptions);

                    return Ok(new
                    {
                        code = "SUCCESS",
                        message = "Login successful",
                        isDefaultPassword = isDefaultPassword,
                        userId = user.id,
                        role = user.role,
                        email = user.email

                    });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Login error");
                    return StatusCode(500, new { code = "ERROR", message = ex.Message });
                }
            }
        }


        private bool VerifyPassword(string inputPassword, string storedPassword)
        {
            // If stored password starts with "donedash", treat it as plaintext
            if (storedPassword.StartsWith("donedash"))
            {
                return inputPassword == storedPassword; // Direct string comparison
            }

            // Otherwise, treat it as a hashed password
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(inputPassword);
                byte[] inputHashBytes = sha256.ComputeHash(inputBytes);
                string inputHash = BitConverter.ToString(inputHashBytes).Replace("-", "").ToLower();

                return inputHash == storedPassword;
            }
        }

        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest model)
        {
            try
            {

                if (!Request.Cookies.TryGetValue("UserAuth", out string userAuth))
                {
                    return Unauthorized(new { code = "ERROR", message = "User not logged in" });
                }


                string[] parts = userAuth.Split('|');
                if (parts.Length < 3)
                {
                    return Unauthorized(new { code = "ERROR", message = "Invalid cookie format" });
                }

                if (!int.TryParse(parts[0], out int userId))
                {
                    return BadRequest(new { code = "ERROR", message = "Invalid user ID" });
                }

                using (var connection = new MySqlConnection(Connection.Instance.ConnectionString))
                {

                    string procedure = QueryStrings.Instance.UpdateUserPassword;

                    int rowsAffected = await connection.ExecuteAsync(procedure,
                        new { p_user_id = userId, p_new_password = HashPassword(model.NewPassword) }
                    );

                    if (rowsAffected > 0)
                    {
                        return Ok(new { code = "SUCCESS", message = "Password changed successfully" });
                    }
                    return BadRequest(new { code = "ERROR", message = "Password update failed" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Change password error");
                return StatusCode(500, new { code = "ERROR", message = "An error occurred while changing the password" });
            }
        }



        private string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] inputBytes = Encoding.UTF8.GetBytes(password);
                byte[] inputHashBytes = sha256.ComputeHash(inputBytes);
                return BitConverter.ToString(inputHashBytes).Replace("-", "").ToLower();
            }

        }

        public IActionResult Logout()
        {
            Response.Cookies.Delete("UserAuth"); 
            return RedirectToAction("Login", "Home");
        }
    } 
}
