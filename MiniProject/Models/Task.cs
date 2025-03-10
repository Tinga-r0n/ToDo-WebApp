namespace MiniProject.Models
{
    public class TodoTask
    {
        public int? id { get; set; }
        public string? title { get; set; }
        public string? description { get; set; }
        public int? priority_level { get; set; }
        public int? repetition { get; set; }
        public int? status { get; set; }
        public DateTime? due_date { get; set; }
        public int user_id { get; set; }
        public int? important { get; set; }
        public DateTime? start_date { get; set; }
        public string color_pick { get; set; }
        public string estimates {  get; set; }
        public string task_days { get; set; }

    }

    public class NoteRequest
    {
        public int TaskId { get; set; }
        public string Note { get; set; }
    }

    public class MarkTaskRequest
    {
        public int TaskId { get; set; }
        public int TimeSpent { get; set; }
    }

    public class Unplanned
    {
        public string? title { get; set; }
        public int user_id { get; set; }
        public string? description { get; set; }
        public int? time_spent { get; set; }
    }
    public class UndoTaskRequest
    {
        public int task_id { get; set; }
        public int is_unplaned { get; set; }
    }

    public class UserRegistrationRequest
    {
        public string FullName { get; set; }
        public string MobileNumber { get; set; }
        public string Email { get; set; }
        public string? Password { get; set; }
        public string Role { get; set; }
    }
    public class User
    {
        public int id { get; set; }
        public string name { get; set; }
        public string user_phone { get; set; }
        public string email { get; set; }
        public string password { get; set; }
        public string role { get; set; }
        public bool IsDefaultPassword { get; set; }
    }
    public class ChangePasswordRequest
    {
        public int UserId { get; set; }
        public string NewPassword { get; set; }
    }
    public class LogInRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }


    public class TaskNotificationDto
    {
        public int id { get; set; }
        public string title { get; set; }
        public DateTime? created_at { get; set; }
        public string Status { get; set; }
    }
    public class TaskItem
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Status { get; set; }
        public DateTime? Created { get; set; }
        public DateTime? Completed { get; set; }
        public string Name { get; set; }
    }
}
