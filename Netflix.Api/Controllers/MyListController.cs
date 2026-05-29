using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Movie;
using Netflix.Api.Models;
using Netflix.Api.Services;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Authorize]
    [Route("api/mylist")]
    public class MyListController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ITmdbService _tmdbService;

        public MyListController(ApplicationDbContext dbContext, ITmdbService tmdbService)
        {
            _dbContext = dbContext;
            _tmdbService = tmdbService;
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

        private async Task<Profile> ResolveProfileAsync(Guid userId)
        {
            if (!Request.Headers.TryGetValue("X-Profile-Id", out var headerValue) ||
                !Guid.TryParse(headerValue.FirstOrDefault(), out var profileId))
            {
                throw new InvalidOperationException("Thiếu X-Profile-Id hợp lệ.");
            }

            var profile = await _dbContext.Profiles
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == profileId && p.UserId == userId);

            if (profile is null)
            {
                throw new UnauthorizedAccessException("Profile không hợp lệ cho user hiện tại.");
            }

            return profile;
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

        [HttpGet]
        public async Task<IActionResult> GetMyList()
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var movies = await _dbContext.MyLists
                    .AsNoTracking()
                    .Where(x => x.ProfileId == profile.Id)
                    .OrderByDescending(x => x.AddedAt)
                    .Include(x => x.Movie)
                        .ThenInclude(m => m!.MovieGenres)
                    .Select(x => x.Movie)
                    .Where(m => m != null && m.IsActive)
                    .Select(m => ToListDto(m!))
                    .ToListAsync();

                var ids = movies.Select(m => m.Id).ToList();

                return Ok(new { status = "success", data = new { items = movies, ids } });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddToMyList([FromBody] MyListRequest request)
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var movieExists = await _dbContext.Movies
                    .AnyAsync(m => m.Id == request.MovieId);

                if (!movieExists)
                {
                    // Lấy từ TMDB để lưu vào DB
                    var tmdbMovie = await _tmdbService.GetMovieDetailsAsync(request.MovieId);
                    if (tmdbMovie == null)
                    {
                        return NotFound(new { status = "error", message = "Movie không tồn tại trên TMDB." });
                    }

                    _dbContext.Movies.Add(new Movie
                    {
                        Id = tmdbMovie.Id,
                        Title = tmdbMovie.Title ?? tmdbMovie.Name ?? "Unknown",
                        Description = tmdbMovie.Overview,
                        PosterUrl = tmdbMovie.Poster_Path != null ? $"https://image.tmdb.org/t/p/w500{tmdbMovie.Poster_Path}" : null,
                        BackdropUrl = tmdbMovie.Backdrop_Path != null ? $"https://image.tmdb.org/t/p/original{tmdbMovie.Backdrop_Path}" : null,
                        MaturityLevel = tmdbMovie.Adult ? "R" : "PG",
                        ReleaseYear = int.TryParse((tmdbMovie.Release_Date ?? tmdbMovie.First_Air_Date ?? "0000").Substring(0, 4), out var yr) ? yr : DateTime.UtcNow.Year,
                        IsActive = true
                    });
                    await _dbContext.SaveChangesAsync();
                }

                var exists = await _dbContext.MyLists
                    .AnyAsync(x => x.ProfileId == profile.Id && x.MovieId == request.MovieId);

                if (!exists)
                {
                    _dbContext.MyLists.Add(new MyList
                    {
                        ProfileId = profile.Id,
                        MovieId = request.MovieId,
                        AddedAt = DateTime.UtcNow
                    });

                    await _dbContext.SaveChangesAsync();
                }

                var ids = await _dbContext.MyLists
                    .AsNoTracking()
                    .Where(x => x.ProfileId == profile.Id)
                    .Select(x => x.MovieId)
                    .ToListAsync();

                return Ok(new { status = "success", data = ids });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        [HttpDelete]
        public async Task<IActionResult> RemoveFromMyList([FromBody] MyListRequest request)
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var entity = await _dbContext.MyLists
                    .FirstOrDefaultAsync(x => x.ProfileId == profile.Id && x.MovieId == request.MovieId);

                if (entity != null)
                {
                    _dbContext.MyLists.Remove(entity);
                    await _dbContext.SaveChangesAsync();
                }

                var ids = await _dbContext.MyLists
                    .AsNoTracking()
                    .Where(x => x.ProfileId == profile.Id)
                    .Select(x => x.MovieId)
                    .ToListAsync();

                return Ok(new { status = "success", data = ids });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(new { status = "error", message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
