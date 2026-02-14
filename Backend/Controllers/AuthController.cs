using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;

    public AuthController(AppDbContext context)
    {
        _context = context;
        _passwordHasher = new PasswordHasher<User>();
    }

    [HttpGet("check-username")]
public async Task<IActionResult> CheckUsername(string username)
{
    if (string.IsNullOrWhiteSpace(username))
        return BadRequest();

    var exists = await _context.Users
        .AnyAsync(u => u.Username.ToLower() == username.ToLower());

    return Ok(new { exists });
}

[HttpGet("check-email")]
public async Task<IActionResult> CheckEmail(string email)
{
    if (string.IsNullOrWhiteSpace(email))
        return BadRequest();

    var exists = await _context.Users
        .AnyAsync(u => u.Email.ToLower() == email.ToLower());

    return Ok(new { exists });
}


[HttpPost("register")]
public async Task<IActionResult> Register(RegisterDto dto)
{
    // 1️⃣ Validate DTO annotations
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    // 2️⃣ Normalize input
    var normalizedUsername = dto.Username.Trim().ToLower();
    var normalizedEmail = dto.Email.Trim().ToLower();

    // 3️⃣ Check if email exists (case-insensitive)
    if (await _context.Users
        .AnyAsync(u => u.Email.ToLower() == normalizedEmail))
    {
        return BadRequest("Email already exists.");
    }

    // 4️⃣ Check if username exists (case-insensitive)
    if (await _context.Users
        .AnyAsync(u => u.Username.ToLower() == normalizedUsername))
    {
        return BadRequest("Username already exists.");
    }

    // 5️⃣ Create user entity
    var user = new User
    {
        Username = normalizedUsername,
        Email = normalizedEmail,
        FirstName = dto.FirstName.Trim(),
        LastName = dto.LastName.Trim(),
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        IsActive = true,
        IsDeleted = false
    };

    // 6️⃣ Hash password using Identity hasher
    user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    return Ok("User registered successfully.");
}
}