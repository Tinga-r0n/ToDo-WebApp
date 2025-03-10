using Microsoft.AspNetCore.Mvc;
using System.Security.Cryptography;
using System.Text;
using Dapper;
using MySql.Data.MySqlClient;
using MiniProject.Models;
using MiniProject.Queries;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Data;

namespace MiniProject.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly IConfiguration _configuration;

        public UserController(IConfiguration configuration)
        {
            _configuration = configuration;
        }


        private MySqlConnection GetConnection()
        {
            return new MySqlConnection(Connection.Instance.ConnectionString);
            
        }

        [HttpPost("register")]
        public async Task<IActionResult> RegisterUser([FromBody] UserRegistrationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.FullName) || string.IsNullOrWhiteSpace(request.MobileNumber) ||
                string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Role))
            {
                return BadRequest(new { message = "All fields are required." });
            }

            // Generate a default password if empty
            request.Password ??= GenerateDefaultPassword();

            //string hashedPassword = HashPassword(request.Password);

            using (var connection = GetConnection())
            {
                var parameters = new
                {
                    p_full_name = request.FullName,
                    p_mobile_number = request.MobileNumber,
                    p_email = request.Email,
                    p_password = request.Password,
                    p_role = request.Role
                };

                string procedure = QueryStrings.Instance.CreateUser;

                var result = await connection.ExecuteAsync(procedure, parameters, commandType: CommandType.StoredProcedure);

                if (result > 0)
                {
                    return Ok(new { message = "User registered successfully!", defaultPassword = request.Password });
                }
                return BadRequest(new { message = "Failed to register user." });
            }
        }

        // C# Function to Generate Default Password
        private string GenerateDefaultPassword()
        {
            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            Random random = new();
            string randomPart = new string(Enumerable.Repeat(chars, 4)
                .Select(s => s[random.Next(s.Length)]).ToArray());

            return "donedash" + randomPart;
        }


        [HttpGet("get-users")]
        public async Task<IActionResult> GetUsers()
        {
            using (var connection = GetConnection())
            {
                string procedure = QueryStrings.Instance.GetAllUsers;
                var users = await connection.QueryAsync<User>(procedure, commandType: CommandType.StoredProcedure);

                if (users == null || !users.Any())
                {
                    return NotFound(new { message = "No users found." });
                }

                return Ok(users);
            }
        }



        [HttpDelete("delete-user/{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            using (var connection = new MySqlConnection(Connection.Instance.ConnectionString))
            {
                try
                {
                    string procedure = QueryStrings.Instance.DeleteUser;
                    var parameters = new { userId = id };

                    int rowsAffected = await connection.ExecuteAsync(procedure, parameters);

                    if (rowsAffected > 0)
                    {
                        return Ok(new { code = "SUCCESS", message = "User deleted successfully" });
                    }
                    else
                    {
                        return NotFound(new { code = "ERROR", message = "User not found" });
                    }
                }
                catch (Exception ex)
                {
                    return StatusCode(500, new { code = "ERROR", message = ex.Message });
                }
            }
        }


        private string HashPassword(string password)
        {
            using (SHA256 sha256 = SHA256.Create())
            {
                byte[] bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                StringBuilder builder = new StringBuilder();
                foreach (byte b in bytes)
                {
                    builder.Append(b.ToString("x2"));
                }
                return builder.ToString();
            }
        }
    }


}
