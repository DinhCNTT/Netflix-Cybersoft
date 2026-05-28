using System.ComponentModel.DataAnnotations;

namespace Netflix.Api.Models
{
    public class Rating
    {
        public Guid ProfileId { get; set; }
        public int MovieId { get; set; }

        [Range(-1, 1)]
        public int Value { get; set; }

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public virtual Profile? Profile { get; set; }
        public virtual Movie? Movie { get; set; }
    }
}
