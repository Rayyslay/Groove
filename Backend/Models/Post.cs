namespace Backend.Models;

public class Post
{
    public int Id { get; set; }
    public int UserId { get; set; }

    // Content
    public string? TextContent { get; set; }
    public string? MediaUrl { get; set; }        // path to uploaded file
    public string? MediaType { get; set; }        // "image" or "video"
    public string PostType { get; set; } = "text"; // "text" or "media"

    // Timestamps
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User User { get; set; } = null!;
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<Like> Likes { get; set; } = new List<Like>();
}
