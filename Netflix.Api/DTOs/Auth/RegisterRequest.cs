namespace Netflix.Api.DTOs.Auth
{
    public record RegisterRequest(
        string FullName,
        string Email,
        string Password
    );
}
