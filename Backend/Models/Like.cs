namespace Backend.Models;

public class Like
{
    public int Id { get; set; }
    public int PostId { get; set; }
    public int UserId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public Post Post { get; set; } = null!;
    public User User { get; set; } = null!;
}
