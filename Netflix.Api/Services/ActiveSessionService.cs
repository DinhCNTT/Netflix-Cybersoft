using Microsoft.EntityFrameworkCore;
using Netflix.Api.Data;
using Netflix.Api.DTOs.Device;
using Netflix.Api.Models;

namespace Netflix.Api.Services
{
    public class ActiveSessionService : IActiveSessionService
    {
        private readonly ApplicationDbContext _dbContext;

        public ActiveSessionService(ApplicationDbContext dbContext)
        {
            _dbContext = dbContext;
        }

        public async Task<Guid> CreateAsync(Guid userId, string? userAgent, string? ipAddress)
        {
            var (deviceName, deviceType) = ParseUserAgent(userAgent);

            var session = new ActiveSession
            {
                UserId = userId,
                DeviceName = deviceName,
                DeviceType = deviceType,
                IpAddress = ipAddress,
                UserAgent = userAgent,
                CreatedAt = DateTime.UtcNow,
                LastSeenAt = DateTime.UtcNow,
            };

            _dbContext.ActiveSessions.Add(session);
            await _dbContext.SaveChangesAsync();
            return session.Id;
        }

        public async Task RemoveAsync(Guid sessionId)
        {
            var session = await _dbContext.ActiveSessions.FindAsync(sessionId);
            if (session != null)
            {
                _dbContext.ActiveSessions.Remove(session);
                await _dbContext.SaveChangesAsync();
            }
        }

        public async Task RemoveAllForUserAsync(Guid userId, Guid? exceptSessionId = null)
        {
            var query = _dbContext.ActiveSessions.Where(s => s.UserId == userId);
            if (exceptSessionId.HasValue)
                query = query.Where(s => s.Id != exceptSessionId.Value);

            var sessions = await query.ToListAsync();
            _dbContext.ActiveSessions.RemoveRange(sessions);
            await _dbContext.SaveChangesAsync();
        }

        public async Task<List<ActiveSessionDto>> GetByUserAsync(Guid userId)
        {
            return await _dbContext.ActiveSessions
                .AsNoTracking()
                .Where(s => s.UserId == userId)
                .OrderByDescending(s => s.LastSeenAt)
                .Select(s => new ActiveSessionDto(
                    s.Id,
                    s.DeviceName,
                    s.DeviceType,
                    s.IpAddress,
                    s.CreatedAt,
                    s.LastSeenAt))
                .ToListAsync();
        }

        private static (string DeviceName, string DeviceType) ParseUserAgent(string? ua)
        {
            if (string.IsNullOrWhiteSpace(ua))
                return ("Unknown Device", "Desktop");

            string deviceType;
            if (ua.Contains("Mobile", StringComparison.OrdinalIgnoreCase)
                || ua.Contains("Android", StringComparison.OrdinalIgnoreCase)
                || ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase))
                deviceType = "Mobile";
            else if (ua.Contains("iPad", StringComparison.OrdinalIgnoreCase)
                     || ua.Contains("Tablet", StringComparison.OrdinalIgnoreCase))
                deviceType = "Tablet";
            else if (ua.Contains("SmartTV", StringComparison.OrdinalIgnoreCase)
                     || ua.Contains("SMART-TV", StringComparison.OrdinalIgnoreCase))
                deviceType = "TV";
            else
                deviceType = "Desktop";

            string browser = "Unknown Browser";
            if (ua.Contains("Edg/", StringComparison.OrdinalIgnoreCase)) browser = "Edge";
            else if (ua.Contains("OPR/", StringComparison.OrdinalIgnoreCase)
                     || ua.Contains("Opera", StringComparison.OrdinalIgnoreCase)) browser = "Opera";
            else if (ua.Contains("Firefox", StringComparison.OrdinalIgnoreCase)) browser = "Firefox";
            else if (ua.Contains("Chrome", StringComparison.OrdinalIgnoreCase)) browser = "Chrome";
            else if (ua.Contains("Safari", StringComparison.OrdinalIgnoreCase)) browser = "Safari";

            string os = "Unknown OS";
            if (ua.Contains("Windows", StringComparison.OrdinalIgnoreCase)) os = "Windows";
            else if (ua.Contains("Mac OS", StringComparison.OrdinalIgnoreCase)
                     || ua.Contains("Macintosh", StringComparison.OrdinalIgnoreCase)) os = "macOS";
            else if (ua.Contains("Android", StringComparison.OrdinalIgnoreCase)) os = "Android";
            else if (ua.Contains("iPhone", StringComparison.OrdinalIgnoreCase)
                     || ua.Contains("iPad", StringComparison.OrdinalIgnoreCase)) os = "iOS";
            else if (ua.Contains("Linux", StringComparison.OrdinalIgnoreCase)) os = "Linux";

            return ($"{browser} trên {os}", deviceType);
        }
    }
}
