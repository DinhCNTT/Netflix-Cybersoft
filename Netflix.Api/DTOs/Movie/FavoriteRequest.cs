using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.DTOs.Movie
{
    public class FavoriteRequest
    {
        [Required]
        public int MovieId { get; set; }
    }
}
