using Backend.Data;
using Backend.DTOs;
using Backend.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Backend.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IPasswordHasher<User> _passwordHasher;
    private readonly IConfiguration _configuration;

    public AuthController(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
        _passwordHasher = new PasswordHasher<User>();
    }

    // =========================
    // CHECK USERNAME
    // =========================
    [HttpGet("check-username")]
    public async Task<IActionResult> CheckUsername(string username)
    {
        if (string.IsNullOrWhiteSpace(username))
            return BadRequest();

        var exists = await _context.Users
            .AnyAsync(u => u.Username.ToLower() == username.ToLower());

        return Ok(new { exists });
    }

    // =========================
    // CHECK EMAIL
    // =========================
    [HttpGet("check-email")]
    public async Task<IActionResult> CheckEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest();

        var exists = await _context.Users
            .AnyAsync(u => u.Email.ToLower() == email.ToLower());

        return Ok(new { exists });
    }

    // =========================
    // REGISTER
    // =========================
    
[HttpPost("register")]
[Consumes("application/json")]
public async Task<IActionResult> Register([FromBody] RegisterDto dto)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    var normalizedUsername = dto.Username.Trim().ToLower();
    var normalizedEmail = dto.Email.Trim().ToLower();

    if (await _context.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        return BadRequest("Email already exists.");

    if (await _context.Users.AnyAsync(u => u.Username.ToLower() == normalizedUsername))
        return BadRequest("Username already exists.");

    var user = new User
    {
        Username = normalizedUsername,
        Email = normalizedEmail,
        FirstName = dto.FirstName.Trim(),
        LastName = dto.LastName.Trim(),
        Bio = dto.Bio?.Trim(),
        CreatedAt = DateTime.UtcNow,
        UpdatedAt = DateTime.UtcNow,
        IsActive = true,
        IsDeleted = false
    };

    user.PasswordHash = _passwordHasher.HashPassword(user, dto.Password);

    _context.Users.Add(user);
    await _context.SaveChangesAsync();

    // 🔥 AUTO LOGIN — Generate JWT

    var claims = new[]
    {
        new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new Claim(ClaimTypes.Name, user.Username),
        new Claim(ClaimTypes.Email, user.Email)
    };

    var key = new SymmetricSecurityKey(
        Encoding.UTF8.GetBytes(_configuration["JwtSettings:JWTkey"]!)
    );

    var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

    var token = new JwtSecurityToken(
        claims: claims,
        expires: DateTime.UtcNow.AddDays(7),
        signingCredentials: creds
    );

    var jwt = new JwtSecurityTokenHandler().WriteToken(token);

    return Ok(new
    {
        token = jwt,
        user = new
        {
            user.Id,
            user.Username,
            user.Email,
            user.FirstName,
            user.LastName
        }
    });
}
    // =========================
    // LOGIN
    // =========================
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var normalizedEmail = dto.Email.Trim().ToLower();

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null)
            return Unauthorized("Invalid email or password.");

        var result = _passwordHasher.VerifyHashedPassword(
            user,
            user.PasswordHash,
            dto.Password
        );

        if (result == PasswordVerificationResult.Failed)
            return Unauthorized("Invalid email or password.");

        // =========================
        // GENERATE JWT TOKEN
        // =========================

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Username),
            new Claim(ClaimTypes.Email, user.Email)
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(_configuration["JwtSettings:JWTkey"]!)
        );

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);

        return Ok(new
        {
            token = jwt,
            user = new
            {
                user.Id,
                user.Username,
                user.Email,
                user.FirstName,
                user.LastName
            }
        });
    }
}
