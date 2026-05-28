using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Netflix.Api.Models
{
    public class Episode
    {
        public int Id { get; set; }

        [Required]
        public int SeasonId { get; set; }

        public int EpisodeNumber { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [Required]
        [MaxLength(1000)]
        public string VideoUrl { get; set; } = string.Empty;

        public int DurationMinutes { get; set; }

        [MaxLength(1000)]
        public string? SubtitleUrl { get; set; }

        [ForeignKey(nameof(SeasonId))]
        public virtual Season? Season { get; set; }

        public virtual ICollection<WatchHistory> WatchHistories { get; set; } = new List<WatchHistory>();
    }
}
