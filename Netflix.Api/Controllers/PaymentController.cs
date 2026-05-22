using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Netflix.Api.DTOs.Payment;
using Netflix.Api.Services;
using System.Security.Claims;

namespace Netflix.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly IAuthService _authService;

        public PaymentController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("subscribe")]
        [Authorize]
        public async Task<IActionResult> Subscribe([FromBody] SubscribeRequest request)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (string.IsNullOrEmpty(userIdClaim))
                    return Unauthorized(new { status = "error", message = "Unauthorized" });

                if (Guid.TryParse(userIdClaim, out Guid userId))
                {
                    // Call SubscribeAsync from AuthService, which updates IsSubscribed and returns a fresh JWT
                    var response = await _authService.SubscribeAsync(userId, request.Plan, request.PaymentMethod);
                    return Ok(new { status = "success", message = "Thanh toán thành công.", data = response });
                }

                return BadRequest(new { status = "error", message = "Invalid user ID" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { status = "error", message = ex.Message });
            }
        }
    }
}
