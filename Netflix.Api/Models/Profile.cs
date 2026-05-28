using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Netflix.Api.Models
{
    public class Profile
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        public Guid UserId { get; set; }

        [Required]
        [MaxLength(50)]
        public string Name { get; set; } = string.Empty;

        public string AvatarUrl { get; set; } = string.Empty;

        public bool IsKids { get; set; } = false;

        [MaxLength(4)]
        public string? PinCode { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey("UserId")]
        public virtual User? User { get; set; }

        public virtual ICollection<WatchHistory> WatchHistories { get; set; } = new List<WatchHistory>();
        public virtual ICollection<MyList> MyListItems { get; set; } = new List<MyList>();
        public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    }
}
