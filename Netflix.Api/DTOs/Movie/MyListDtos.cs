using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.DTOs.Movie
{
    public class MyListRequest
    {
        [Required]
        public int MovieId { get; set; }
    }
}
