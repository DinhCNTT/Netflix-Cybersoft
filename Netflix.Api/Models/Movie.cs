using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.Models
{
    public class Movie
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [MaxLength(1000)]
        public string? Description { get; set; }

        [MaxLength(500)]
        public string? PosterUrl { get; set; }

        [MaxLength(500)]
        public string? BackdropUrl { get; set; }

        [MaxLength(50)]
        public string MaturityLevel { get; set; } = "PG-13";

        public int ReleaseYear { get; set; } = DateTime.UtcNow.Year;

        public bool IsNetflixOriginal { get; set; } = false;

        [MaxLength(1000)]
        public string? TrailerUrl { get; set; }

        public int ViewCount { get; set; } = 0;

        public bool IsActive { get; set; } = true;

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public virtual ICollection<MovieGenre> MovieGenres { get; set; } = new List<MovieGenre>();
        public virtual ICollection<Season> Seasons { get; set; } = new List<Season>();
        public virtual ICollection<WatchHistory> WatchHistories { get; set; } = new List<WatchHistory>();
        public virtual ICollection<UserFavoriteMovie> FavoriteUsers { get; set; } = new List<UserFavoriteMovie>();
        public virtual ICollection<MyList> MyListProfiles { get; set; } = new List<MyList>();
        public virtual ICollection<Rating> Ratings { get; set; } = new List<Rating>();
    }
}
