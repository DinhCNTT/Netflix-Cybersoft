namespace Netflix.Api.Models
{
    public class UserFavoriteMovie
    {
        public Guid UserId { get; set; }
        public int MovieId { get; set; }

        public virtual User? User { get; set; }
        public virtual Movie? Movie { get; set; }
    }
}
