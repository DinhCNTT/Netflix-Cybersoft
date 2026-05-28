namespace Netflix.Api.DTOs.Episode
{
    public record EpisodeDto(
        int Id,
        int EpisodeNumber,
        string Title,
        string VideoUrl,
        int DurationMinutes,
        string? SubtitleUrl
    );

    public record SeasonDto(
        int Id,
        int SeasonNumber,
        string Title,
        List<EpisodeDto> Episodes
    );
}
