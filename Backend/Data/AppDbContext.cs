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

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>(entity =>
        {
            // Unique constraints
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();

            // Required fields + length limits
            entity.Property(u => u.Username)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(u => u.Email)
                  .IsRequired()
                  .HasMaxLength(100);

            entity.Property(u => u.PasswordHash)
                  .IsRequired();

            entity.Property(u => u.FirstName)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(u => u.LastName)
                  .IsRequired()
                  .HasMaxLength(50);

            entity.Property(u => u.ProfilePictureUrl)
                  .HasMaxLength(255);

            entity.Property(u => u.Bio)
                  .HasMaxLength(150);

            // Default values
            entity.Property(u => u.IsActive)
                  .HasDefaultValue(true);

            entity.Property(u => u.IsDeleted)
                  .HasDefaultValue(false);

            entity.Property(u => u.CreatedAt)
                  .HasDefaultValueSql("NOW()");

            entity.Property(u => u.UpdatedAt)
                  .HasDefaultValueSql("NOW()");
        });
    }
}
