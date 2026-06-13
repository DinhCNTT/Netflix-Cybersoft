namespace Netflix.Api.DTOs.Admin
{
    public record AdminUserDto(
        Guid Id,
        string FullName,
        string Email,
        string Role,
        bool IsActive,
        bool IsSubscribed,
        bool IsEmailVerified,
        string? SubscriptionPlan,
        DateTime CreatedAt,
        int ProfileCount,
        int ActiveSessionCount
    );

    public record AdminUserDetailDto(
        Guid Id,
        string FullName,
        string Email,
        string Role,
        bool IsActive,
        bool IsSubscribed,
        bool IsEmailVerified,
        string? SubscriptionPlan,
        string? PaymentMethod,
        DateTime CreatedAt,
        int ProfileCount,
        int ActiveSessionCount
    );

    public record UpdateUserRoleRequest(string Role);
    public record ToggleUserActiveRequest(bool IsActive);

    public record AdminMovieDto(
        int Id,
        string Title,
        string? Description,
        string? PosterUrl,
        string? BackdropUrl,
        string? TrailerUrl,
        string MaturityLevel,
        int ReleaseYear,
        bool IsNetflixOriginal,
        bool IsActive,
        int ViewCount,
        DateTime CreatedAt
    );

    public record UpsertLocalMovieRequest(
        int Id,
        string Title,
        string? Description,
        string? PosterUrl,
        string? BackdropUrl,
        string? TrailerUrl,
        string MaturityLevel,
        int ReleaseYear,
        bool IsNetflixOriginal
    );

    public record AnalyticsSummaryDto(
        int TotalUsers,
        int SubscribedUsers,
        int TotalMovies,
        int ActiveMovies,
        long TotalWatchCount,
        int TotalProfiles,
        int ActiveSessionsNow,
        List<DailyRegistrationDto> DailyRegistrations,
        List<TopMovieDto> TopMovies,
        List<PlanDistributionDto> PlanDistribution
    );

    public record DailyRegistrationDto(string Date, int Count);
    public record TopMovieDto(int MovieId, string Title, int WatchCount, int LikeCount);
    public record PlanDistributionDto(string Plan, int Count);
}
