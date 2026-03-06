namespace Backend.Models;

public class Follow
{
    public int Id { get; set; }
    public int FollowerId { get; set; }   // the user who follows
    public int FollowingId { get; set; }  // the user being followed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public User Follower { get; set; } = null!;
    public User Following { get; set; } = null!;
}
