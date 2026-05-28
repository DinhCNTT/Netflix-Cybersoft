using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.Models
{
    public class Genre
    {
        public int Id { get; set; }

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public virtual ICollection<MovieGenre> MovieGenres { get; set; } = new List<MovieGenre>();
    }
}
