using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.Models
{
    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();

        [Required, MaxLength(100)]
        public string FullName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(200)]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string Role { get; set; } = "User"; // "User" | "Admin"

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public string? RefreshToken { get; set; }
        
        public DateTime? RefreshTokenExpiryTime { get; set; }

        public bool IsEmailVerified { get; set; } = false;
        
        [MaxLength(6)]
        public string? OtpCode { get; set; }
        
        public DateTime? OtpExpiryTime { get; set; }

        public string? VerificationToken { get; set; }
        
        // Subscription Fields
        public bool IsSubscribed { get; set; } = false;
        public string? SubscriptionPlan { get; set; }
        public string? PaymentMethod { get; set; }

        public virtual ICollection<Profile> Profiles { get; set; } = new List<Profile>();
    }
}
