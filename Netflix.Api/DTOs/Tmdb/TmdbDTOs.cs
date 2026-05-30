namespace Netflix.Api.DTOs.Tmdb
{
    public class TmdbResponseDto<T>
    {
        public int Page { get; set; }
        public List<T> Results { get; set; } = new List<T>();
        public int Total_Pages { get; set; }
        public int Total_Results { get; set; }
    }

    public class TmdbMovieDto
    {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Name { get; set; } // for TV shows
        public string? Overview { get; set; }
        public string? Poster_Path { get; set; }
        public string? Backdrop_Path { get; set; }
        public string? Release_Date { get; set; }
        public string? First_Air_Date { get; set; } // for TV shows
        public bool Adult { get; set; }
        public List<int> Genre_Ids { get; set; } = new List<int>();
        public List<TmdbGenreDto>? Genres { get; set; }
        public TmdbCreditsDto? Credits { get; set; }
        public TmdbReleaseDatesDto? Release_Dates { get; set; }
        public TmdbContentRatingsDto? Content_Ratings { get; set; }

        public string ComputedMaturityLevel 
        {
            get 
            {
                if (Release_Dates?.Results != null)
                {
                    var usRelease = Release_Dates.Results.FirstOrDefault(r => r.Iso_3166_1 == "US");
                    var cert = usRelease?.Release_Dates?.FirstOrDefault(d => !string.IsNullOrEmpty(d.Certification))?.Certification;
                    if (!string.IsNullOrEmpty(cert)) return cert;
                }

                if (Content_Ratings?.Results != null)
                {
                    var usRating = Content_Ratings.Results.FirstOrDefault(r => r.Iso_3166_1 == "US");
                    if (!string.IsNullOrEmpty(usRating?.Rating)) return usRating.Rating;
                }
                if (Adult) return "R";

                if (Genre_Ids != null && Genre_Ids.Any())
                {
                    // T18: Horror (27), Crime (80), Thriller (53)
                    if (Genre_Ids.Contains(27) || Genre_Ids.Contains(80) || Genre_Ids.Contains(53)) return "R"; 
                    // T13: Action (28), Sci-Fi (878)
                    if (Genre_Ids.Contains(28) || Genre_Ids.Contains(878)) return "PG-13"; 
                    // P: Animation (16), Family (10751)
                    if (Genre_Ids.Contains(16) || Genre_Ids.Contains(10751)) return "G"; 
                }

                if (Genres != null && Genres.Any())
                {
                    var genreIds = Genres.Select(g => g.Id).ToList();
                    if (genreIds.Contains(27) || genreIds.Contains(80) || genreIds.Contains(53)) return "R";
                    if (genreIds.Contains(28) || genreIds.Contains(878)) return "PG-13";
                    if (genreIds.Contains(16) || genreIds.Contains(10751)) return "G";
                }

                return "PG";
            }
        }
    }

    public class TmdbReleaseDatesDto
    {
        public List<TmdbReleaseDateResultDto> Results { get; set; } = new List<TmdbReleaseDateResultDto>();
    }

    public class TmdbReleaseDateResultDto
    {
        public string Iso_3166_1 { get; set; } = string.Empty;
        public List<TmdbReleaseDateItemDto> Release_Dates { get; set; } = new List<TmdbReleaseDateItemDto>();
    }

    public class TmdbReleaseDateItemDto
    {
        public string Certification { get; set; } = string.Empty;
    }

    public class TmdbContentRatingsDto
    {
        public List<TmdbContentRatingResultDto> Results { get; set; } = new List<TmdbContentRatingResultDto>();
    }

    public class TmdbContentRatingResultDto
    {
        public string Iso_3166_1 { get; set; } = string.Empty;
        public string Rating { get; set; } = string.Empty;
    }

    public class TmdbCreditsDto
    {
        public List<TmdbCastDto> Cast { get; set; } = new List<TmdbCastDto>();
    }

    public class TmdbCastDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Known_For_Department { get; set; }
        public int Order { get; set; }
    }

    public class TmdbGenreResponseDto
    {
        public List<TmdbGenreDto> Genres { get; set; } = new List<TmdbGenreDto>();
    }

    public class TmdbGenreDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }
    public class TmdbTvShowDetailsDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public int Number_Of_Seasons { get; set; }
        public int Number_Of_Episodes { get; set; }
        public List<TmdbTvSeasonDto> Seasons { get; set; } = new List<TmdbTvSeasonDto>();
    }

    public class TmdbTvSeasonDto
    {
        public int Id { get; set; }
        public string? Name { get; set; }
        public int Season_Number { get; set; }
        public int Episode_Count { get; set; }
    }
}
