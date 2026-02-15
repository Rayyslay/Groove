using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class RegisterDto
{
    [Required]
    [MinLength(4)]
    [MaxLength(50)]
    [RegularExpression(@"^[a-zA-Z0-9_]+$", 
        ErrorMessage = "Username can only contain letters, numbers, and underscores.")]
    public string Username { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [MaxLength(100)]
    public string Email { get; set; } = string.Empty;

    [Required]
    [MinLength(8)]
    [RegularExpression(
        @"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$",
        ErrorMessage = "Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character."
    )]
    public string Password { get; set; } = string.Empty;

    [Required]
    [Compare("Password", ErrorMessage = "Passwords do not match.")]
    public string ConfirmPassword { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [RegularExpression(@"^[A-Za-z]+$", 
        ErrorMessage = "First name can contain letters only.")]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [RegularExpression(@"^[A-Za-z]+$", 
        ErrorMessage = "Last name can contain letters only.")]
    public string LastName { get; set; } = string.Empty;

    // Optional for now
    [MaxLength(250)]
    public string? Bio { get; set; }
}
