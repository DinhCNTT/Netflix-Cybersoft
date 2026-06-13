using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Admin;
using Netflix.Api.Models;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/admin/movies")]
    [Authorize(Roles = "Admin")]
    public class AdminMovieController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AdminMovieController(ApplicationDbContext db) => _db = db;

        // GET /api/admin/movies?page=1&pageSize=20&search=keyword
        [HttpGet]
        public async Task<IActionResult> GetMovies(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = _db.Movies.AsNoTracking();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lower = search.ToLower();
                    query = query.Where(m => m.Title.ToLower().Contains(lower));
                }

                var total = await query.CountAsync();

                var movies = await query
                    .OrderByDescending(m => m.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(m => new AdminMovieDto(
                        m.Id, m.Title, m.Description, m.PosterUrl, m.BackdropUrl,
                        m.TrailerUrl, m.MaturityLevel, m.ReleaseYear,
                        m.IsNetflixOriginal, m.IsActive, m.ViewCount, m.CreatedAt))
                    .ToListAsync();

                return Ok(new
                {
                    status = "success",
                    data = new { total, page, pageSize, items = movies }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // GET /api/admin/movies/{id}
        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetMovie(int id)
        {
            try
            {
                var m = await _db.Movies.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id);
                if (m == null) return NotFound(new { status = "error", message = "Không tìm thấy phim." });

                var dto = new AdminMovieDto(m.Id, m.Title, m.Description, m.PosterUrl, m.BackdropUrl,
                    m.TrailerUrl, m.MaturityLevel, m.ReleaseYear, m.IsNetflixOriginal, m.IsActive, m.ViewCount, m.CreatedAt);

                return Ok(new { status = "success", data = dto });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // POST /api/admin/movies — create or update local movie record
        [HttpPost]
        public async Task<IActionResult> Upsert([FromBody] UpsertLocalMovieRequest request)
        {
            try
            {
                var existing = await _db.Movies.FindAsync(request.Id);
                if (existing != null)
                {
                    existing.Title = request.Title;
                    existing.Description = request.Description;
                    existing.PosterUrl = request.PosterUrl;
                    existing.BackdropUrl = request.BackdropUrl;
                    existing.TrailerUrl = request.TrailerUrl;
                    existing.MaturityLevel = request.MaturityLevel;
                    existing.ReleaseYear = request.ReleaseYear;
                    existing.IsNetflixOriginal = request.IsNetflixOriginal;
                }
                else
                {
                    _db.Movies.Add(new Movie
                    {
                        Id = request.Id,
                        Title = request.Title,
                        Description = request.Description,
                        PosterUrl = request.PosterUrl,
                        BackdropUrl = request.BackdropUrl,
                        TrailerUrl = request.TrailerUrl,
                        MaturityLevel = request.MaturityLevel,
                        ReleaseYear = request.ReleaseYear,
                        IsNetflixOriginal = request.IsNetflixOriginal,
                    });
                }

                await _db.SaveChangesAsync();
                return Ok(new { status = "success", message = "Đã lưu phim." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // PATCH /api/admin/movies/{id}/active
        [HttpPatch("{id:int}/active")]
        public async Task<IActionResult> ToggleActive(int id, [FromBody] bool isActive)
        {
            try
            {
                var movie = await _db.Movies.FindAsync(id);
                if (movie == null) return NotFound(new { status = "error", message = "Không tìm thấy phim." });

                movie.IsActive = isActive;
                await _db.SaveChangesAsync();

                return Ok(new { status = "success", message = isActive ? "Đã kích hoạt phim." : "Đã ẩn phim." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // DELETE /api/admin/movies/{id}
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var movie = await _db.Movies.FindAsync(id);
                if (movie == null) return NotFound(new { status = "error", message = "Không tìm thấy phim." });

                _db.Movies.Remove(movie);
                await _db.SaveChangesAsync();
                return Ok(new { status = "success", message = "Đã xóa phim." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
