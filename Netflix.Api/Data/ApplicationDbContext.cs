using Microsoft.EntityFrameworkCore;
using Netflix.Api.Models;

namespace Netflix.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Profile> Profiles { get; set; }
        public DbSet<Movie> Movies { get; set; }
        public DbSet<Genre> Genres { get; set; }
        public DbSet<MovieGenre> MovieGenres { get; set; }
        public DbSet<UserFavoriteMovie> UserFavoriteMovies { get; set; }
        public DbSet<Season> Seasons { get; set; }
        public DbSet<Episode> Episodes { get; set; }
        public DbSet<WatchHistory> WatchHistories { get; set; }
        public DbSet<MyList> MyLists { get; set; }
        public DbSet<Rating> Ratings { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Make Email unique
            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Season>()
                .HasIndex(s => new { s.MovieId, s.SeasonNumber })
                .IsUnique();

            modelBuilder.Entity<Episode>()
                .HasIndex(e => new { e.SeasonId, e.EpisodeNumber })
                .IsUnique();

            modelBuilder.Entity<MovieGenre>()
                .HasKey(mg => new { mg.MovieId, mg.GenreId });

            modelBuilder.Entity<MovieGenre>()
                .HasOne(mg => mg.Movie)
                .WithMany(m => m.MovieGenres)
                .HasForeignKey(mg => mg.MovieId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MovieGenre>()
                .HasOne(mg => mg.Genre)
                .WithMany(g => g.MovieGenres)
                .HasForeignKey(mg => mg.GenreId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserFavoriteMovie>()
                .HasKey(x => new { x.UserId, x.MovieId });

            modelBuilder.Entity<UserFavoriteMovie>()
                .HasOne(x => x.User)
                .WithMany(u => u.FavoriteMovies)
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<UserFavoriteMovie>()
                .HasOne(x => x.Movie)
                .WithMany(m => m.FavoriteUsers)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WatchHistory>()
                .HasIndex(w => new { w.ProfileId, w.MovieId, w.EpisodeId });

            modelBuilder.Entity<WatchHistory>()
                .Property(w => w.TimestampSeconds)
                .HasDefaultValue(0);

            modelBuilder.Entity<WatchHistory>()
                .HasOne(w => w.Profile)
                .WithMany(p => p.WatchHistories)
                .HasForeignKey(w => w.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WatchHistory>()
                .HasOne(w => w.Movie)
                .WithMany(m => m.WatchHistories)
                .HasForeignKey(w => w.MovieId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<WatchHistory>()
                .HasOne(w => w.Episode)
                .WithMany(e => e.WatchHistories)
                .HasForeignKey(w => w.EpisodeId)
                .OnDelete(DeleteBehavior.SetNull);

            modelBuilder.Entity<MyList>()
                .HasKey(x => new { x.ProfileId, x.MovieId });

            modelBuilder.Entity<MyList>()
                .HasOne(x => x.Profile)
                .WithMany(p => p.MyListItems)
                .HasForeignKey(x => x.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<MyList>()
                .HasOne(x => x.Movie)
                .WithMany(m => m.MyListProfiles)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Rating>()
                .HasKey(x => new { x.ProfileId, x.MovieId });

            modelBuilder.Entity<Rating>()
                .HasOne(x => x.Profile)
                .WithMany(p => p.Ratings)
                .HasForeignKey(x => x.ProfileId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Rating>()
                .HasOne(x => x.Movie)
                .WithMany(m => m.Ratings)
                .HasForeignKey(x => x.MovieId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Rating>()
                .Property(x => x.Value)
                .HasDefaultValue(1);

            modelBuilder.Entity<Rating>()
                .HasCheckConstraint("CK_Ratings_Value", "\"Value\" IN (-1, 1)");

            MovieSeedData.Seed(modelBuilder);
        }
    }
}
