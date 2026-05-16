using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Backend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace Backend.Controllers;

[ApiController]
[Route("api/posts")]
[Authorize]
public class PostsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly SupabaseStorageService _storage;
    private const long MaxFileSize = 15 * 1024 * 1024; // 15 MB

    public PostsController(AppDbContext context, SupabaseStorageService storage)
    {
        _context = context;
        _storage = storage;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    private static string GetContentType(string ext) => ext switch
    {
        ".jpg" or ".jpeg" => "image/jpeg",
        ".png" => "image/png",
        ".gif" => "image/gif",
        ".webp" => "image/webp",
        ".mp4" => "video/mp4",
        ".webm" => "video/webm",
        ".mov" => "video/quicktime",
        _ => "application/octet-stream"
    };

    // ── GET FEED (posts from followed users, newest first) ──
    [HttpGet("feed")]
    public async Task<IActionResult> GetFeed([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var userId = GetUserId();

        var followedIds = await _context.Follows
            .Where(f => f.FollowerId == userId)
            .Select(f => f.FollowingId)
            .ToListAsync();

        if (followedIds.Count == 0)
            return Ok(new { posts = Array.Empty<object>(), hasMore = false });

        var query = _context.Posts
            .Where(p => followedIds.Contains(p.UserId))
            .OrderByDescending(p => p.CreatedAt);

        var total = await query.CountAsync();

        var posts = await query
            .Skip((page - 1) * size)
            .Take(size)
            .Select(p => new
            {
                p.Id,
                p.TextContent,
                p.MediaUrl,
                p.MediaType,
                p.PostType,
                p.CreatedAt,
                User = new
                {
                    p.User.Id,
                    p.User.Username,
                    p.User.FirstName,
                    p.User.LastName,
                    p.User.ProfilePictureUrl
                },
                LikeCount = p.Likes.Count,
                CommentCount = p.Comments.Count,
                IsLiked = p.Likes.Any(l => l.UserId == userId)
            })
            .ToListAsync();

        return Ok(new { posts, hasMore = (page * size) < total });
    }

    // ── EXPLORE POSTS (recent posts from everyone) ──
    [HttpGet("explore")]
    public async Task<IActionResult> GetExplore([FromQuery] int page = 1, [FromQuery] int size = 20)
    {
        var userId = GetUserId();

        var query = _context.Posts.OrderByDescending(p => p.CreatedAt);

        var total = await query.CountAsync();

        var posts = await query
            .Skip((page - 1) * size)
            .Take(size)
            .Select(p => new
            {
                p.Id,
                p.TextContent,
                p.MediaUrl,
                p.MediaType,
                p.PostType,
                p.CreatedAt,
                User = new
                {
                    p.User.Id,
                    p.User.Username,
                    p.User.FirstName,
                    p.User.LastName,
                    p.User.ProfilePictureUrl
                },
                LikeCount = p.Likes.Count,
                CommentCount = p.Comments.Count,
                IsLiked = p.Likes.Any(l => l.UserId == userId)
            })
            .ToListAsync();

        return Ok(new { posts, hasMore = (page * size) < total });
    }

    // ── CREATE POST ──
    [HttpPost]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> CreatePost(
        [FromForm] string postType,
        [FromForm] string? textContent,
        IFormFile? media)
    {
        var userId = GetUserId();

        if (postType != "text" && postType != "media")
            return BadRequest(new { message = "PostType must be 'text' or 'media'." });

        if (postType == "text")
        {
            if (string.IsNullOrWhiteSpace(textContent))
                return BadRequest(new { message = "Text content is required for text posts." });
            if (textContent.Length > 256)
                return BadRequest(new { message = "Text content must be 256 characters or less." });
        }

        var post = new Post
        {
            UserId = userId,
            PostType = postType,
            TextContent = textContent?.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        if (postType == "media")
        {
            if (media == null || media.Length == 0)
                return BadRequest(new { message = "A media file is required for media posts." });
            if (media.Length > MaxFileSize)
                return BadRequest(new { message = "File size must be 15 MB or less." });

            var ext = Path.GetExtension(media.FileName).ToLowerInvariant();
            var allowedImage = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var allowedVideo = new[] { ".mp4", ".webm", ".mov" };

            string mediaType;
            if (allowedImage.Contains(ext))
                mediaType = "image";
            else if (allowedVideo.Contains(ext))
                mediaType = "video";
            else
                return BadRequest(new { message = "Unsupported file type." });

            var fileName = $"{Guid.NewGuid()}{ext}";
            var storagePath = $"posts/{fileName}";

            using var stream = media.OpenReadStream();
            post.MediaUrl = await _storage.UploadAsync(stream, storagePath, GetContentType(ext));
            post.MediaType = mediaType;
        }

        _context.Posts.Add(post);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            post.Id,
            post.TextContent,
            post.MediaUrl,
            post.MediaType,
            post.PostType,
            post.CreatedAt
        });
    }

    // ── DELETE POST ──
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeletePost(int id)
    {
        var userId = GetUserId();
        var post = await _context.Posts.FirstOrDefaultAsync(p => p.Id == id);

        if (post == null) return NotFound(new { message = "Post not found" });
        if (post.UserId != userId) return Forbid();

        _context.Posts.Remove(post);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Post deleted successfully" });
    }

    // ── GET SINGLE POST WITH COMMENTS ──
    [HttpGet("{id}")]
    public async Task<IActionResult> GetPost(int id)
    {
        var userId = GetUserId();

        var post = await _context.Posts
            .Where(p => p.Id == id)
            .Select(p => new
            {
                p.Id,
                p.TextContent,
                p.MediaUrl,
                p.MediaType,
                p.PostType,
                p.CreatedAt,
                User = new
                {
                    p.User.Id,
                    p.User.Username,
                    p.User.FirstName,
                    p.User.LastName,
                    p.User.ProfilePictureUrl
                },
                LikeCount = p.Likes.Count,
                CommentCount = p.Comments.Count,
                IsLiked = p.Likes.Any(l => l.UserId == userId),
                Comments = p.Comments
                    .OrderByDescending(c => c.CreatedAt)
                    .Select(c => new
                    {
                        c.Id,
                        c.Content,
                        c.CreatedAt,
                        User = new
                        {
                            c.User.Id,
                            c.User.Username,
                            c.User.ProfilePictureUrl
                        }
                    })
            })
            .FirstOrDefaultAsync();

        if (post == null) return NotFound();
        return Ok(post);
    }

    // ── TOGGLE LIKE ──
    [HttpPost("{id}/like")]
    public async Task<IActionResult> ToggleLike(int id)
    {
        var userId = GetUserId();
        var post = await _context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        var existing = await _context.Likes
            .FirstOrDefaultAsync(l => l.PostId == id && l.UserId == userId);

        if (existing != null)
        {
            _context.Likes.Remove(existing);
            await _context.SaveChangesAsync();
            var count = await _context.Likes.CountAsync(l => l.PostId == id);
            return Ok(new { liked = false, likeCount = count });
        }
        else
        {
            _context.Likes.Add(new Like
            {
                PostId = id,
                UserId = userId,
                CreatedAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();
            var count = await _context.Likes.CountAsync(l => l.PostId == id);
            return Ok(new { liked = true, likeCount = count });
        }
    }

    // ── ADD COMMENT ──
    [HttpPost("{id}/comments")]
    public async Task<IActionResult> AddComment(int id, [FromBody] CreateCommentDto dto)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = GetUserId();
        var post = await _context.Posts.FindAsync(id);
        if (post == null) return NotFound();

        var comment = new Comment
        {
            PostId = id,
            UserId = userId,
            Content = dto.Content.Trim(),
            CreatedAt = DateTime.UtcNow
        };

        _context.Comments.Add(comment);
        await _context.SaveChangesAsync();

        var user = await _context.Users.FindAsync(userId);

        return Ok(new
        {
            comment.Id,
            comment.Content,
            comment.CreatedAt,
            User = new
            {
                user!.Id,
                user.Username,
                user.ProfilePictureUrl
            }
        });
    }

    // ── GET COMMENTS FOR A POST ──
    [HttpGet("{id}/comments")]
    public async Task<IActionResult> GetComments(int id)
    {
        var comments = await _context.Comments
            .Where(c => c.PostId == id)
            .OrderByDescending(c => c.CreatedAt)
            .Select(c => new
            {
                c.Id,
                c.Content,
                c.CreatedAt,
                User = new
                {
                    c.User.Id,
                    c.User.Username,
                    c.User.ProfilePictureUrl
                }
            })
            .ToListAsync();

        return Ok(comments);
    }
}
