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
        IReadOnlyList<int> GenreIds,
        string MediaType = "movie"  // "movie" | "tv"
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
        IReadOnlyList<string> GenreNames,
        IReadOnlyList<string> CastNames,
        string MediaType = "movie"  // "movie" | "tv"
    );

    public record GenreDto(int Id, string Name);
}
