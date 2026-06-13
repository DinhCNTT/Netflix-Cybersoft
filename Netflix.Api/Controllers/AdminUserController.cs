using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Admin;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/admin/users")]
    [Authorize(Roles = "Admin")]
    public class AdminUserController : ControllerBase
    {
        private readonly ApplicationDbContext _db;

        public AdminUserController(ApplicationDbContext db) => _db = db;

        private Guid GetUserId()
        {
            var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(claim) || !Guid.TryParse(claim, out var id))
                throw new UnauthorizedAccessException("Unauthorized");
            return id;
        }

        // GET /api/admin/users?page=1&pageSize=20&search=keyword
        [HttpGet]
        public async Task<IActionResult> GetUsers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string? search = null)
        {
            try
            {
                var query = _db.Users.AsNoTracking();

                if (!string.IsNullOrWhiteSpace(search))
                {
                    var lower = search.ToLower();
                    query = query.Where(u =>
                        u.Email.ToLower().Contains(lower) ||
                        u.FullName.ToLower().Contains(lower));
                }

                var total = await query.CountAsync();

                var users = await query
                    .OrderByDescending(u => u.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .Select(u => new
                    {
                        u.Id,
                        u.FullName,
                        u.Email,
                        u.Role,
                        u.IsActive,
                        u.IsSubscribed,
                        u.IsEmailVerified,
                        u.SubscriptionPlan,
                        u.CreatedAt,
                        ProfileCount = u.Profiles.Count,
                        ActiveSessionCount = _db.ActiveSessions.Count(s => s.UserId == u.Id)
                    })
                    .ToListAsync();

                return Ok(new
                {
                    status = "success",
                    data = new { total, page, pageSize, items = users }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // GET /api/admin/users/{id}
        [HttpGet("{id:guid}")]
        public async Task<IActionResult> GetUser(Guid id)
        {
            try
            {
                var user = await _db.Users
                    .AsNoTracking()
                    .Include(u => u.Profiles)
                    .FirstOrDefaultAsync(u => u.Id == id);

                if (user == null)
                    return NotFound(new { status = "error", message = "Không tìm thấy người dùng." });

                var activeSessionCount = await _db.ActiveSessions.CountAsync(s => s.UserId == id);

                var dto = new AdminUserDetailDto(
                    user.Id, user.FullName, user.Email, user.Role,
                    user.IsActive, user.IsSubscribed, user.IsEmailVerified,
                    user.SubscriptionPlan, user.PaymentMethod, user.CreatedAt,
                    user.Profiles.Count, activeSessionCount);

                return Ok(new { status = "success", data = dto });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // PATCH /api/admin/users/{id}/role
        [HttpPatch("{id:guid}/role")]
        public async Task<IActionResult> UpdateRole(Guid id, [FromBody] UpdateUserRoleRequest request)
        {
            try
            {
                if (id == GetUserId())
                    return BadRequest(new { status = "error", message = "Không thể đổi role của chính mình." });

                var user = await _db.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { status = "error", message = "Không tìm thấy người dùng." });

                var allowed = new[] { "User", "Admin" };
                if (!allowed.Contains(request.Role))
                    return BadRequest(new { status = "error", message = "Role không hợp lệ." });

                user.Role = request.Role;
                await _db.SaveChangesAsync();

                return Ok(new { status = "success", message = "Đã cập nhật role." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // PATCH /api/admin/users/{id}/active
        [HttpPatch("{id:guid}/active")]
        public async Task<IActionResult> ToggleActive(Guid id, [FromBody] ToggleUserActiveRequest request)
        {
            try
            {
                if (id == GetUserId())
                    return BadRequest(new { status = "error", message = "Không thể vô hiệu hóa tài khoản của chính mình." });

                var user = await _db.Users.FindAsync(id);
                if (user == null)
                    return NotFound(new { status = "error", message = "Không tìm thấy người dùng." });

                user.IsActive = request.IsActive;
                await _db.SaveChangesAsync();

                return Ok(new
                {
                    status = "success",
                    message = request.IsActive ? "Đã kích hoạt tài khoản." : "Đã vô hiệu hóa tài khoản."
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }

        // DELETE /api/admin/users/{id}/sessions  — revoke all sessions for user
        [HttpDelete("{id:guid}/sessions")]
        public async Task<IActionResult> RevokeUserSessions(Guid id)
        {
            try
            {
                var sessions = await _db.ActiveSessions.Where(s => s.UserId == id).ToListAsync();
                _db.ActiveSessions.RemoveRange(sessions);
                await _db.SaveChangesAsync();
                return Ok(new { status = "success", message = $"Đã thu hồi {sessions.Count} phiên đăng nhập." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
