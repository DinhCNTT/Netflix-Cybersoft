using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.WatchHistory;
using Netflix.Api.Models;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/watch-history")]
    [Authorize]
    public class WatchHistoryController : ControllerBase
    {
        private readonly ApplicationDbContext _dbContext;

        public WatchHistoryController(ApplicationDbContext dbContext)
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

        [HttpPost]
        public async Task<IActionResult> UpsertWatchHistory([FromBody] UpdateWatchHistoryRequest request)
        {
            try
            {
                var userId = GetUserId();

                var profile = await _dbContext.Profiles
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == request.ProfileId && p.UserId == userId);

                if (profile is null)
                {
                    return BadRequest(new { status = "error", message = "Profile không hợp lệ." });
                }

                var movieExists = await _dbContext.Movies.AnyAsync(m => m.Id == request.MovieId);
                if (!movieExists)
                {
                    return BadRequest(new { status = "error", message = "Movie không tồn tại." });
                }

                if (request.EpisodeId.HasValue)
                {
                    var episodeExists = await _dbContext.Episodes.AnyAsync(e => e.Id == request.EpisodeId.Value);
                    if (!episodeExists)
                    {
                        return BadRequest(new { status = "error", message = "Episode không tồn tại." });
                    }
                }

                var history = await _dbContext.WatchHistories
                    .FirstOrDefaultAsync(w =>
                        w.ProfileId == request.ProfileId &&
                        w.MovieId == request.MovieId &&
                        w.EpisodeId == request.EpisodeId);

                if (history is null)
                {
                    history = new WatchHistory
                    {
                        ProfileId = request.ProfileId,
                        MovieId = request.MovieId,
                        EpisodeId = request.EpisodeId,
                        TimestampSeconds = request.TimestampSeconds,
                        LastWatchedAt = DateTime.UtcNow
                    };

                    _dbContext.WatchHistories.Add(history);
                }
                else
                {
                    history.TimestampSeconds = request.TimestampSeconds;
                    history.LastWatchedAt = DateTime.UtcNow;
                }

                await _dbContext.SaveChangesAsync();

                return Ok(new { status = "success", message = "Cập nhật tiến độ xem thành công." });
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

        [HttpGet]
        public async Task<IActionResult> GetContinueWatching()
        {
            try
            {
                var userId = GetUserId();

                var data = await _dbContext.WatchHistories
                    .AsNoTracking()
                    .Where(w => w.Profile != null && w.Profile.UserId == userId && w.TimestampSeconds > 0)
                    .Include(w => w.Movie)
                    .Include(w => w.Episode)
                    .OrderByDescending(w => w.LastWatchedAt)
                    .Select(w => new WatchHistoryItemDto(
                        w.Id,
                        w.ProfileId,
                        w.MovieId,
                        w.Movie != null ? w.Movie.Title : string.Empty,
                        w.EpisodeId,
                        w.Episode != null ? w.Episode.EpisodeNumber : null,
                        w.Episode != null ? w.Episode.Title : null,
                        w.TimestampSeconds,
                        w.LastWatchedAt
                    ))
                    .ToListAsync();

                return Ok(new { status = "success", data });
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
