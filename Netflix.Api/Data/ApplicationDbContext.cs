using Microsoft.EntityFrameworkCore;

namespace Netflix.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        // Add DbSets here
        // public DbSet<Movie> Movies { get; set; }
    }
}
