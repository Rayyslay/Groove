using Microsoft.AspNetCore.Mvc;
using Backend.Models;

namespace Backend.Controllers;

[ApiController]
[Route("api/tasks")]

public class TasksController : ControllerBase {
    // In-memory list for now
    private static readonly List<TaskItem> Tasks = new()
    {
        new TaskItem { Id = 1, Title = "Learn OOP", IsCompleted = false },
        new TaskItem { Id = 2, Title = "Build backend", IsCompleted = false },
        new TaskItem { Id = 3, Title = "Run test endpoint", IsCompleted = true }
    };

    [HttpGet]
    public IActionResult GetAll()
    {
        return Ok(Tasks);
    }
}