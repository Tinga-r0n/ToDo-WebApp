using Org.BouncyCastle.Asn1;

namespace MiniProject.Queries
{
    public class QueryStrings
    {
        private static readonly object _InstanceLock = new();
        private static QueryStrings _Queries;

        public static QueryStrings Instance
        {
            get
            {
                if (_Queries == null)
                {
                    lock (_InstanceLock)
                    {
                        if (_Queries == null)
                        {
                            _Queries = new QueryStrings();
                        }
                    }
                }
                return _Queries;
            }
        }
        public string AddTask = "insert_task";
        public string AddAchievement = "add_achievement";
        public string DeleteTask = "delete_task";
        public string RecentTask = "recent_task";
        public string AllTask = "all_task";
        public string UpdtateTask = "update_task";
        public string Achievements = "achievements";
        public string MarkTask = "mark_task";
        public string CountTask = "get_counts";
        public string Note = "insert_note";
        public string Remarks = "insert_journal";
        public string GetNotes = "get_notes_by_task_id";
        public string DeleteUser = "Delete_User";
        public string CreateUser = "create_User";
        public string GetUserByEmail = "Get_User_By_Email";
        public string UpdateUserPassword = "update_UserPassword";
        public string GetAllUsers = "Get_All_Users";
        public string Notify = "Notif_task";
        public string AllAchievments = "All_Achievements";
        public string Update_status = "Update_task_status";
        public string Backlog = "Backlog_task";
        public string GetRemarks = "get_remark";
        public string GetInprogress = "Get_Inprogress_task";

    }
}
