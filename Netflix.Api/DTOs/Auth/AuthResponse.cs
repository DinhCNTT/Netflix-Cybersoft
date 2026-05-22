namespace Netflix.Api.DTOs.Auth
{
    public record AuthResponse(
        Guid Id,
        string FullName,
        string Email,
        string Role,
        bool IsSubscribed,
        string AccessToken,
        string RefreshToken
    );
}
