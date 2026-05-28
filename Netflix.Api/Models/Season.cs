using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Netflix.Api.Models
{
    public class Season
    {
        public int Id { get; set; }

        [Required]
        public int MovieId { get; set; }

        public int SeasonNumber { get; set; }

        [MaxLength(255)]
        public string Title { get; set; } = string.Empty;

        [ForeignKey(nameof(MovieId))]
        public virtual Movie? Movie { get; set; }

        public virtual ICollection<Episode> Episodes { get; set; } = new List<Episode>();
    }
}
