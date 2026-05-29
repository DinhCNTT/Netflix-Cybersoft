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
    [Route("api/ratings")]
    public class RatingController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;
        private readonly ITmdbService _tmdbService;

        public RatingController(ApplicationDbContext dbContext, ITmdbService tmdbService)
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

        [HttpPost]
        public async Task<IActionResult> UpsertRating([FromBody] RatingRequest request)
        {
            try
            {
                if (request.Value != 1 && request.Value != -1)
                {
                    return BadRequest(new { status = "error", message = "Value chỉ nhận 1 hoặc -1." });
                }

                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

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

                var entity = await _dbContext.Ratings
                    .FirstOrDefaultAsync(x => x.ProfileId == profile.Id && x.MovieId == request.MovieId);

                if (entity is null)
                {
                    _dbContext.Ratings.Add(new Rating
                    {
                        ProfileId = profile.Id,
                        MovieId = request.MovieId,
                        Value = request.Value,
                        UpdatedAt = DateTime.UtcNow
                    });
                }
                else
                {
                    entity.Value = request.Value;
                    entity.UpdatedAt = DateTime.UtcNow;
                }

                await _dbContext.SaveChangesAsync();

                return Ok(new { status = "success", data = new { movieId = request.MovieId, value = request.Value } });
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

        [HttpGet("movie/{movieId:int}")]
        public async Task<IActionResult> GetMovieRatingSummary(int movieId)
        {
            try
            {
                var userId = GetUserId();
                var profile = await ResolveProfileAsync(userId);

                var movieExists = await _dbContext.Movies
                    .AsNoTracking()
                    .AnyAsync(m => m.Id == movieId && m.IsActive);

                if (!movieExists)
                {
                    return NotFound(new { status = "error", message = "Movie không tồn tại." });
                }

                var ratings = await _dbContext.Ratings
                    .AsNoTracking()
                    .Where(r => r.MovieId == movieId)
                    .ToListAsync();

                var likeCount = ratings.Count(r => r.Value == 1);
                var dislikeCount = ratings.Count(r => r.Value == -1);
                var total = likeCount + dislikeCount;
                var matchPercent = total == 0 ? 95 : (int)Math.Round((likeCount * 100.0) / total);

                var userRating = await _dbContext.Ratings
                    .AsNoTracking()
                    .Where(r => r.MovieId == movieId && r.ProfileId == profile.Id)
                    .Select(r => (int?)r.Value)
                    .FirstOrDefaultAsync();

                var summary = new MovieRatingSummaryDto(
                    movieId,
                    likeCount,
                    dislikeCount,
                    userRating,
                    matchPercent
                );

                return Ok(new { status = "success", data = summary });
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
