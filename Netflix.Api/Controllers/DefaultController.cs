using Microsoft.AspNetCore.Mvc;

namespace Netflix.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DefaultController : ControllerBase
    {
        [HttpGet]
        public IActionResult Get()
        {
            return Ok(new { message = "Welcome to Netflix API (Controller version)" });
        }
    }
}
