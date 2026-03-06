using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreatePostDto
{
    [Required]
    [RegularExpression("^(text|media)$", ErrorMessage = "PostType must be 'text' or 'media'.")]
    public string PostType { get; set; } = "text";

    [MaxLength(256)]
    public string? TextContent { get; set; }

    // File is handled via IFormFile in the controller, not here
}
