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
    [Route("api")]
    public class FavouriteController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ITmdbService _tmdbService;

        public FavouriteController(ApplicationDbContext dbContext, ITmdbService tmdbService)
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

        [HttpGet("favourites")]
        public async Task<IActionResult> GetFavourites()
        {
            try
            {
                var userId = GetUserId();

                var movies = await _dbContext.UserFavoriteMovies
                    .AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .Include(x => x.Movie)
                        .ThenInclude(m => m!.MovieGenres)
                    .Select(x => x.Movie)
                    .Where(m => m != null && m.IsActive)
                    .Select(m => new MovieListItemDto(
                        m!.Id,
                        m.Title,
                        m.Description,
                        m.PosterUrl,
                        m.BackdropUrl,
                        m.MaturityLevel,
                        m.ReleaseYear,
                        m.IsNetflixOriginal,
                        m.TrailerUrl,
                        m.MovieGenres.Select(mg => mg.GenreId).ToList()
                    ))
                    .ToListAsync();

                return Ok(new { status = "success", data = movies });
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

        [HttpGet("favourite")]
        public async Task<IActionResult> GetFavouriteIds()
        {
            try
            {
                var userId = GetUserId();

                var ids = await _dbContext.UserFavoriteMovies
                    .AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .Select(x => x.MovieId)
                    .ToListAsync();

                return Ok(new { status = "success", data = ids });
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

        [HttpPost("favourite")]
        public async Task<IActionResult> AddFavourite([FromBody] FavoriteRequest request)
        {
            try
            {
                var userId = GetUserId();

                var movieExists = await _dbContext.Movies
                    .AnyAsync(m => m.Id == request.MovieId);

                if (!movieExists)
                {
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

                var exists = await _dbContext.UserFavoriteMovies
                    .AnyAsync(x => x.UserId == userId && x.MovieId == request.MovieId);

                if (!exists)
                {
                    _dbContext.UserFavoriteMovies.Add(new UserFavoriteMovie
                    {
                        UserId = userId,
                        MovieId = request.MovieId
                    });

                    await _dbContext.SaveChangesAsync();
                }

                var updatedIds = await _dbContext.UserFavoriteMovies
                    .AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .Select(x => x.MovieId)
                    .ToListAsync();

                return Ok(new { status = "success", data = updatedIds });
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

        [HttpDelete("favourite")]
        public async Task<IActionResult> RemoveFavourite([FromBody] FavoriteRequest request)
        {
            try
            {
                var userId = GetUserId();

                var entity = await _dbContext.UserFavoriteMovies
                    .FirstOrDefaultAsync(x => x.UserId == userId && x.MovieId == request.MovieId);

                if (entity != null)
                {
                    _dbContext.UserFavoriteMovies.Remove(entity);
                    await _dbContext.SaveChangesAsync();
                }

                var updatedIds = await _dbContext.UserFavoriteMovies
                    .AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .Select(x => x.MovieId)
                    .ToListAsync();

                return Ok(new { status = "success", data = updatedIds });
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
