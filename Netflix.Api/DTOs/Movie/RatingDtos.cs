using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.DTOs.Movie
{
    public class RatingRequest
    {
        [Required]
        public int MovieId { get; set; }

        [Range(-1, 1)]
        public int Value { get; set; }
    }

    public record MovieRatingSummaryDto(
        int MovieId,
        int LikeCount,
        int DislikeCount,
        int? UserRating,
        int MatchPercent
    );
}
