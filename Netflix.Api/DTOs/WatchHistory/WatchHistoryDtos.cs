using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.DTOs.WatchHistory
{
    public class UpdateWatchHistoryRequest
    {
        [Required]
        public Guid ProfileId { get; set; }

        [Required]
        public int MovieId { get; set; }

        public int? EpisodeId { get; set; }

        [Range(0, int.MaxValue)]
        public int TimestampSeconds { get; set; }
    }

    public record WatchHistoryItemDto(
        int Id,
        Guid ProfileId,
        int MovieId,
        string MovieTitle,
        int? EpisodeId,
        int? EpisodeNumber,
        string? EpisodeTitle,
        int TimestampSeconds,
        DateTime LastWatchedAt
    );
}
