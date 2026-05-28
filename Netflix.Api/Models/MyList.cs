namespace Netflix.Api.Models
{
    public class MyList
    {
        public Guid ProfileId { get; set; }
        public int MovieId { get; set; }
        public DateTime AddedAt { get; set; } = DateTime.UtcNow;

        public virtual Profile? Profile { get; set; }
        public virtual Movie? Movie { get; set; }
    }
}
