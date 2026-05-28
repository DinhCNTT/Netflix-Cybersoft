using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Movie;
using Netflix.Api.Models;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/movies")]
    [Authorize]
    public class MovieController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public MovieController(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        private Guid GetUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrWhiteSpace(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("Unauthorized");
            }

            return userId;
        }

        private static MovieListItemDto ToListDto(Movie movie)
        {
            return new MovieListItemDto(
                movie.Id,
                movie.Title,
                movie.Description,
                movie.PosterUrl,
                movie.BackdropUrl,
                movie.MaturityLevel,
                movie.ReleaseYear,
                movie.IsNetflixOriginal,
                movie.TrailerUrl,
                movie.MovieGenres.Select(mg => mg.GenreId).ToList()
            );
        }

        private static MovieDetailDto ToDetailDto(Movie movie)
        {
            return new MovieDetailDto(
                movie.Id,
                movie.Title,
                movie.Description,
                movie.PosterUrl,
                movie.BackdropUrl,
                movie.MaturityLevel,
                movie.ReleaseYear,
                movie.IsNetflixOriginal,
                movie.TrailerUrl,
                movie.MovieGenres.Select(mg => mg.GenreId).ToList(),
                movie.MovieGenres
                    .Where(mg => mg.Genre != null)
                    .Select(mg => mg.Genre!.Name)
                    .ToList()
            );
        }

        private async Task<Profile?> ResolveProfileAsync(Guid userId)
        {
            if (!Request.Headers.TryGetValue("X-Profile-Id", out var headerValue))
            {
                return null;
            }

            if (!Guid.TryParse(headerValue.FirstOrDefault(), out var profileId))
            {
                return null;
            }

            return await _dbContext.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == profileId && p.UserId == userId);
        }

        private IQueryable<Movie> ApplyMaturityFilter(IQueryable<Movie> query, Profile? profile)
        {
            if (profile is null || !profile.IsKids)
            {
                return query;
            }

            var allowedLevels = new[] { "G", "PG", "TV-G", "TV-PG" };
            return query.Where(m => allowedLevels.Contains(m.MaturityLevel.ToUpper()));
        }

        private IQueryable<Movie> BaseMovieQuery(Profile? profile)
        {
            var query = _dbContext.Movies
                .AsNoTracking()
                .Include(m => m.MovieGenres)
                    .ThenInclude(mg => mg.Genre)
                .Where(m => m.IsActive);

            return ApplyMaturityFilter(query, profile);
        }

        [HttpGet("featured")]
        public async Task<IActionResult> GetFeatured()
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var count = await BaseMovieQuery(profile).CountAsync();
                if (count == 0)
                {
                    return Ok(new { status = "success", data = (MovieListItemDto?)null });
                }

                var random = Random.Shared.Next(count);
                var movie = await BaseMovieQuery(profile)
                    .OrderBy(m => m.Id)
                    .Skip(random)
                    .FirstOrDefaultAsync();

                return Ok(new { status = "success", data = movie is null ? null : ToListDto(movie) });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("trending")]
        public async Task<IActionResult> GetTrending()
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);

                var query = BaseMovieQuery(profile);

                var result = await query
                    .Select(m => new
                    {
                        Movie = m,
                        Score = m.WatchHistories.Count(w => w.LastWatchedAt >= sevenDaysAgo)
                    })
                    .OrderByDescending(x => x.Score)
                    .ThenByDescending(x => x.Movie.ViewCount)
                    .ThenByDescending(x => x.Movie.ReleaseYear)
                    .Take(20)
                    .Select(x => ToListDto(x.Movie))
                    .ToListAsync();

                return Ok(new { status = "success", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("new-releases")]
        public async Task<IActionResult> GetNewReleases()
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var result = await BaseMovieQuery(profile)
                    .OrderByDescending(m => m.ReleaseYear)
                    .ThenByDescending(m => m.CreatedAt)
                    .Take(20)
                    .Select(m => ToListDto(m))
                    .ToListAsync();

                return Ok(new { status = "success", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("netflix-originals")]
        public async Task<IActionResult> GetNetflixOriginals()
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var result = await BaseMovieQuery(profile)
                    .Where(m => m.IsNetflixOriginal)
                    .OrderByDescending(m => m.ReleaseYear)
                    .ThenByDescending(m => m.ViewCount)
                    .Take(20)
                    .Select(m => ToListDto(m))
                    .ToListAsync();

                return Ok(new { status = "success", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("by-genre/{genreId:int}")]
        public async Task<IActionResult> GetByGenre(int genreId)
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var result = await BaseMovieQuery(profile)
                    .Where(m => m.MovieGenres.Any(mg => mg.GenreId == genreId))
                    .OrderByDescending(m => m.ViewCount)
                    .ThenByDescending(m => m.ReleaseYear)
                    .Take(20)
                    .Select(m => ToListDto(m))
                    .ToListAsync();

                return Ok(new { status = "success", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetMovieById(int id)
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var movie = await BaseMovieQuery(profile)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (movie is null)
                {
                    return NotFound(new { status = "error", message = "Không tìm thấy movie." });
                }

                return Ok(new { status = "success", data = ToDetailDto(movie) });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpGet("{id:int}/similar")]
        public async Task<IActionResult> GetSimilarMovies(int id)
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var targetMovie = await BaseMovieQuery(profile)
                    .FirstOrDefaultAsync(m => m.Id == id);

                if (targetMovie is null)
                {
                    return NotFound(new { status = "error", message = "Không tìm thấy movie." });
                }

                var targetGenreIds = targetMovie.MovieGenres.Select(mg => mg.GenreId).ToList();

                var result = await BaseMovieQuery(profile)
                    .Where(m => m.Id != id)
                    .Select(m => new
                    {
                        Movie = m,
                        SharedGenreCount = m.MovieGenres.Count(mg => targetGenreIds.Contains(mg.GenreId))
                    })
                    .Where(x => x.SharedGenreCount > 0)
                    .OrderByDescending(x => x.SharedGenreCount)
                    .ThenByDescending(x => x.Movie.ViewCount)
                    .ThenByDescending(x => x.Movie.ReleaseYear)
                    .Take(18)
                    .Select(x => ToListDto(x.Movie))
                    .ToListAsync();

                return Ok(new { status = "success", data = result });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
