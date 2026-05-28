using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Netflix.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddModule5MoviesBrowse : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsNetflixOriginal",
                table: "Movies",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ReleaseYear",
                table: "Movies",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "TrailerUrl",
                table: "Movies",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ViewCount",
                table: "Movies",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Genres",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Genres", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MovieGenres",
                columns: table => new
                {
                    MovieId = table.Column<int>(type: "integer", nullable: false),
                    GenreId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MovieGenres", x => new { x.MovieId, x.GenreId });
                    table.ForeignKey(
                        name: "FK_MovieGenres_Genres_GenreId",
                        column: x => x.GenreId,
                        principalTable: "Genres",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MovieGenres_Movies_MovieId",
                        column: x => x.MovieId,
                        principalTable: "Movies",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Genres",
                columns: new[] { "Id", "Name" },
                values: new object[,]
                {
                    { 1, "Action" },
                    { 2, "Drama" },
                    { 3, "Comedy" },
                    { 4, "Sci-Fi" },
                    { 5, "Horror" },
                    { 6, "Romance" },
                    { 7, "Animation" },
                    { 8, "Documentary" }
                });

            migrationBuilder.InsertData(
                table: "Movies",
                columns: new[] { "Id", "BackdropUrl", "CreatedAt", "Description", "IsActive", "IsNetflixOriginal", "MaturityLevel", "PosterUrl", "ReleaseYear", "Title", "TrailerUrl", "ViewCount" },
                values: new object[,]
                {
                    { 1, "https://image.tmdb.org/t/p/original/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A rogue crew infiltrates a global AI vault.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg", 2026, "Cyber Heist", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", 42110 },
                    { 2, "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "An ex-agent is pulled into one last mission.", true, true, "R", "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", 2025, "Night Protocol", "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 53000 },
                    { 3, "https://image.tmdb.org/t/p/original/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Street racers battle for a city under blackout.", true, false, "PG-13", "https://image.tmdb.org/t/p/original/6MKr3KgOLmzOP6MSuZERO41Lpkt.jpg", 2024, "Skyline Rush", "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 31200 },
                    { 4, "https://image.tmdb.org/t/p/original/3CxUndGhUcZdt1Zggjdb2HkLLQX.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A violinist and chef rebuild life in Seoul.", true, true, "PG", "https://image.tmdb.org/t/p/original/5a4JdoFwll5DRtKMe7JLuGQ9yJm.jpg", 2023, "Glass Hearts", "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", 20310 },
                    { 5, "https://image.tmdb.org/t/p/original/wdwcOBMkt3zmPQuEMxB3FUtMio2.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A podcast team explores a cursed highway.", true, false, "R", "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg", 2022, "Haunted Mile", "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 18800 },
                    { 6, "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Scientists chase a signal beyond Pluto.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/7iiJTe7QzPoUc2zV9kib4m9fM7R.jpg", 2026, "Planet Nine", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", 27400 },
                    { 7, "https://image.tmdb.org/t/p/original/7VEUOEfRzzrQfWddlIyLUKvh6Nf.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A failed comic turns into a viral sensation.", true, false, "PG-13", "https://image.tmdb.org/t/p/original/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg", 2025, "Laugh Track", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 16600 },
                    { 8, "https://image.tmdb.org/t/p/original/cWczNud8Y8i8ab0Z4A8kJ6X1T4F.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A brave kid befriends a hidden dragon hatchling.", true, true, "PG", "https://image.tmdb.org/t/p/original/hwlyY7Jw5M3M6bMFD4kK5Jz2W6G.jpg", 2021, "Tiny Dragons", "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", 32050 },
                    { 9, "https://image.tmdb.org/t/p/original/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Three chefs, one brutal cooking tournament.", true, false, "PG", "https://image.tmdb.org/t/p/original/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg", 2020, "Kitchen Wars", "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4", 11020 },
                    { 10, "https://image.tmdb.org/t/p/original/euXQw5nB8Jt3Q5GsyhQOdE31E4n.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A research station vanishes under polar ice.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/6Zx6mP4QEtBfV63P2QxY8fJfN7K.jpg", 2024, "Undersea 47", "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4", 23100 },
                    { 11, "https://image.tmdb.org/t/p/original/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A detective hunts a ghost hacker in Tokyo.", true, true, "TV-14", "https://image.tmdb.org/t/p/original/2uNW4WbgBXL25BAbXGLnLqX71Sw.jpg", 2026, "Neon District", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4", 49810 },
                    { 12, "https://image.tmdb.org/t/p/original/u3TJVMY67S6WKL7f3qF2zH2M4k4.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Teens uncover secrets in an abandoned camp.", true, false, "PG-13", "https://image.tmdb.org/t/p/original/5a4JdoFwll5DRtKMe7JLuGQ9yJm.jpg", 2023, "The Last Summer Camp", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4", 15620 },
                    { 13, "https://image.tmdb.org/t/p/original/Akg1NnK8N2w4bYY6Y9A6kzI3H7J.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Politics and survival on humanity's first moon city.", true, true, "TV-14", "https://image.tmdb.org/t/p/original/4Q1n3TwieoULnuaztu9aFjqHDTI.jpg", 2025, "Moon Colony", "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 39005 },
                    { 14, "https://image.tmdb.org/t/p/original/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Two strangers relive one day in different timelines.", true, false, "PG", "https://image.tmdb.org/t/p/original/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg", 2022, "Parallel Hearts", "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 14011 },
                    { 15, "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A drone race turns into a treasure hunt.", true, true, "PG", "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", 2026, "Jungle Circuit", "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", 22400 },
                    { 16, "https://image.tmdb.org/t/p/original/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A journalist vanishes after decoding a satellite feed.", true, false, "R", "https://image.tmdb.org/t/p/original/6MKr3KgOLmzOP6MSuZERO41Lpkt.jpg", 2021, "Signal Lost", "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 17990 },
                    { 17, "https://image.tmdb.org/t/p/original/7VEUOEfRzzrQfWddlIyLUKvh6Nf.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Astronaut cadets face sabotage during final exam.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg", 2024, "Zero Gravity", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", 27001 },
                    { 18, "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A watchmaker discovers a clock that rewinds fate.", true, false, "PG-13", "https://image.tmdb.org/t/p/original/7iiJTe7QzPoUc2zV9kib4m9fM7R.jpg", 2023, "Borrowed Time", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 13888 },
                    { 19, "https://image.tmdb.org/t/p/original/wdwcOBMkt3zmPQuEMxB3FUtMio2.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A masked vigilante sparks a rebellion.", true, false, "TV-14", "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg", 2020, "City of Masks", "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", 12499 },
                    { 20, "https://image.tmdb.org/t/p/original/8YFL5QQVPy3AgrEQxNYVSgiPEbe.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A family road trip through forgotten observatories.", true, false, "PG", "https://image.tmdb.org/t/p/original/qNBAXBIQlnOThrVvA6mA2B5ggV6.jpg", 2019, "Planetarium", "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4", 9650 },
                    { 21, "https://image.tmdb.org/t/p/original/iQFcwSGbZXMkeyKrxbPnwnRo5fl.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Kids solve mysteries in a mountain village.", true, true, "G", "https://image.tmdb.org/t/p/original/2uNW4WbgBXL25BAbXGLnLqX71Sw.jpg", 2022, "Campfire Club", "https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4", 19080 },
                    { 22, "https://image.tmdb.org/t/p/original/Akg1NnK8N2w4bYY6Y9A6kzI3H7J.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Two app engineers fake date to save their startup.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/4Q1n3TwieoULnuaztu9aFjqHDTI.jpg", 2026, "404 Love Not Found", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4", 25003 },
                    { 23, "https://image.tmdb.org/t/p/original/3CxUndGhUcZdt1Zggjdb2HkLLQX.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A deaf composer hears signals from the future.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/5a4JdoFwll5DRtKMe7JLuGQ9yJm.jpg", 2025, "Dawn of Echoes", "https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4", 21070 },
                    { 24, "https://image.tmdb.org/t/p/original/euXQw5nB8Jt3Q5GsyhQOdE31E4n.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A train heist crosses three countries overnight.", true, false, "R", "https://image.tmdb.org/t/p/original/6Zx6mP4QEtBfV63P2QxY8fJfN7K.jpg", 2024, "Red Corridor", "https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4", 28776 },
                    { 25, "https://image.tmdb.org/t/p/original/9BBTo63ANSmhC4e6r62OJFuK2GL.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A coder races to stop a financial AI meltdown.", true, true, "TV-14", "https://image.tmdb.org/t/p/original/8Y43POKjjKDGI9MH89NW0NAzzp8.jpg", 2026, "Runaway Algorithm", "https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4", 37741 },
                    { 26, "https://image.tmdb.org/t/p/original/t5zCBSB5xMDKcDqe91qahCOUYVV.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Artists revive a forgotten riverside town.", true, false, "PG", "https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg", 2021, "Paper Lanterns", "https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4", 10031 },
                    { 27, "https://image.tmdb.org/t/p/original/x2RS3uTcsJJ9IfjNPcgDmukoEcQ.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "Divers discover a city beneath volcanic vents.", true, true, "PG-13", "https://image.tmdb.org/t/p/original/6MKr3KgOLmzOP6MSuZERO41Lpkt.jpg", 2020, "Deep Current", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4", 15321 },
                    { 28, "https://image.tmdb.org/t/p/original/4HodYYKEIsGOdinkGi2Ucz6X9i0.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A teen spy infiltrates a private academy.", true, false, "PG", "https://image.tmdb.org/t/p/original/7iiJTe7QzPoUc2zV9kib4m9fM7R.jpg", 2023, "Code Name Kite", "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4", 16222 },
                    { 29, "https://image.tmdb.org/t/p/original/7VEUOEfRzzrQfWddlIyLUKvh6Nf.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A music teacher starts a jungle orchestra.", true, false, "G", "https://image.tmdb.org/t/p/original/3h1JZGDhZ8nzxdgvkxha0qBqi05.jpg", 2018, "Wild Notes", "https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4", 8120 },
                    { 30, "https://image.tmdb.org/t/p/original/wdwcOBMkt3zmPQuEMxB3FUtMio2.jpg", new DateTime(2026, 5, 23, 0, 0, 0, 0, DateTimeKind.Utc), "A radio host receives calls from alternate realities.", true, true, "TV-14", "https://image.tmdb.org/t/p/original/s16H6tpK2utvwDtzZ8Qy4qm5Emw.jpg", 2022, "After Midnight", "https://storage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4", 22229 }
                });

            migrationBuilder.InsertData(
                table: "MovieGenres",
                columns: new[] { "GenreId", "MovieId" },
                values: new object[,]
                {
                    { 1, 1 },
                    { 4, 1 },
                    { 1, 2 },
                    { 2, 2 },
                    { 1, 3 },
                    { 3, 3 },
                    { 2, 4 },
                    { 6, 4 },
                    { 2, 5 },
                    { 5, 5 },
                    { 1, 6 },
                    { 4, 6 },
                    { 2, 7 },
                    { 3, 7 },
                    { 6, 8 },
                    { 7, 8 },
                    { 3, 9 },
                    { 8, 9 },
                    { 4, 10 },
                    { 5, 10 },
                    { 1, 11 },
                    { 4, 11 },
                    { 2, 12 },
                    { 5, 12 },
                    { 2, 13 },
                    { 4, 13 },
                    { 2, 14 },
                    { 6, 14 },
                    { 1, 15 },
                    { 7, 15 },
                    { 2, 16 },
                    { 5, 16 },
                    { 1, 17 },
                    { 4, 17 },
                    { 2, 18 },
                    { 4, 18 },
                    { 1, 19 },
                    { 2, 19 },
                    { 6, 20 },
                    { 8, 20 },
                    { 2, 21 },
                    { 7, 21 },
                    { 3, 22 },
                    { 6, 22 },
                    { 2, 23 },
                    { 4, 23 },
                    { 1, 24 },
                    { 5, 24 },
                    { 1, 25 },
                    { 4, 25 },
                    { 2, 26 },
                    { 8, 26 },
                    { 4, 27 },
                    { 8, 27 },
                    { 1, 28 },
                    { 7, 28 },
                    { 3, 29 },
                    { 7, 29 },
                    { 4, 30 },
                    { 5, 30 }
                });

            migrationBuilder.InsertData(
                table: "Seasons",
                columns: new[] { "Id", "MovieId", "SeasonNumber", "Title" },
                values: new object[,]
                {
                    { 1, 1, 1, "Season 1" },
                    { 2, 11, 1, "Season 1" },
                    { 3, 13, 1, "Season 1" }
                });

            migrationBuilder.InsertData(
                table: "Episodes",
                columns: new[] { "Id", "DurationMinutes", "EpisodeNumber", "SeasonId", "SubtitleUrl", "Title", "VideoUrl" },
                values: new object[,]
                {
                    { 1, 48, 1, 1, "https://raw.githubusercontent.com/mozilla/vtt.js/master/test/fixtures/webvtt-file.vtt", "Breach", "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
                    { 2, 51, 2, 1, "https://raw.githubusercontent.com/mozilla/vtt.js/master/test/fixtures/webvtt-file.vtt", "Fallback", "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
                    { 3, 44, 1, 2, "https://raw.githubusercontent.com/mozilla/vtt.js/master/test/fixtures/webvtt-file.vtt", "Neon Rain", "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" },
                    { 4, 46, 1, 3, "https://raw.githubusercontent.com/mozilla/vtt.js/master/test/fixtures/webvtt-file.vtt", "First Signal", "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_MovieGenres_GenreId",
                table: "MovieGenres",
                column: "GenreId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MovieGenres");

            migrationBuilder.DropTable(
                name: "Genres");

            migrationBuilder.DeleteData(
                table: "Episodes",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Episodes",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Episodes",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Episodes",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 12);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 14);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 15);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 16);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 17);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 18);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 19);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 20);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 21);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 22);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 23);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 24);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 25);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 26);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 27);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 28);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 29);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 30);

            migrationBuilder.DeleteData(
                table: "Seasons",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Seasons",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Seasons",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 11);

            migrationBuilder.DeleteData(
                table: "Movies",
                keyColumn: "Id",
                keyValue: 13);

            migrationBuilder.DropColumn(
                name: "IsNetflixOriginal",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "ReleaseYear",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "TrailerUrl",
                table: "Movies");

            migrationBuilder.DropColumn(
                name: "ViewCount",
                table: "Movies");
        }
    }
}
