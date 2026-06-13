using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Admin;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/admin/analytics")]
    [Authorize(Roles = "Admin")]
    public class AnalyticsController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AnalyticsController(ApplicationDbContext db) => _db = db;

        // GET /api/admin/analytics/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            try
            {
                var totalUsers = await _db.Users.CountAsync();
                var subscribedUsers = await _db.Users.CountAsync(u => u.IsSubscribed);
                var totalMovies = await _db.Movies.CountAsync();
                var activeMovies = await _db.Movies.CountAsync(m => m.IsActive);
                var totalWatchCount = await _db.WatchHistories.LongCountAsync();
                var totalProfiles = await _db.Profiles.CountAsync();
                var activeSessionsNow = await _db.ActiveSessions.CountAsync();

                // Daily registrations — last 14 days
                var since = DateTime.UtcNow.AddDays(-13).Date;
                var rawRegs = await _db.Users
                    .Where(u => u.CreatedAt >= since)
                    .GroupBy(u => u.CreatedAt.Date)
                    .Select(g => new { Date = g.Key, Count = g.Count() })
                    .ToListAsync();

                var dailyRegistrations = Enumerable.Range(0, 14)
                    .Select(offset => since.AddDays(offset))
                    .Select(date => new DailyRegistrationDto(
                        date.ToString("yyyy-MM-dd"),
                        rawRegs.FirstOrDefault(r => r.Date == date)?.Count ?? 0))
                    .ToList();

                // Top 10 most-watched local movies
                var topMovies = await _db.WatchHistories
                    .GroupBy(w => w.MovieId)
                    .Select(g => new { MovieId = g.Key, WatchCount = g.Count() })
                    .OrderByDescending(x => x.WatchCount)
                    .Take(10)
                    .Join(_db.Movies, w => w.MovieId, m => m.Id, (w, m) => new TopMovieDto(
                        m.Id, m.Title, w.WatchCount,
                        _db.Ratings.Count(r => r.MovieId == m.Id && r.Value == 1)))
                    .ToListAsync();

                // Plan distribution
                var planDist = await _db.Users
                    .Where(u => u.IsSubscribed && u.SubscriptionPlan != null)
                    .GroupBy(u => u.SubscriptionPlan!)
                    .Select(g => new PlanDistributionDto(g.Key, g.Count()))
                    .ToListAsync();

                var summary = new AnalyticsSummaryDto(
                    totalUsers, subscribedUsers, totalMovies, activeMovies,
                    totalWatchCount, totalProfiles, activeSessionsNow,
                    dailyRegistrations, topMovies, planDist);

                return Ok(new { status = "success", data = summary });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // GET /api/admin/analytics/watch-stats — top movies by watch count (last 30 days)
        [HttpGet("watch-stats")]
        public async Task<IActionResult> GetWatchStats()
        {
            try
            {
                var since = DateTime.UtcNow.AddDays(-30);
                var stats = await _db.WatchHistories
                    .Where(w => w.LastWatchedAt >= since)
                    .GroupBy(w => w.MovieId)
                    .Select(g => new { MovieId = g.Key, Count = g.Count() })
                    .OrderByDescending(x => x.Count)
                    .Take(20)
                    .Join(_db.Movies, w => w.MovieId, m => m.Id, (w, m) => new
                    {
                        m.Id,
                        m.Title,
                        m.PosterUrl,
                        WatchCount = w.Count
                    })
                    .ToListAsync();

                return Ok(new { status = "success", data = stats });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
