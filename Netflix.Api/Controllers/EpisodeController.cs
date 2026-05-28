using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Episode;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/movies")]
    [Authorize]
    public class EpisodeController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public EpisodeController(ApplicationDbContext dbContext)
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

        [HttpGet("{id:int}/seasons")]
        public async Task<IActionResult> GetSeasonsByMovie(int id)
        {
            try
            {
                var userId = GetUserId();
                var user = await _dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

                if (user is null)
                {
                    return Unauthorized(new { status = "error", message = "Unauthorized" });
                }

                if (!user.IsSubscribed)
                {
                    return StatusCode(StatusCodes.Status403Forbidden,
                        new { status = "error", message = "Bạn cần gói subscription hợp lệ để xem video." });
                }

                var movie = await _dbContext.Movies.AsNoTracking().FirstOrDefaultAsync(m => m.Id == id);
                if (movie is null)
                {
                    return NotFound(new { status = "error", message = "Không tìm thấy movie." });
                }

                var seasons = await _dbContext.Seasons
                    .AsNoTracking()
                    .Where(s => s.MovieId == id)
                    .OrderBy(s => s.SeasonNumber)
                    .Select(s => new SeasonDto(
                        s.Id,
                        s.SeasonNumber,
                        s.Title,
                        s.Episodes
                            .OrderBy(e => e.EpisodeNumber)
                            .Select(e => new EpisodeDto(
                                e.Id,
                                e.EpisodeNumber,
                                e.Title,
                                e.VideoUrl,
                                e.DurationMinutes,
                                e.SubtitleUrl
                            ))
                            .ToList()
                    ))
                    .ToListAsync();

                return Ok(new
                {
                    status = "success",
                    data = new
                    {
                        movieId = movie.Id,
                        movieTitle = movie.Title,
                        seasons
                    }
                });
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
