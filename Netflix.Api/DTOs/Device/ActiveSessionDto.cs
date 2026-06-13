namespace Netflix.Api.DTOs.Device
{
    public record ActiveSessionDto(
        Guid Id,
        string DeviceName,
        string DeviceType,
        string? IpAddress,
        DateTime CreatedAt,
        DateTime LastSeenAt
    );
}
