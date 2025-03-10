document.addEventListener("DOMContentLoaded", function () {


    const form = document.querySelector("form");
  const repetitionDropdown = document.getElementById("repetitionDropdown");
  const priorityItems = document.querySelectorAll(
    ".priority-options .dropdown-item"
  );
  let selectedRepetition = 1;
  let selectedPriority = "Medium";

    function getCookie(name) {
        let match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
        return match ? decodeURIComponent(match[2]) : null;
    }

    reloadAll();

    function getUserId() {
        let userAuth = getCookie("UserAuth");
        if (userAuth) {
            let userId = userAuth.split("|")[0];
            return userId || 4;
        }
        return 4; // Default value if cookie is not found
    }

    const Base_Url = (window.location.origin.includes("localhost")) ? window.location.origin : window.location.origin + "/DoneDash";

    function fetchNotifications() {
        let userId = getUserId();

        $.ajax({
            url: `${Base_Url}/api/Notification/NotifyTasks?userId=${userId}`,
            type: "GET",
            success: function (notifications) {
                let notificationList = $("#notificationList");
                let notificationCount = $("#notificationCount");

                notificationList.empty();

                let unreadCount = 0; 

                if (notifications.length === 0) {
                    notificationList.append('<li class="dropdown-item text-center text-muted">No notifications</li>');
                    notificationCount.hide(); 
                } else {
                    notifications.forEach(task => {
                        let created_at = new Date(task.created_at);
                        if (!isNaN(created_at.getTime())) { 
                            let dueClass = task.status === "Overdue" ? "text-danger" : "text-warning";
                            let checked = task.is_read ? "checked" : ""; 

                            if (!task.is_read) {
                                unreadCount++; 
                            }

                            let listItem = `
                            <li class="dropdown-item ${dueClass}">

                               Need to be done task <strong>${task.title} -  ${created_at.toLocaleDateString()}</strong>
                            </li>`;
                            notificationList.append(listItem);
                        } else {
                            console.error("Invalid date:", task.created_at);
                        }
                    });

                 
                    if (unreadCount > 0) {
                        notificationCount.text(unreadCount).show(); 
                    } else {
                        notificationCount.hide(); 
                    }                
                
                }
            },
            error: function () {
                console.error("Failed to fetch notifications");
            }
        });
    }

    // Mark a specific notification as read
    //function markNotificationAsRead(taskId) {
    //    $.ajax({
    //        url: `/api/Notification/MarkAsRead?taskId=${taskId}`,
    //        type: "POST",
    //        success: function () {
    //            console.log(`Notification ${taskId} marked as read`);
    //            fetchNotifications(); // Refresh the list
    //        },
    //        error: function () {
    //            console.error(`Failed to mark notification ${taskId} as read`);
    //        }
    //    });
    //}

    // Fetch notifications on page load
    $(document).ready(function () {
        fetchNotifications();
    });



    function formatDateForMySQL(date) {
        return date.toISOString(); // Ensures proper format
    }


    // Function to update displayed date and fetch tasks
    function updateDateSelection(selectedDate) {
        if (!(selectedDate instanceof Date) || isNaN(selectedDate)) {
            console.error("Invalid date selected!");
            return;
        }
        let formattedUserDate = selectedDate.toDateString();
        let formattedMySQLDate = formatDateForMySQL(selectedDate);

        $("#datepickeriz").val(formattedUserDate);
    }


    // Initialize with today's date
    let selectedDate = new Date();
    updateDateSelection(selectedDate);

    // Prev/Next buttons functionality
    $("#prevDate").click(function () {
        selectedDate.setDate(selectedDate.getDate() - 1); // Previous day
        updateDateSelection(selectedDate);
    });

    $("#nextDate").click(function () {
        selectedDate.setDate(selectedDate.getDate() + 1); // Next day
        updateDateSelection(selectedDate);
    });

    // Date Picker (When clicking the date input field)



    document
        .querySelectorAll("#repetitionDropdown .dropdown-item")
        .forEach((item) => {
            item.addEventListener("click", function (event) {
                event.preventDefault();
                selectedRepetition = parseInt(event.target.textContent);
                document.getElementById("repetitionbutton").textContent =
                    event.target.textContent;
            });
        });

    priorityItems.forEach((item) => {
        item.addEventListener("click", function (event) {
            event.preventDefault();
            selectedPriority = event.target.textContent;
            document.getElementById("prioritybutton").textContent =
                event.target.textContent;
        });
    });

        $("form").off("submit").on("submit", function (event) {
            event.preventDefault(); 

            const selectedDays = [];
            const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
            days.forEach(day => {
                if ($("#" + day).hasClass('active')) selectedDays.push(day.toUpperCase());
            });

            const taskDays = selectedDays.join('|');

            const habit = $("#habit-type:checked").length;
       
            const todoData = {



                title: $("#recipient-name").val(),
                description: $("#message-desc").val(),
                priority_level:
                    selectedPriority === "High" ? 3 : selectedPriority === "Medium" ? 2 : 1,
                repetition: selectedRepetition,
                due_date: $("#dueDate").val(),
                user_id: getUserId(),
                important: $("#habit-type:checked").length > 0 ? 1 : 0,
                estimates: $("#timeEstimates").val(),  
                start_date: formatDateForMySQL(selectedDate),
                color_pick: $("#myColor").val(),

                task_days: taskDays,
            };
            console.log("todoData:", JSON.stringify(todoData));
            if (!todoData.start_date || isNaN(new Date(todoData.start_date))) {
                console.error("Invalid start_date:", todoData.start_date);
                alert("Invalid start date. Please select a valid date.");
                return;
            }


            $.ajax({
                url: `${Base_Url}/api/AddTask`,
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify(todoData),
                success: function (response) {
                    if (response.code === "SUCCESS") {
                        $("#successModal").modal("show"); 
                        setTimeout(function () {
                            $("#successModal").modal("hide"); // Hide the success modal after 2 seconds
                        }, 2000);
                        reloadAll();
                        $("form")[0].reset();
                        $("#staticBackdrop").modal("hide"); 
                      
                    } else {
                        alert("Error: " + response.error);
                        $("#errorModal .modal-body").text("Error: " + response.error); // Set error message
                        $("#errorModal").modal("show"); // Show error modal
                        setTimeout(function () {
                            $("#errorModal").modal("hide"); // Hide the success modal after 2 seconds
                        }, 2000);
                    }
                },
                error: function (xhr, status, error) {
                    console.error("Error:", error);
                    $("#errorModal .modal-body").text("Something went wrong!");
                    $("#errorModal").modal("show"); 
                    setTimeout(function () {
                        $("#errorModal").modal("hide"); 
                    }, 2000);
                },
            });
            console.log("todoData:", JSON.stringify(todoData));

        });
});

document.querySelector("form").addEventListener("submit", function (event) {
    const selectedDays = document.querySelectorAll(".btn-outline-danger.active");
    if (selectedDays.length === 0) {
        event.preventDefault();
        alert("Please select at least one task day.");
    }
});



function toggleActive(button, event) {
    event.preventDefault(); // Prevent any unexpected behavior
    const isActive = button.classList.contains('active');
    button.classList.toggle('active', !isActive);
    updateTaskDays();
}


function selectWeekdays() {
    const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri'];
    weekdays.forEach(day => document.getElementById(day).classList.add('active'));
    updateTaskDays();
}

function selectEveryday() {
    const allDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    allDays.forEach(day => document.getElementById(day).classList.add('active'));
    updateTaskDays();
}

function updateTaskDays() {
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const selectedDays = days.filter(day => document.getElementById(day).classList.contains('active')).map(day => day.toUpperCase());

    const taskDays = selectedDays.join('|');
   
}



//task View(recent,edit,delete)



//function fetchRecentTasks() {
//  fetch("/api/AllTask")
//    .then((response) => response.json())
//    .then((data) => {
//      if (data.code === "SUCCESS") {
//        populateTable(data.data);
//      } else {
//        console.error("Error fetching tasks:", data.error);
//      }
//    })
//    .catch((error) => console.error("Fetch error:", error));
//}


function formatDueDate(dueDateObj) {
  if (!dueDateObj || !dueDateObj.value) {
    return "No Due Date"; // Handle missing or invalid data
  }

  const date = new Date(dueDateObj.value); // Convert to JS Date object
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Function to format date for MySQL (YYYY-MM-DD HH:MM:SS)
$(document).ready(function () {
    // Function to format date for MySQL (YYYY-MM-DD HH:MM:SS)
    const Base_Url = (window.location.origin.includes("localhost")) ? window.location.origin : window.location.origin + "/DoneDash";
    function formatDateForMySQL(date) {
        return date.toISOString().split("T")[0] + " 00:00:00"; // MySQL format
    }

    // Function to update displayed date and fetch tasks
    function updateDateSelection(selectedDate) {
        let formattedUserDate = selectedDate.toDateString(); // Format for display
        let formattedMySQLDate = formatDateForMySQL(selectedDate); // Format for API

        $("#datepickeriz").val(formattedUserDate); // Update input display
        fetchAllTasks(formattedMySQLDate); // Fetch tasks for selected date
        fetchAchieveTask(selectedDate);
        fetchAllInprogressTasks(formattedMySQLDate);
    }

    // Initialize with today's date
    let selectedDate = new Date();
    updateDateSelection(selectedDate);

    // Prev/Next buttons functionality
    $("#prevDate").click(function () {
        selectedDate.setDate(selectedDate.getDate() - 1); // Previous day
        updateDateSelection(selectedDate);
    });

    $("#nextDate").click(function () {
        selectedDate.setDate(selectedDate.getDate() + 1); // Next day
        updateDateSelection(selectedDate);
    });

    // Date Picker (When clicking the date input field)
    $("#datepickeriz").datepicker({
        dateFormat: "DD, MM d, yy", // User-friendly format
        changeMonth: true,
        changeYear: true,
        onSelect: function (dateText, inst) {
            selectedDate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
            updateDateSelection(selectedDate);
        }
    });

// Fetch tasks by date
    function fetchAllTasks(created_at) {
        var userId = getUserId();

        if (!userId) {
            console.error("User ID not found! Please log in.");
            return;
        }


        fetch(`${Base_Url}/api/AllTask?user_id=${userId}&created_at=${encodeURIComponent(created_at)}`)
        .then((response) => response.json())
        .then((data) => {
       

            if (data.code === "SUCCESS") {
                allTasks = data.data || []; // Ensure data is always an array
                filteredTasks = [...allTasks];
        
              
                search = [...allTasks];

                populateTables(filteredTasks);

               
                populateTable(search);
            } else {
                console.error("Error fetching tasks:", data.error);
                populateTables([]); // Show "No tasks found" only when there are no tasks
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            populateTables([]); // Show "No tasks found" only if request fails
        });

    }

    function fetchAllInprogressTasks(created_at) {
        var userId = getUserId();

        if (!userId) {
            console.error("User ID not found! Please log in.");
            return;
        }


        fetch(`${Base_Url}/api/AllTask/GetInpro?user_id=${userId}&created_at=${encodeURIComponent(created_at)}`)
            .then((response) => response.json())
            .then((data) => {
            

                if (data.code === "SUCCESS") {
                    allTasks = data.data || []; // Ensure data is always an array
             
                    taskIn = [...allTasks];

                    search = [...allTasks];

                    
                    populateInprogressTables([]);
                    populateInprogressTables(taskIn);

                    populateTable(search);
                } else {
                    console.error("Error fetching tasks:", data.error);
                    populateInprogressTables([]);// Show "No tasks found" only when there are no tasks
                }
            })
            .catch((error) => {
                console.error("Fetch error:", error);
                populateInprogressTables([]); // Show "No tasks found" only if request fails
            });

    }


    function fetchAchieveTask(selectedDate) {
        let userId = getUserId(); // Get user ID

        if (!userId) {
            console.log("User ID is required to fetch achievements.", userId);
            return;
        }
        let formattedDate = formatDateForMySQL(selectedDate);

        fetch(`${Base_Url}/api/Achievements/${userId}?date=${formattedDate}`) // Pass userId in the URL
            .then((response) => response.json())
            .then((data) => {
                if (data.code === "SUCCESS") {
                    populateAchievementTables(data.data);
                } else {
                    console.error("Error fetching achievements:", data.error);
                    populateAchievementTables([]);
                }
            })
            .catch((error) => console.error("Fetch error:", error));
    }

});

var Base_Url = (window.location.origin.includes("localhost")) ? window.location.origin : window.location.origin + "/DoneDash";
function fetchAllBacklogTasks(userId) {
    var userId = getUserId();

    if (!userId) {
        console.error("User ID not found! Please log in.");
        return;
    }

    fetch(`${Base_Url}/api/AllTask/backlog?user_id=${userId}`)
        .then((response) => response.json())
        .then((data) => {
         

            if (data.code === "SUCCESS") {
                allTasks = data.data || []; // Ensure data is always an array

                // 🔹 Exclude tasks that are in progress
                backlog = allTasks.filter(task => task.task_status !== "IN PROGRESS");

                populateBacklogTables(backlog);
            } else {
                console.error("Error fetching tasks:", data.error);
                populateBacklogTables([]); // Show "No tasks found" if error
            }
        })
        .catch((error) => {
            console.error("Fetch error:", error);
            populateBacklogTables([]); // Show "No tasks found" if request fails
        });
}


function fetchAllAchievements(userId) {
    var userId = getUserId(); 
    if (!userId) {
        console.log("User ID is required to fetch achievements.", userId);
        return;
    }

    fetch(`${Base_Url}/api/Achievements/getAll?userId=${userId}`) // ✅ Calls `getAll`
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            if (data.code === "SUCCESS") {
                populateAllAchievementTables(data.data);
            } else {
                console.error("Error fetching achievements:", data.error);
                populateAllAchievementTables([]);
            }
        })
        .catch((error) => console.error("Fetch error:", error));
}


function formatDueDate(dueDateObj) {
  if (!dueDateObj || !dueDateObj.value) {
    return "No Due Date"; 
  }

  const date = new Date(dueDateObj.value); 
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Function to get userId from cookies
function getUserId() {
    let userAuth = getCookie("UserAuth");
    if (userAuth) {
        let userId = userAuth.split("|")[0]; // Extract userId from cookie
  
        return userId || 4; // Default to 4 if userId is missing
    }
    return 4; // Default User ID
}


// Utility function to get cookies
function getCookie(name) {
    let cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        let [cookieName, cookieValue] = cookies[i].split("=");
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}



function undoTask(taskId) {
    const payload = {
        task_id: taskId  // Ensure this matches the backend parameter name
    };



    fetch(`${Base_Url}/api/Achievements/UndoTask`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
        .then(response => response.json())
        .then(data => {
            if (data.code === 'SUCCESS') {
             

                showToast("Task has been undone successfully!", "success");
            } else {
        
                showToast("This task is unplanned cannot be undone!","error");
            }
        })
        .catch(error => {
           
            showToast("This task is unplanned cannot be undone!" + error.message, "error");
        });
}

function populateAllAchievementTables(tasks) {
    const tableBody = document.getElementById("AllAchievementBody");
    tableBody.innerHTML = ""; // Clear existing rows

    if (tasks.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; font-weight: bold; color: gray;">
          No Acomplish found
        </td>
      </tr>
    `;
        return;
    }


    const accomplishedTasks = tasks;

    accomplishedTasks.forEach((task) => {
       

        if (!task.id) {
            console.warn("Task ID is missing!", task);
            return;
        }
        const priorityText = getPriorityText(task.priority_level); // Convert number to text
        const styles = getPriorityStyles(task.priority_level);
        const formattedDate = formatCreatedAt(task.created_at.value);

        let row = `
    <tr style="border-radius: 15px; overflow: hidden;" class="fw-normal">
  <!-- Task Title & Description -->
  <td style="color: black; max-width: 90px;" scope="col" class="text-start">
    <div style="padding-bottom: 10px" class="d-flex flex-column">
      <label style="font-size: 13px; font-weight: 600; word-wrap: break-word; white-space: normal;" class="form-check-label">
        ${task.title}
      </label>
      <label style="font-size: 12px; color: gray; max-width: 140px; font-weight: normal; word-wrap: break-word; white-space: normal;">
        ${task.description}
      </label> 
      <label style="padding-top: 10px; font-size: 12px; color: black; max-width: 120px; font-weight: normal; word-wrap: break-word; white-space: normal;">
        ${formatTime(task.time_spent)} <span style="color: #000; font-weight: normal">Spent</span>
      </label>
         ${
            task.is_unplaned === 1
                ? `<label style="padding-top: 5px; font-size: 10px; color: red; max-width: 120px; font-weight: bold;">
                    Unplanned Task
                  </label>`
                : ""
            }
    </div>
  </td>

  <!-- Status & Undo Button -->
  <td class="align-top text-start">
    <div class="d-flex flex-column justify-content-between align-items-end" style="height: 70px;">
      <h6 class="mb-0">
        ${task.status !== 1
                ? '<span class="badge text-light"><i class="bi bi-clock-history"></i> In Progress </span>'
                : '<span style="border-radius: 5px; padding: 3px 5px; font-size: 12px; color: #1FAB89; background-color:#D7FBE8;"><i class="bi bi-check2"></i> Completed </span>'
            }
      </h6>
     <div style="display: flex; align-items: center; gap: 5px;">
               <h6 class="mb-0">
                            <span class="badge" style="border-radius: 5px; padding: 3px 5px; font-size: 12px; color:#DC2626; background-color:#FEE2E2;">
                                <i class="bi bi-clock-history"></i> ${formattedDate}
                            </span>
                        </h6>
                
          </div>
      
    </div>
  </td>
</tr>
        `;
        tableBody.innerHTML += row;
    });
}

// Function to format the date as "Fri, Feb 21"
function formatCreatedAt(dateString) {
    if (!dateString) return ""; // Handle empty or undefined dates

    const date = new Date(dateString); // Convert string to Date object

    return date.toLocaleDateString("en-US", {
        weekday: "short", // "Fri"
        month: "short",   // "Feb"
        day: "2-digit"    // "21"
    });
}

function populateAchievementTables(tasks) {
  const tableBody = document.getElementById("achievementsTable");
  tableBody.innerHTML = ""; // Clear existing rows

    if (tasks.length === 0) {
        tableBody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 20px; font-weight: bold; color: gray;">
          No Acomplish found
        </td>
      </tr>
    `;
        return;
    }


  const accomplishedTasks = tasks;

    accomplishedTasks.forEach((task) => {
       

        if (!task.id) {
            console.warn("Task ID is missing!", task);
            return;
        }
    const priorityText = getPriorityText(task.priority_level); // Convert number to text
    const styles = getPriorityStyles(task.priority_level);

      let row = `
    <tr style="border-radius: 15px; overflow: hidden;" class="fw-normal">
  <!-- Task Title & Description -->
  <td style="color: black; max-width: 90px;" scope="col" class="text-start">
    <div style="padding-bottom: 10px" class="d-flex flex-column">
      <label style="font-size: 13px; font-weight: 600; word-wrap: break-word; white-space: normal;" class="form-check-label">
        ${task.title}
      </label>
      <label style="font-size: 12px; color: gray; max-width: 140px; font-weight: normal; word-wrap: break-word; white-space: normal;">
        ${task.description}
      </label> 
      <label style="padding-top: 10px; font-size: 12px; color: black; max-width: 120px; font-weight: normal; word-wrap: break-word; white-space: normal;">
        ${formatTime(task.time_spent)} <span style="color: #000; font-weight: normal">Spent</span>
      </label>
       ${
          task.is_unplaned === 1
              ? `<label style="padding-top: 5px; font-size: 10px; color: red; max-width: 120px; font-weight: bold;">
                    Unplanned Task
                  </label>`
              : ""
            }
    </div>
  </td>

  <!-- Status & Undo Button -->
  <td class="align-top text-start">
    <div class="d-flex flex-column justify-content-between align-items-end" style="height: 70px;">
      <h6 class="mb-0">
        ${task.status !== 1
              ? '<span class="badge text-light"><i class="bi bi-clock-history"></i> In Progress </span>'
          : '<span style="border-radius: 5px; padding: 3px 5px; font-size: 12px; color: #1FAB89; background-color:#D7FBE8;"><i class="bi bi-check2"></i> Completed </span>'
          }
      </h6>
     <div style="display: flex; align-items: center; gap: 5px;">
                  <button style="font-size: 12px" class="btn btn-light btn-sm mt-auto" onclick="undoTask(${task.id})">
                    <i class="bi bi-arrow-counterclockwise" title="Undo"></i> 
                  </button>
                  <button style="
                     color: #454B58;
                     background-color: #F0F2F4;
                     font-size: 18px;
                     border: none;
                    " class="menu-item" onclick="viewTask(${task.id})" title="View"><i class="bi bi-eye"></i></button>
          </div>
      
    </div>
  </td>
</tr>
        `;
    tableBody.innerHTML += row;
  });
}

function reloadAll() {

    fetchAllAchievements()
    fetchCounts();
    fetchAllBacklogTasks();

    

    
}
function getCookie(name) {
    let cookies = document.cookie.split("; ");
    for (let i = 0; i < cookies.length; i++) {
        let [cookieName, cookieValue] = cookies[i].split("=");
        if (cookieName === name) {
            return decodeURIComponent(cookieValue);
        }
    }
    return null;
}
function getUserId() {
    let userAuth = getCookie("UserAuth");
    if (userAuth) {
        let userId = userAuth.split("|")[0];
    
        return userId || 4; // Default to 4 if userId is missing
    }
    return 4; // Default User ID
}

function fetchCounts() {
    let userId = getUserId(); // Get the user ID from cookie
    if (!userId) {
        console.log("User ID is required to fetch task counts.", userId);
        return;
    }

    fetch(`${Base_Url}/api/GetCounts/${userId}`) // Pass userId in URL
        .then((response) => response.json())
        .then((data) => {
            if (data.code === "SUCCESS") {
                populateLabels(data.data);
            } else {
                console.error("Error fetching tasks:", data.error);
            }
        })
        .catch((error) => console.error("Fetch error:", error));
}

function populateLabels(counts) {
  const item = counts[0];
  let completed = document.getElementById("completedTask");
  let delayed = document.getElementById("delayedTask");
  let pending = document.getElementById("pendingTask");

  completed.innerHTML = "";
  completed.innerHTML = `Completed: ${item.completed_count}`;

  delayed.innerHTML = "";
  delayed.innerHTML = `Delayed: ${item.delayed_count}`;

  pending.innerHTML = "";
  pending.innerHTML = `Pending: ${item.pending_count}`;
}

function populateTable(tasks) {
    const tableBody = document.getElementById("MultipleDateTasksBody");
    tableBody.innerHTML = "";

    tasks.forEach((task) => {
        const priorityText = getPriorityText(task.priority_level);
        const styles = getPriorityStyles(task.priority_level);
        const splitDays = task.task_days ? task.task_days.split("|") : [];

        let row = `<tr>
        <td style="width: 20px; font-size: 14px" class="border-0">
        <div class="row">
            <div class="col d-flex align-items-center">
                ${(task.color_pick === null) ? `<i class="bi bi-circle-fill" style="margin-right: 8px; color: red; "></i>` :
                `<i class="bi bi-circle-fill" style="margin-right: 8px; color: ${task.color_pick}; "></i>`
                }
                ${task.title}
            </div>
        </div>
        </td>
        <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("MON")) ? `<i class="bi bi-square-fill" style="color: ${task.color_pick};"></i>`
            :
         ``
         } 
        </td>
         <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("TUE")) ? `<i class="bi bi-square-fill" style="color:  ${task.color_pick};"></i>`
                :
                ``
         }
        </td>
         <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("WED")) ? `<i class="bi bi-square-fill" style="color:  ${task.color_pick};"></i>`
                :
                ``
         }
        </td>
         <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("THU")) ? `<i class="bi bi-square-fill" style="color:  ${task.color_pick};"></i>`
                :
                ``
         }
        </td>
         <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("FRI")) ? `<i class="bi bi-square-fill" style="color:  ${task.color_pick};"></i>`
                :
                ``
         }
        </td>
         <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("SAT")) ? `<i class="bi bi-square-fill" style="color: ${task.color_pick};"></i>`
                :
                ``
         }
        </td>
         <td class="border-0" onclick="showConfirmModal('${task.id}')">
         ${(splitDays.includes("SUN")) ? `<i class="bi bi-square-fill" style="color:  ${task.color_pick}></i>`
                :
                ``
         }
        </td>
        </tr>
    `;

        tableBody.innerHTML += row;
    });
}
function toggleMenu(button) {
    const dropdown = button.nextElementSibling;

    if (dropdown.classList.contains("show")) {
        dropdown.classList.remove("show");
        setTimeout(() => {
            dropdown.style.display = "none";
        }, 300);
    } else {
        dropdown.style.display = "flex"; // Change to flex to align horizontally
        setTimeout(() => {
            dropdown.classList.add("show");
        }, 10);
    }
}




function searchTasks() {
    let searchValue = document.getElementById("searchInput").value.toLowerCase();

    if (searchValue === "") {
        filteredTasks = [...allTasks];
        search = [...allTasks];// ✅ Restore the original full list
    } else {
        filteredTasks = allTasks.filter(task =>
            task.title.toLowerCase().includes(searchValue) ||
            formatDueDate(task.due_date).toLowerCase().includes(searchValue) ||
            getPriorityText(task.priority_level).toLowerCase().includes(searchValue)
        );
    }

    populateTables(filteredTasks);
    populateTable(search); // ✅ Display results (either filtered or full list)
}


// Close the menu when clicking outside
document.addEventListener("click", function (event) {
    if (!event.target.matches(".menu-button")) {
        document.querySelectorAll(".menu-dropdown").forEach((menu) => {
            menu.style.display = "none";
        });
    }
});


function populateTables(tasks) {
   
    const tableBody = document.getElementById("AllTasksBody");
    tableBody.innerHTML = ""; // Clear existing rows

    if (tasks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; font-weight: bold; color: gray;">
                    No tasks found
                </td>
            </tr>
        `;
        return;
    }
    const currentDateUTC = new Date().toISOString().split("T")[0];
    tasks.forEach((task) => {
        const priorityText = getPriorityText(task.priority_level); // Convert number to text
        const styles = getPriorityStyles(task.priority_level);
        const currentStatus = task.task_status; 
        const statusClass = getStatusClass(currentStatus);
        const dueDate = new Date(task.due_date.value);
        const dueDateUTC = dueDate.toISOString().split("T")[0];// ✅ Ensure correct color
        const isDelayed = dueDateUTC < currentDateUTC && (currentStatus === "TODO" || currentStatus === "IN PROGRESS");

        const startD = task.start_date?.value ? new Date(task.start_date.value) : null;
        let startdAt = "";

        if (startD && !isNaN(startD.getTime())) {
            startdAt = startD.toISOString().split("T")[0];
        } else {
            console.error("Invalid start date:", task.start_date);
        }

     
        let statusBadge = "";
        const isCompletedStyle = currentStatus === "COMPLETED" ? "position: relative;" : "";
        if (currentStatus === "IN PROGRESS") {
            statusBadge = `<span class="badge bg-warning text-dark" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                <i class="bi bi-clock-history"></i> In Progress
            </span>`;
        } else if (currentStatus === "COMPLETED") {
            statusBadge = `<span class="badge bg-success text-light" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                <i class="bi bi-check2"></i> Completed
            </span>`;
        } else {
            statusBadge = `<span class="badge bg-secondary text-light" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                <i class="bi bi-list-task"></i> TODO
            </span>`;
        }

        let row = `
            <tr class="fw-normal" style="height: 80px">
                <td style="padding: 0; border: none;">
                    <div style="
                        display: flex;
                        flex-wrap: wrap;
                        align-items: center;
                        justify-content: space-between;
                        padding: 10px;
                        margin-bottom: 10px;
                        border-radius: 5px;
                        background-color: #fff;
                        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                        position: relative;
                        min-height: 80px;
                            ${isCompletedStyle}
                " class="${currentStatus === "COMPLETED" ? "completed-task" : ""}
                    ">
                        <div class="text-start" style="
                            flex: 0;
                            min-width: 80px;
                            overflow: hidden;
                            white-space: normal;
                            word-wrap: break-word;
                            margin-right: 10px;
                            text-align: center;
                            align-items: center;
                            gap: 10px;
                        ">
                            
                            <label style="display: flex; flex-direction: column;">
                                <strong>${task.title}</strong>
                                <span style="font-weight: normal; color: gray; font-size: 14px;">${task.description}</span>
                            </label>

                        </div>
                  <h6 class="mb-0" id="statusBadge${task.id}">
                    ${getStatusBadgeHTML(currentStatus)}
                </h6>
  
            <div style="position: relative; display: inline-block; padding: 10px;">
         <button
                    id="startButton${task.id}" 
                    class="btn btn-primary btn-sm start-btn" 
                    onclick="changeTaskStatus('${task.id}', 'IN PROGRESS')" 
                    style="display: ${task.task_status === 'TODO' && dueDateUTC !== startdAt ? 'inline-block' : 'none'};"
                >
                    Start
                </button>
              ${isDelayed ? `<span style="position: relative; bottom: 0; right: 0; font-size: 10px; color: red; font-weight: bold;">Delayed</span>` : ""}
            </div>
 
                    </div>
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });

    setupEditButtons();

}


function populateInprogressTables(tasks) {
 
    const tableBody = document.getElementById("InprogressTasksBody");
    tableBody.innerHTML = ""; // Clear existing rows

    // ✅ Filter tasks to show only those with status "IN PROGRESS"
    const inProgressTasks = tasks.filter(task => task.task_status === "IN PROGRESS");

    if (inProgressTasks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; font-weight: bold; color: gray;">
                    No Inprogress task found
                </td>
            </tr>
        `;
        return;
    }
    tableBody.innerHTML = "";
    inProgressTasks.forEach((task) => {
        const priorityText = getPriorityText(task.priority_level); // Convert number to text
        const styles = getPriorityStyles(task.priority_level);
        const currentStatus = task.task_status;
        const statusClass = getStatusClass(currentStatus); // ✅ Ensure correct color

        let statusBadge = `<span class="badge bg-warning text-dark" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                <i class="bi bi-clock-history"></i> In Progress
            </span>`;

        let row = `
        <tr class="fw-normal" style="height: 80px">
        <td style="padding: 0; border: none;">
          <div style="
              display: flex;
              flex-wrap: wrap;
              align-items: center;
              justify-content: space-between;
              padding: 10px;
              margin-bottom: 10px;
              border-radius: 5px;
              background-color: #fff;
              box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
              position: relative;
              min-height: 80px;
          ">
           <div class="text-start" style="
                flex: 0;
                min-width: 305px;
                overflow: hidden;
                white-space: normal;
                word-wrap: break-word;
                margin-right: 10px;
                text-align: center;
                align-items: center;
                gap: 10px;
                ">
                    <input style="flex-shrink: 0; width: 15px; height: 15px; align-self: center;" type="checkbox" class="form-check-input"   onclick="showConfirmModal('${task.id}', this)">
    
                  <label style=" display: flex; flex-direction: column;">
                    <strong>${task.title}</strong>
                    <span style="font-weight: normal; color: gray; font-size: 14px;">${task.description
                    }</span>
                </label>
            </div>
         
            <div class="text-center">
                <span style="padding: 3px 5px; border-radius: 5px; background-color: ${styles.bg}; color: ${styles.text};">
                    ${priorityText} 
                </span>
            </div>
          <div class="text-center">
            ${task.important ? getStarIcons(task.priority_level) : ""}
            </div>
                <div class="text-center">
             <h6 class="mb-0" id="statusBadge${task.id}">
         ${statusBadge}
     </h6>
            </div>


            <!-- Three-dot menu -->
            <div class="menu-container" style="position: relative;">
                <button class="menu-button" onclick="toggleMenu(this)">
                   &#x22EF; <!-- Three vertical dots -->
                </button>
                <div class="menu-dropdown" style="display: none; position: absolute; right: 0; top: 25px; background: white; border-radius: 5px; box-shadow: 0px 2px 5px rgba(0,0,0,0.2);">
                    <button style="  color: #0d6efd;
                    border: none;
                    background-color: rgb(13 110 253 / 0.11);
                    font-size: 18px;"
                class="menu-item" onclick="editTask(${task.id})"  title="Edit"><i class="bi bi-pencil"></i></button>
                    <button style="
                    color: #f41127;
                    background-color: rgb(244 17 39 / 0.11);
                    font-size: 18px;
                    border: none;
                    " class="menu-item" onclick="deleteTask(${task.id})" title="Delete"><i class="bi bi-trash"></i></button>
                    <button style="
                     color: #454B58;
                     background-color: F0F2F4;
                     font-size: 18px;
                     border: none;
                    " class="menu-item" onclick="viewTask(${task.id})" title="View"><i class="bi bi-eye"></i></button>
                </div>
            </div>
            
          </div>
        </td>
      </tr>
        `;
        tableBody.innerHTML += row;
    });

    setupEditButtons();
  
}

function populateBacklogTables(tasks) {
 
    const tableBody = document.getElementById("BacklogTasksBody");
    tableBody.innerHTML = ""; // Clear existing rows

    // ✅ Sort tasks in ascending order based on created_at


    if (tasks.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 20px; font-weight: bold; color: gray;">
                    No tasks found
                </td>
            </tr>
        `;
        return;
    }
    const currentDateUTC = new Date().toISOString().split("T")[0];
    tasks.forEach((task) => {
   
        const priorityText = getPriorityText(task.priority_level);
        const styles = getPriorityStyles(task.priority_level);
        const currentStatus = task.task_status;
        const dueDate = new Date(task.due_date.value);
        const dueDateUTC = dueDate.toISOString().split("T")[0];

        const isDelayed = dueDateUTC < currentDateUTC && currentStatus === "TODO";


        // ✅ Apply strikethrough only to the container div if task is completed
        const isCompletedStyle = currentStatus === "COMPLETED" ? "position: relative;" : "";

        let row = `
        <tr class="fw-normal" style="height: 80px">
            <td style="padding: 0; border: none;">
                <div style="
                    display: flex;
                    flex-wrap: wrap;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px;
                    margin-bottom: 10px;
                    border-radius: 5px;
                    background-color: #fff;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
                    position: relative;
                    min-height: 80px;
                    ${isCompletedStyle}
                " class="${currentStatus === "COMPLETED" ? "completed-task" : ""}">
                
                    <div class="text-start" style="
                        flex: 0;
                        min-width: 305px;
                        overflow: hidden;
                        white-space: normal;
                        word-wrap: break-word;
                        margin-right: 10px;
                        text-align: center;
                        align-items: center;
                        gap: 10px;
                    ">
                        <label style="display: flex; flex-direction: column;">
                            <strong>${task.title}</strong>
                            <span style="font-weight: normal; font-size: 14px;">${task.description}</span>
                        </label>
                        <div class="text-center">
                            <span style="padding: 3px 5px; border-radius: 5px; background-color: ${styles.bg}; color: ${styles.text};">
                                ${priorityText} 
                            </span>
                            <div class="text-center">
                                ${task.important ? getStarIcons(task.priority_level) : ""}
                            </div>
                        </div>
                    </div>
                    
                    <h6 class="mb-0" id="statusBadge${task.id}">
                        ${getStatusBadgeHTML(currentStatus)}
                    </h6>
                      ${isDelayed ? `<span style="color: red; font-size: 10px; color: red; font-weight: bold;">Delayed</span>` : ""}
                         ${
            task.is_unplaned === 1
                ? `<label style="padding-top: 5px; font-size: 10px; color: red; max-width: 120px; font-weight: bold;">
                    Unplanned Task
                  </label>`
                : ""
            }
                </div>
            </td>
        </tr>
    `;
        tableBody.innerHTML += row;
    });
    setupEditButtons();
}

var style = document.createElement("style");
style.innerHTML = `
    .completed-task::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 0;
        width: 100%;
        height: 2px;
        background-color: red;
        opacity: 0.6;
    }
`;
document.head.appendChild(style);



function getStatusClass(status) {
    switch (status) {
        case "TODO":
            return "btn-primary"; // Gray
        case "IN PROGRESS":
            return "btn-primary"; // Blue
        case "COMPLETED":
            return "btn-success"; // Green
     
    }
}

async function changeTaskStatus(taskId, newStatus) {


    try {
        const response = await fetch(`${Base_Url}/api/AllTask/UpdateStatus?taskId=${taskId}&newStatus=${encodeURIComponent(newStatus)}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
          
            location.reload();
            // ✅ Update the status badge dynamically
            const statusBadge = document.getElementById(`statusBadge${taskId}`);
            if (statusBadge) {
                statusBadge.innerHTML = getStatusBadgeHTML(newStatus);
            }

            // ✅ Hide "Start" button after changing status
            const startButton = document.getElementById(`startButton${taskId}`);
            if (startButton && newStatus === "IN PROGRESS") {
                startButton.style.display = "none";
            }

        } else {
            console.error("Failed to update status:", data.message);
            alert("Failed to update task status.");
        }
    } catch (error) {
        console.error("Error updating task status:", error);
        alert("An error occurred while updating the task status.");
    }
}

// ✅ Function to return the appropriate badge HTML
function getStatusBadgeHTML(status) {
    switch (status) {
        case "TODO":
            return `<span class="badge bg-secondary" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                        <i class="bi bi-clock-history"></i> TODO
                    </span>`;
        case "IN PROGRESS":
            return `<span class="badge bg-warning text-dark" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                        <i class="bi bi-hourglass-split"></i> IN PROGRESS
                    </span>`;
        case "COMPLETED":
            return `<span class="badge bg-success" style="border-radius: 5px; padding: 3px 5px; font-size: 12px;">
                        <i class="bi bi-check2"></i> COMPLETED
                    </span>`;
        default:
            return `<span class="badge bg-secondary">UNKNOWN</span>`;
    }
}


//async function changeTaskStatus(taskId, newStatus) {
//    console.log(`Task ID: ${taskId} changed to ${newStatus}`);

//    try {
//        const response = await fetch(`/api/AllTask/UpdateStatus?taskId=${taskId}&newStatus=${encodeURIComponent(newStatus)}`, {
//            method: "PUT",
//            headers: {
//                "Content-Type": "application/json"
//            }
//        });

//        const data = await response.json();

//        if (response.ok) {
//            console.log(data.message);

//            // ✅ Update button text and class dynamically
//            const button = document.getElementById(`statusDropdown${taskId}`);
//            button.innerText = newStatus;
//            if (button) {
//                button.textContent = newStatus;
//                button.className = `btn btn-sm ${getStatusClass(newStatus)} dropdown-toggle`;
//            }

//            // ✅ Close the dropdown
//            let dropdown = bootstrap.Dropdown.getInstance(button);
//            if (dropdown) {
//                dropdown.hide();
//            }
//        } else {
//            console.error("Failed to update status:", data.message);
//            alert("Failed to update task status.");
//        }
//    } catch (error) {
//        console.error("Error updating task status:", error);
//        alert("An error occurred while updating the task status.");
//    }
//}



function getStarIcons(priority_level) {
    let starCount = 0;

    switch (priority_level) {
        case 3: // High priority
            starCount = 3;
            break;
        case 2: // Medium priority
            starCount = 2;
            break;
        case 1: // Low priority
            starCount = 1;
            break;
        default:
            starCount = 0; // No stars for unknown priority
    }

    return '<i class="bi bi-star-fill text-warning animated-star"></i>'.repeat(starCount);
}


function addNote(taskId) {
    document.getElementById("taskId").value = taskId; // Store task ID in hidden input
    document.getElementById("noteText").value = ""; // Clear previous note text
    var modal = new bootstrap.Modal(document.getElementById("addNoteModal"));
    modal.show(); // Show the modal
}

function saveNote() {
    let taskId = document.getElementById("taskId").value;
    let noteText = document.getElementById("noteText").value;

    if (noteText.trim() === "") {
        alert("Please enter a note.");
        return;
    }



    // Close modal after saving
    var modal = bootstrap.Modal.getInstance(document.getElementById("addNoteModal"));
    modal.hide();
}


function getPriorityText(priority_level) {
  switch (priority_level) {
    case 3:
      return "High";
    case 2:
      return "Medium";
    case 1:
      return "Low";
    default:
      return "Unknown"; // Handle unexpected values
  }
}

function getPriorityStyles(priority_level) {
  if (typeof priority_level !== "number") {
    return { bg: "#ffffff", text: "#000000" }; // Default styles for invalid or missing priority
  }

  let priorityText;
  switch (priority_level) {
    case 3:
      priorityText = "High";
      break;
    case 2:
      priorityText = "Medium";
      break;
    case 1:
      priorityText = "Low";
      break;
    default:
      priorityText = "Low";
  }

  switch (priorityText) {
    case "High":
          return { bg: "#faddda", text: "#000" };
    case "Medium":
          return { bg: "#d6f5e3", text: "#000" };
    case "Low":
    default:
          return { bg: "#fff3cd", text: "#000" };
  }
}

function setupEditButtons() {
  document.querySelectorAll(".edit-task-button").forEach((button) => {
    button.addEventListener("click", function () {
      const taskId = parseInt(this.dataset.taskId);
      editTask(taskId); // No need to pass tasks anymore
    });
  });
}

function editTask(id) {


  // Find the task in the global allTasks array
  const task = allTasks.find((t) => t.id == id); // Ensure loose equality for string IDs

  if (!task) {
    console.error("Task not found");
    return;
  }

  // Populate the edit modal fields
  document.getElementById("edit-task-id").value = task.id;
    document.getElementById("edit-myColor").value = task.color_pick;
  document.getElementById("edit-title").value = task.title;
  document.getElementById("edit-description").value = task.description;
  document.getElementById("edit-priority").value = task.priority_level;
    document.getElementById("edit-repetition").value = task.repetition;
    document.getElementById("edit-estimates").value = task.estimates;

    //document.getElementById("edit-due-date").value = task.due_date;


    if (typeof task.start_date === "object" && task.start_date !== null) {
        const formattedDueDate = `${task.start_date.year}-${String(
            task.start_date.month
        ).padStart(2, "0")}-${String(task.start_date.day).padStart(2, "0")}`;

        const dueDateInput = document.getElementById("edit-start-date");
        if (dueDateInput) {
            dueDateInput.value = formattedDueDate;
        } else {
            console.error("Element #edit-due-date not found in the DOM.");
        }
    } else {
        console.error("Invalid due date format:", task.due_date);
    }

  if (typeof task.due_date === "object" && task.due_date !== null) {
    const formattedDueDate = `${task.due_date.year}-${String(
      task.due_date.month
    ).padStart(2, "0")}-${String(task.due_date.day).padStart(2, "0")}`;

    const dueDateInput = document.getElementById("edit-due-date");
    if (dueDateInput) {
      dueDateInput.value = formattedDueDate;
    } else {
      console.error("Element #edit-due-date not found in the DOM.");
    }
  } else {
    console.error("Invalid due date format:", task.due_date);
  }

  document.getElementById("edit-important").checked = task.important === 1;

  // Show the modal
  let modal = new bootstrap.Modal(
    document.getElementById("staticBackdropEdit")
  );
  modal.show();
}

function setupViewButtons() {
    document.querySelectorAll(".view-task-button").forEach((button) => {
        button.addEventListener("click", function () {
            const taskId = parseInt(this.dataset.taskId);
            viewTask(taskId); // No need to pass tasks anymore
        });
    });
}

function loadComments(taskId) {
    fetch(`${Base_Url}/api/AddTask/get-notes/${taskId}`)
        .then(response => response.json())
        .then(data => {
            if (data.code === "SUCCESS") {
                const commentsContainer = document.getElementById("comments-container");
                const commentsLabel = document.getElementById("comments-label");
                commentsContainer.innerHTML = ""; // Clear previous comments

             
          
                // Check if there are comments
                if (data.data.length > 0) {
                    commentsLabel.style.display = "block"; // Show the label
                    data.data.forEach(comment => {
                        let createdAt = comment.created_at.value || null; // Extract proper date value
                        let formattedDate = createdAt ? new Date(createdAt).toLocaleString() : "Unknown Date";

                        const commentElement = document.createElement("div");
                        commentElement.classList.add("comment-box");
                        commentElement.innerHTML = `
                            <div class="comment-content">
                                <p class="comment-text">${comment.note}</p>
                                <small class="comment-date">${formattedDate}</small>
                            </div>
                        `;
                        commentsContainer.appendChild(commentElement);
                    });
                } else {
                    commentsLabel.style.display = "none"; // Hide the label if no comments
                }
            } else {
                console.error("Error fetching comments:", data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
        });
}

// Call this function inside `viewTask(id)`
function viewTask(id) {

    document.getElementById("view-task-id").value = id;
    loadComments(id); // Load comments dynamically
}


function viewTask(id) {


    // Find the task in the global allTasks array
    const task = allTasks.find((t) => t.id == id); // Ensure loose equality for string IDs
    loadComments(id);
    if (!task) {
        console.error("Task not found");
        return;
    }

    // Populate the edit modal fields
    document.getElementById("view-task-id").value = task.id;
    document.getElementById("view-myColor").value = task.color_pick;
    document.getElementById("view-title").value = task.title;
    document.getElementById("view-estimates").value = task.estimates;

    document.getElementById("view-description").value = task.description;
    document.getElementById("view-priority").value = task.priority_level;
    document.getElementById("view-repetition").value = task.repetition;
    //document.getElementById("edit-due-date").value = task.due_date;

    if (typeof task.due_date === "object" && task.due_date !== null) {
        const formattedDueDate = `${task.due_date.year}-${String(
            task.due_date.month
        ).padStart(2, "0")}-${String(task.due_date.day).padStart(2, "0")}`;

        const dueDateInput = document.getElementById("view-due-date");
        if (dueDateInput) {
            dueDateInput.value = formattedDueDate;
        } else {
            console.error("Element #edit-due-date not found in the DOM.");
        }
    } else {
        console.error("Invalid due date format:", task.due_date);
    }

    if (typeof task.start_date === "object" && task.start_date !== null) {
        const formattedStartDate = `${task.start_date.year}-${String(
            task.start_date.month
        ).padStart(2, "0")}-${String(task.start_date.day).padStart(2, "0")}`;

        const startDateInput = document.getElementById("view-start-date");
        if (startDateInput) {
            startDateInput.value = formattedStartDate;
        } else {
            console.error("Element #edit-due-date not found in the DOM.");
        }
    } else {
        console.error("Invalid due date format:", task.start_date);
    }

    document.getElementById("view-important").checked = task.important === 1;

    // Show the modal
    let modal = new bootstrap.Modal(
        document.getElementById("staticBackdropView")
    );
    modal.show();
}


function saveComment() {
    let taskId = document.getElementById("view-task-id").value;
    let note = document.getElementById("view-comment").value;

    if (!note.trim()) {
        alert("Please enter a comment before saving.");
        return;
    }

    fetch(`${Base_Url}/api/AddTask/add-note`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ taskId: taskId, note: note })
    })
        .then(response => response.json())
        .then(data => {
            if (data.code === "SUCCESS") {
                alert("Comment saved successfully!");
                document.getElementById("view-comment").value = ""; // Clear the textarea
            } else {
                alert("Error saving comment: " + data.error);
            }
        })
        .catch(error => {
            console.error("Error:", error);
            alert("An error occurred while saving the comment.");
        });
}


//    function getUserId() {
//      return localStorage.getItem("user_id") || 4;
//}

function getUserId() {
    let userAuth = getCookie("UserAuth");
    if (userAuth) {
        let userId = userAuth.split("|")[0];
        return userId || 4;
    }
    return 4; // Default value if cookie is not found
}

    document
      .getElementById("editTaskForm")
      .addEventListener("submit", function (event) {
        event.preventDefault(); // Prevent default form submission

        const updatedTask = {
          id: document.getElementById("edit-task-id").value,
          title: document.getElementById("edit-title").value,
          description: document.getElementById("edit-description").value,
          priority_level: document.getElementById("edit-priority").value,
          repetition: document.getElementById("edit-repetition").value,
          due_date: document.getElementById("edit-due-date").value,
          important: document.getElementById("edit-important").checked ? 1 : 0,
          user_id: getUserId()
          };

          if (!updatedTask.title || !updatedTask.description) {
           
              showToast("Please fill in all required fields.", "error");
              return;
          }

          fetch(`${Base_Url}/api/UpdateTask/${updatedTask.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedTask),
        })
          .then((response) => response.json())
            .then((data) => {
                //get the actual data via console
               
            if (data.code === "SUCCESS") {

                $("#updateSuccessModal").modal("show"); // Show the update success modal

                setTimeout(function () {
                    $("#updateSuccessModal").modal("hide"); // Hide modal after 2 seconds
                }, 2000);

              reloadAll();
              //location.reload(); // Reload to update the UI

            } else {
              alert("Error updating task: " + data.error);
            }
          })
          .catch((error) => console.error("Error:", error));
      });

 // Global variable to store task ID



function deleteTask(id) {
    taskIdToDelete = id; // Store task ID
    var deleteModal = new bootstrap.Modal(document.getElementById("deleteModal"));
    deleteModal.show(); // Show confirmation modal
}
document.addEventListener("DOMContentLoaded", function () {
    let confirmDeleteButton = document.getElementById("confirmDelete");
    if (confirmDeleteButton) {
        confirmDeleteButton.addEventListener("click", function () {
            if (taskIdToDelete) {
                fetch(`${Base_Url}/api/DeleteTask/${taskIdToDelete}`, { method: "DELETE" })
                    .then((response) => response.json())
                    .then((data) => {
                        if (data.code === "SUCCESS") {

                            var deleteModal = bootstrap.Modal.getInstance(document.getElementById("deleteModal"));
                            showToast("Task has been deleted successfully!", "success");
                            deleteModal.hide();
                            reloadAll();
                            location.reload();
                        } else {
                            console.error("Delete error:", data.error);
                        }
                    })
                    .catch((error) => {
                        console.error("Delete request error:", error);
                    });
            }
        });
    } else {
        console.error("Error: Confirm Delete button not found.");
    }
});

function sortTasks(type) {
    let sortedTasks = [...allTasks]; 

    if (type === "priority") {
     
        sortedTasks.sort((a, b) => b.priority_level - a.priority_level);
    } else if (type === "due_date") {
    
        sortedTasks.sort((a, b) => {
            const dateA = new Date(a.due_date.value);
            const dateB = new Date(b.due_date.value);

            return dateA - dateB; 
        });
    }

    populateTables(sortedTasks); 
    populateInprogressTables(sortedTasks);
}



//function markAsDone(id) {
//  fetch(`/api/MarkTask/${id}`, { method: "PUT" }) // Corrected API Route
//    .then((response) => response.json())
//    .then((data) => {
//      if (data.code === "SUCCESS") {
//        alert("Task successfully mark as done.");
//        reloadAll();
//      } else {
//        console.error("Mark task error:", data.error);
//        alert("Error deleting task: " + data.error);
//      }
//    })
//    .catch((error) => {
//      console.error("Mark task request error:", error);
//      alert("Failed to delete task.");
//    });
//}




function getEstimateById(taskId) {


    const numericTaskId = Number(taskId); // Convert taskId to a number
    const selectedTask = allTasks.find(task => task.id === numericTaskId);

    if (selectedTask) {
     
        return selectedTask.estimates;
    } else {
        console.error("Task not found for ID:", numericTaskId);
        return null;
    }
}

// Function to display the estimate in the modal
function displayEstimate(taskId) {
    const estimateValue = getEstimateById(taskId);

    if (estimateValue !== null) {
        const estimateElement = document.getElementById("originalEstimate");
        estimateElement.textContent = estimateValue + "h"; // Display the estimate value in hours

        // Update progress bar and remaining time
        updateProgressBar(taskId);
    } else {
        console.error("Estimate not found");
    }
}

var selectedTaskId = null; // Store task ID for confirmation
var allTasks = [];
function showConfirmModal(id, checkbox) {
    selectedTaskId = id;

    if (allTasks.length === 0) {
        fetchAllTasks(() => displayEstimate(id)); // Fetch data first if empty
    } else {
        displayEstimate(id);
    }

    // Show the modal
    const modalElement = document.getElementById("timeModal");
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    resetModalData();

    // Listen for modal close event to uncheck the checkbox
    modalElement.addEventListener("hidden.bs.modal", function () {
        checkbox.checked = false;
    }, { once: true }); // Ensure it runs only once per modal close
}

function resetModalData() {
    document.getElementById("timeSpent").value = ""; // Clear time spent input
    document.getElementById("timeRemaining").value = "0h"; // Clear remaining time input
}

document.addEventListener("DOMContentLoaded", function () {
    const confirmButton = document.getElementById("saveButton");
    const timeSpentInput = document.getElementById("timeSpent");
    const timeRemainingInput = document.getElementById("timeRemaining");
    const progressBar = document.querySelector(".progress-bar");

    // Enable "Save" button only if time spent is entered
    timeSpentInput.addEventListener("input", function () {
        confirmButton.disabled = timeSpentInput.value.trim() === "";

        // Calculate time remaining
        const estimateText = document.getElementById("originalEstimate").textContent;
        const estimateMinutes = convertToMinutes(estimateText);
        const spentMinutes = convertToMinutes(timeSpentInput.value.trim());

        const remainingMinutes = Math.max(estimateMinutes - spentMinutes, 0);
        timeRemainingInput.value = formatTime(remainingMinutes);

        // Update progress bar
        updateProgressBar(spentMinutes, estimateMinutes);
    });

    confirmButton.addEventListener("click", function () {
        if (selectedTaskId) {
            markAsDone(selectedTaskId);
            estimateTime();
            selectedTaskId = null;
        }
    });
});

function convertToMinutes(timeString) {
    let totalMinutes = 0;
    const timeRegex = /(\d+)([wdhm])/g;
    let match;

    while ((match = timeRegex.exec(timeString)) !== null) {
        const value = parseInt(match[1], 10);
        const unit = match[2];

        switch (unit) {
            case "w": totalMinutes += value * 7 * 24 * 60; break;
            case "d": totalMinutes += value * 24 * 60; break;
            case "h": totalMinutes += value * 60; break;
            case "m": totalMinutes += value; break;
        }
    }

    return totalMinutes;
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`.trim();
}

async function updateProgressBar(selectedTaskId) {
    const estimateText = document.getElementById("originalEstimate").textContent;
    const estimateMinutes = convertToMinutes(estimateText);

    const loggedTime = await getLoggedTime(selectedTaskId); // Fetch total logged time (including previous time spent)

    const timeSpentInput = document.getElementById("timeSpent").value.trim();
    const timeSpentMinutes = convertToMinutes(timeSpentInput); // Convert the new time spent to minutes

    const totalTimeSpent = loggedTime + timeSpentMinutes; // Total time spent including new input
    const remainingMinutes = Math.max(estimateMinutes - totalTimeSpent, 0); // Remaining time after new input

    document.getElementById("timeRemaining").value = formatTime(remainingMinutes);
   

    const progress = Math.min((totalTimeSpent / estimateMinutes) * 100, 100); // Calculate the progress percentage
    const progressBar = document.querySelector(".progress-bar");
    progressBar.style.width = `${progress}%`;
    progressBar.setAttribute("aria-valuenow", progress.toFixed(0)); // Update progress bar width
}





async function getLoggedTime(selectedTaskId) {
    try {
        const response = await fetch(`/api/MarkTask/${selectedTaskId}/timeSpent`);

        // Check if the response is OK (status 200)
        if (!response.ok) {
            throw new Error(`Error fetching data: ${response.statusText}`);
        }

        const data = await response.json();
        return data.timeSpent; // Returns total time spent in minutes
    } catch (error) {
        console.error("Error fetching time spent:", error);
        return 0; // If error, assume no time has been logged yet
    }
}


function markAsDone(id) {
    fetch(`${Base_Url}/api/MarkTask/${id}`, { method: "PUT" })
        .then((response) => response.json())
        .then((data) => {
            if (data.code === "SUCCESS") {
             
              
                showToast("Task successfully marked as done.", "success");
                reloadAll();
            } else {
                console.error("Mark task error:", data.error);
                alert("Error marking task: " + data.error);
            }
        })
        .catch((error) => {
            console.error("Mark task request error:", error);
            alert("Failed to mark task.");
        });
}

function estimateTime() {
    if (selectedTaskId) {
        const timeSpent = convertToMinutes(document.getElementById("timeSpent").value.trim());

        fetch(`${Base_Url}/api/MarkTask/mark-task`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: selectedTaskId, TimeSpent: timeSpent }) // Match parameter name
        })
            .then(response => response.json())
            .then(data => {
                console.log(data.message);
                selectedTaskId = null;
            })
            .catch(error => console.error("Error:", error));
    }
}








function formatDateForMySQL(date) {
    return date.toISOString().split("T")[0] + " 00:00:00"; // MySQL format
}

// Function to update displayed date and fetch tasks
function updateDateSelection(selectedDate) {
    let formattedUserDate = selectedDate.toDateString(); // Format for display
    let formattedMySQLDate = formatDateForMySQL(selectedDate); // Format for API
    loadRemark(selectedDate); 
    $("#datepickeriz").val(formattedUserDate); // Update input display

}

// Initialize with today's date
var selectedDate = new Date();
updateDateSelection(selectedDate);

// Prev/Next buttons functionality
$("#prevDate").click(function () {
    selectedDate.setDate(selectedDate.getDate() - 1); // Previous day
    updateDateSelection(selectedDate);
});

$("#nextDate").click(function () {
    selectedDate.setDate(selectedDate.getDate() + 1); // Next day
    updateDateSelection(selectedDate);
});

// Date Picker (When clicking the date input field)
$("#datepickeriz").datepicker({
    dateFormat: "DD, MM d, yy", // User-friendly format
    changeMonth: true,
    changeYear: true,
    onSelect: function (dateText, inst) {
        selectedDate = new Date(inst.selectedYear, inst.selectedMonth, inst.selectedDay);
        updateDateSelection(selectedDate);
    }
});










function toggleSaveButton() {
    let textarea = document.getElementById("message-text");
    let saveButton = document.getElementById("save-button");

    saveButton.style.display = textarea.value.trim() !== "" ? "block" : "none";
}

function saveRemark() {
    var userId = getUserId();
    let remarksText = document.getElementById("message-text").value.trim();
    let saveButton = document.getElementById("save-button");
    let remarkContainer = document.getElementById("remark-container");
    let remarkText = document.getElementById("remark-text");
    let remarkForm = document.getElementById("remark-form");

    if (remarksText === "") return;

    let data = {
        Id: userId,
        Remarks_Text: remarksText
    };

    fetch(`${Base_Url}/api/AddRemarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(result => {
            if (result.code === "SUCCESS") {
                // Update displayed remark & switch to view mode
                remarkText.innerText = remarksText;
                remarkContainer.style.display = "block";
                remarkForm.style.display = "none";
                saveButton.style.display = "none"; // Hide save button
                showToast("Task Remark successfully added .", "success");
            } else {
                alert("Error: " + result.error);
            }
        })
        .catch(error => console.error("Error:", error));
}


function loadRemark(selectedDate) {
    let userId = getUserId();
    let formattedDate = formatDateForMySQL(selectedDate);
    fetch(`${Base_Url}/api/AddRemarks/${userId}?date=${formattedDate}`)
        .then(response => response.json())
        .then(data => {
            let remarkContainer = document.getElementById("remark-container");
            let remarkText = document.getElementById("remark-text");
            let remarkForm = document.getElementById("remark-form");

            if (data.code === "SUCCESS") {
                remarkText.innerText = data.remark;
                remarkContainer.style.display = "block";
                remarkForm.style.display = "none";
            } else {
                remarkContainer.style.display = "none";
                remarkForm.style.display = "block";
            }
        })
        .catch(error => console.error("Error:", error));
}

function editRemark() {
    let remarkContainer = document.getElementById("remark-container");
    let remarkForm = document.getElementById("remark-form");
    let textarea = document.getElementById("message-text");
    let remarkText = document.getElementById("remark-text");

    textarea.value = remarkText.innerText;
    remarkContainer.style.display = "none";
    remarkForm.style.display = "block";
}

document.addEventListener("DOMContentLoaded", function () {
    let remarkContainer = document.getElementById("remark-container");
    let editButton = document.getElementById("edit-button");

    // Show edit button when hovering over remark text
    remarkContainer.addEventListener("mouseover", function () {
        editButton.style.display = "block";
    });

    // Hide edit button when mouse leaves
    remarkContainer.addEventListener("mouseleave", function () {
        editButton.style.display = "none";
    });
});


//document.addEventListener("DOMContentLoaded", function () {
//    document.getElementById("create").addEventListener("click", async function (event) {
//        event.preventDefault();

//        // Get form values using their respective IDs
//        const title = document.querySelector("#achievementForm input").value;
//        const description = document.querySelector("#achievementForm textarea").value;
//        const timeSpentInput = document.querySelectorAll("#achievementForm input")[1].value;
//        var user_Id = getUserId();

//        // Function to convert time spent input (e.g., '1h', '30m') into minutes
//        const convertToMinutes = (time) => {
//            const hoursMatch = time.match(/(\d+)\s*h/); // Matches '1h', '2h', etc.
//            const minutesMatch = time.match(/(\d+)\s*m/); // Matches '30m', '45m', etc.

//            let minutes = 0;
//            if (hoursMatch) {
//                minutes += parseInt(hoursMatch[1]) * 60; // Convert hours to minutes
//            }
//            if (minutesMatch) {
//                minutes += parseInt(minutesMatch[1]); // Add the minutes part
//            }
//            return minutes;
//        };

//        // Convert timeSpent input into minutes
//        const timeSpent = convertToMinutes(timeSpentInput);

//        // Construct the payload
//        const payload = {
//            title: title,
//            user_Id: user_Id,
//            description: description,
//            time_spent: timeSpent
//        };

//        try {
//            const response = await fetch("/api/Achievements/AddAchievement", {
//                method: "POST",
//                headers: {
//                    "Content-Type": "application/json"
//                },
//                body: JSON.stringify(payload)
//            });

//            const result = await response.json();

//            if (response.ok) {
//                showToast("Task successfully added!", "success");
//                document.getElementById("achievementForm").reset();

//                // Hide the modal
//                var modalElement = document.getElementById("exampleModal");
//                var modalInstance = bootstrap.Modal.getInstance(modalElement);
//                if (modalInstance) {
//                    modalInstance.hide();
//                }
//            } else {
              
//                showToast("Error: " + (result.error || "Unknown error"), "error");
//            }
//        } catch (error) {
//            alert("Failed to submit task: " + error.message);
//        }
//    });
//});



function showToast(message, type = "error") {
    let toast = document.getElementById("customToast");
    let toastMessage = document.getElementById("customToastMessage");

    // Set message
    toastMessage.innerText = message;

    // Change color based on type
    if (type === "success") {
        toast.style.backgroundColor = "#28a745"; // Green for success
    } else {
        toast.style.backgroundColor = "#d9534f"; // Red for error
    }

    // Show toast
    toast.classList.add("show");

    // Hide toast after 3 seconds
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
function downloadCSV(todayOnly) {
    let userId = getUserId(); // Ensure this function correctly retrieves the user ID
    if (!userId) {
        console.error("User ID is missing");
        return;
    }

    let url = `${Base_Url}/api/TasksExport/DownloadCsv?userId=${encodeURIComponent(userId)}&todayOnly=${todayOnly ? "true" : "false"}`;
    window.location.href = url;
}

