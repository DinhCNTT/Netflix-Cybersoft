namespace Netflix.Api.DTOs.Movie
{
    public record MovieListItemDto(
        int Id,
        string Title,
        string? Description,
        string? PosterUrl,
        string? BackdropUrl,
        string MaturityLevel,
        int ReleaseYear,
        bool IsNetflixOriginal,
        string? TrailerUrl,
        IReadOnlyList<int> GenreIds
    );

    public record MovieDetailDto(
        int Id,
        string Title,
        string? Description,
        string? PosterUrl,
        string? BackdropUrl,
        string MaturityLevel,
        int ReleaseYear,
        bool IsNetflixOriginal,
        string? TrailerUrl,
        IReadOnlyList<int> GenreIds,
        IReadOnlyList<string> GenreNames
    );

    public record GenreDto(int Id, string Name);
}
