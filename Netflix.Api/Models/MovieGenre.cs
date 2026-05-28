namespace Netflix.Api.Models
{
    public class MovieGenre
    {
        public int MovieId { get; set; }
        public int GenreId { get; set; }

        public virtual Movie? Movie { get; set; }
        public virtual Genre? Genre { get; set; }
    }
}
