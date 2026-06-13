using Netflix.Api.DTOs.Device;

namespace Netflix.Api.Services
{
    public interface IActiveSessionService
    {
        Task<Guid> CreateAsync(Guid userId, string? userAgent, string? ipAddress);
        Task RemoveAsync(Guid sessionId);
        Task RemoveAllForUserAsync(Guid userId, Guid? exceptSessionId = null);
        Task<List<ActiveSessionDto>> GetByUserAsync(Guid userId);
    }
}
