using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Post> Posts => Set<Post>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<Like> Likes => Set<Like>();
    public DbSet<Follow> Follows => Set<Follow>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── USER ──
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();

            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.Email).IsRequired().HasMaxLength(100);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FirstName).IsRequired().HasMaxLength(50);
            entity.Property(u => u.LastName).IsRequired().HasMaxLength(50);
            entity.Property(u => u.ProfilePictureUrl).HasMaxLength(255);
            entity.Property(u => u.Bio).HasMaxLength(150);
            entity.Property(u => u.IsActive).HasDefaultValue(true);
            entity.Property(u => u.IsDeleted).HasDefaultValue(false);
            entity.Property(u => u.CreatedAt).HasDefaultValueSql("NOW()");
            entity.Property(u => u.UpdatedAt).HasDefaultValueSql("NOW()");
        });

        // ── POST ──
        modelBuilder.Entity<Post>(entity =>
        {
            entity.Property(p => p.TextContent).HasMaxLength(256);
            entity.Property(p => p.MediaUrl).HasMaxLength(500);
            entity.Property(p => p.MediaType).HasMaxLength(10);
            entity.Property(p => p.PostType).IsRequired().HasMaxLength(10).HasDefaultValue("text");
            entity.Property(p => p.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(p => p.User)
                  .WithMany()
                  .HasForeignKey(p => p.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── COMMENT ──
        modelBuilder.Entity<Comment>(entity =>
        {
            entity.Property(c => c.Content).IsRequired().HasMaxLength(500);
            entity.Property(c => c.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(c => c.Post)
                  .WithMany(p => p.Comments)
                  .HasForeignKey(c => c.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.User)
                  .WithMany()
                  .HasForeignKey(c => c.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── LIKE (unique per user per post) ──
        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasIndex(l => new { l.PostId, l.UserId }).IsUnique();
            entity.Property(l => l.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(l => l.Post)
                  .WithMany(p => p.Likes)
                  .HasForeignKey(l => l.PostId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(l => l.User)
                  .WithMany()
                  .HasForeignKey(l => l.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── FOLLOW (unique pair) ──
        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasIndex(f => new { f.FollowerId, f.FollowingId }).IsUnique();
            entity.Property(f => f.CreatedAt).HasDefaultValueSql("NOW()");

            entity.HasOne(f => f.Follower)
                  .WithMany()
                  .HasForeignKey(f => f.FollowerId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.Following)
                  .WithMany()
                  .HasForeignKey(f => f.FollowingId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
