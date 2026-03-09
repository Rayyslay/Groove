using Backend.Data;
using Backend.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IWebHostEnvironment _env;

    public UsersController(AppDbContext context, IWebHostEnvironment env)
    {
        _context = context;
        _env = env;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // ── SEARCH USERS ──
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q, [FromQuery] bool excludeSelf = false)
    {
        var currentUserId = GetUserId();
        var term = q?.Trim().ToLower() ?? "";

        var query = _context.Users.Where(u => !u.IsDeleted);

        if (excludeSelf)
            query = query.Where(u => u.Id != currentUserId);

        if (term.Length >= 2)
        {
            query = query.Where(u =>
                u.Username.ToLower().Contains(term) ||
                u.FirstName.ToLower().Contains(term) ||
                u.LastName.ToLower().Contains(term));
        }

        var users = await query
            .Take(20)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.FirstName,
                u.LastName,
                u.ProfilePictureUrl,
                u.Bio,
                IsFollowing = _context.Follows.Any(f =>
                    f.FollowerId == currentUserId && f.FollowingId == u.Id)
            })
            .ToListAsync();

        return Ok(users);
    }

    // ── FOLLOW / UNFOLLOW ──
    [HttpPost("{id}/follow")]
    public async Task<IActionResult> ToggleFollow(int id)
    {
        var userId = GetUserId();
        if (userId == id) return BadRequest("You cannot follow yourself.");

        var target = await _context.Users.FindAsync(id);
        if (target == null) return NotFound();

        var existing = await _context.Follows
            .FirstOrDefaultAsync(f => f.FollowerId == userId && f.FollowingId == id);

        if (existing != null)
        {
            _context.Follows.Remove(existing);
            await _context.SaveChangesAsync();
            return Ok(new { following = false });
        }
        else
        {
            _context.Follows.Add(new Follow
            {
                FollowerId = userId,
                FollowingId = id,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            return Ok(new { following = true });
        }
    }

    // ── GET CURRENT USER PROFILE (me) ──
    [HttpGet("me")]
    public async Task<IActionResult> GetMe()
    {
        var userId = GetUserId();

        var user = await _context.Users
            .Where(u => u.Id == userId)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.Email,
                u.FirstName,
                u.LastName,
                u.ProfilePictureUrl,
                u.Bio,
                u.Gender,
                u.DateOfBirth,
                u.CreatedAt,
                PostCount = _context.Posts.Count(p => p.UserId == u.Id),
                FollowerCount = _context.Follows.Count(f => f.FollowingId == u.Id),
                FollowingCount = _context.Follows.Count(f => f.FollowerId == u.Id),
                Posts = _context.Posts
                    .Where(p => p.UserId == u.Id)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        p.Id,
                        p.TextContent,
                        p.MediaUrl,
                        p.MediaType,
                        p.PostType,
                        p.CreatedAt,
                        LikeCount = p.Likes.Count,
                        CommentCount = p.Comments.Count
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound();
        return Ok(user);
    }

    // ── UPDATE PROFILE ──
    [HttpPut("me")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UpdateProfile(
        [FromForm] string? firstName,
        [FromForm] string? lastName,
        [FromForm] string? username,
        [FromForm] string? bio,
        [FromForm] string? gender,
        [FromForm] string? dateOfBirth,
        IFormFile? profilePicture)
    {
        var userId = GetUserId();
        var user = await _context.Users.FindAsync(userId);
        if (user == null) return NotFound();

        if (firstName != null) user.FirstName = firstName.Trim();
        if (lastName != null) user.LastName = lastName.Trim();
        if (bio != null) user.Bio = bio.Trim();

        if (gender != null)
        {
            var allowed = new[] { "Male", "Female", "Other", "PreferNotToSay" };
            user.Gender = allowed.Contains(gender) ? gender : null;
        }

        if (dateOfBirth != null)
        {
            if (DateTime.TryParse(dateOfBirth, out var dob))
                user.DateOfBirth = DateTime.SpecifyKind(dob.Date, DateTimeKind.Utc);
        }

        if (username != null)
        {
            var normalized = username.Trim().ToLower();
            if (normalized != user.Username)
            {
                var taken = await _context.Users.AnyAsync(u => u.Username == normalized && u.Id != userId);
                if (taken) return BadRequest("Username already taken.");
                user.Username = normalized;
            }
        }

        if (profilePicture != null && profilePicture.Length > 0)
        {
            if (profilePicture.Length > 5 * 1024 * 1024)
                return BadRequest("Profile picture must be 5 MB or less.");

            var ext = Path.GetExtension(profilePicture.FileName).ToLowerInvariant();
            var allowed = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            if (!allowed.Contains(ext))
                return BadRequest("Unsupported image type.");

            var uploadsDir = Path.Combine(_env.ContentRootPath, "..", "Frontend", "src", "assets", "Images", "profilePictures");
            Directory.CreateDirectory(uploadsDir);

            var fileName = $"{Guid.NewGuid()}{ext}";
            var filePath = Path.Combine(uploadsDir, fileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await profilePicture.CopyToAsync(stream);
            }

            user.ProfilePictureUrl = $"/src/assets/Images/profilePictures/{fileName}";
        }

        user.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            user.Id,
            user.Username,
            user.Email,
            user.FirstName,
            user.LastName,
            user.ProfilePictureUrl,
            user.Bio,
            user.Gender,
            user.DateOfBirth
        });
    }

    // ── GET USER PROFILE BY ID ──
    [HttpGet("{id}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var currentUserId = GetUserId();

        var user = await _context.Users
            .Where(u => u.Id == id && !u.IsDeleted)
            .Select(u => new
            {
                u.Id,
                u.Username,
                u.FirstName,
                u.LastName,
                u.ProfilePictureUrl,
                u.Bio,
                u.Gender,
                u.DateOfBirth,
                u.CreatedAt,
                PostCount = _context.Posts.Count(p => p.UserId == u.Id),
                FollowerCount = _context.Follows.Count(f => f.FollowingId == u.Id),
                FollowingCount = _context.Follows.Count(f => f.FollowerId == u.Id),
                IsFollowing = _context.Follows.Any(f =>
                    f.FollowerId == currentUserId && f.FollowingId == u.Id),
                Posts = _context.Posts
                    .Where(p => p.UserId == u.Id)
                    .OrderByDescending(p => p.CreatedAt)
                    .Select(p => new
                    {
                        p.Id,
                        p.TextContent,
                        p.MediaUrl,
                        p.MediaType,
                        p.PostType,
                        p.CreatedAt,
                        LikeCount = p.Likes.Count,
                        CommentCount = p.Comments.Count,
                        IsLiked = p.Likes.Any(l => l.UserId == currentUserId)
                    })
                    .ToList()
            })
            .FirstOrDefaultAsync();

        if (user == null) return NotFound();
        return Ok(user);
    }
}
