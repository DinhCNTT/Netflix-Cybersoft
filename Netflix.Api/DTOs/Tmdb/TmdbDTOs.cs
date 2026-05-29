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
