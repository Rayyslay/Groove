using System.ComponentModel.DataAnnotations;

namespace Backend.DTOs;

public class CreateCommentDto
{
    [Required]
    [MaxLength(500)]
    public string Content { get; set; } = string.Empty;
}
