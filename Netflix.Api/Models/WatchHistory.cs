using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Netflix.Api.Models
{
    public class WatchHistory
    {
        public int Id { get; set; }

        [Required]
        public Guid ProfileId { get; set; }

        [Required]
        public int MovieId { get; set; }

        public int? EpisodeId { get; set; }

        public int TimestampSeconds { get; set; }

        public DateTime LastWatchedAt { get; set; } = DateTime.UtcNow;

        [ForeignKey(nameof(ProfileId))]
        public virtual Profile? Profile { get; set; }

        [ForeignKey(nameof(MovieId))]
        public virtual Movie? Movie { get; set; }

        [ForeignKey(nameof(EpisodeId))]
        public virtual Episode? Episode { get; set; }
    }
}
