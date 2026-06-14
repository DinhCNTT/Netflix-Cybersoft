import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import useProfileStore from "../../store/profileStore";
import Navbar from "../../components/layouts/Navbar";
import SubHeader, { GENRE_MAP } from "../../components/layouts/SubHeader";
import HeroBanner from "../../components/movies/HeroBanner";
import MovieRow from "../../components/movies/MovieRow";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const SeriesGenre = () => {
  const { genreId } = useParams();
  const location = useLocation();
  const activeProfile = useProfileStore((state) => state.activeProfile);

  const [featuredMovie, setFeaturedMovie] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [hoverData, setHoverData] = useState(null);
  const [myListToast, setMyListToast] = useState("");
  const [feedbackMovieId, setFeedbackMovieId] = useState(null);

  const hoverOpenTimerRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const isKids = activeProfile?.isKids;

  const trailerUrl = useMemo(() => {
    if (!featuredMovie?.trailerUrl) return "";
    return featuredMovie.trailerUrl;
  }, [featuredMovie]);

  const genreConfig = GENRE_MAP[genreId] || { type: "tv" };
  const genreLabel = useMemo(() => {
    const parts = genreId.split("-");
    const capitalized = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    if (genreId === "chau-a") return "Châu Á";
    if (genreId === "chau-au") return "Châu Âu";
    if (genreId === "hanh-dong") return "Hành động";
    if (genreId === "kinh-di") return "Kinh dị";
    if (genreId === "lang-man") return "Lãng mạn";
    if (genreId === "hai") return "Hài";
    if (genreId === "giat-gan") return "Giật gân";
    if (genreId === "chinh-kich") return "Chính kịch";
    if (genreId === "tai-lieu") return "Tài liệu";
    return capitalized;
  }, [genreId]);

  const hasRenderableRows = useMemo(
    () => rows.some((row) => (row.movies || []).length > 0),
    [rows],
  );

  const clearHoverTimers = useCallback(() => {
    if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
  }, []);

  const refreshHoverRect = useCallback(() => {
    setHoverData((current) => {
      if (!current?.anchorElement) return current;
      if (!current.anchorElement.isConnected) return null;
      return { ...current, anchorRect: current.anchorElement.getBoundingClientRect() };
    });
  }, []);

  const scheduleHoverClose = useCallback(() => {
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
    hoverCloseTimerRef.current = setTimeout(() => {
      setHoverData(null);
      hoverCloseTimerRef.current = null;
    }, 120);
  }, []);

  const handleCardHoverStart = useCallback(
    ({ movie, anchorElement, align, isLarge, rowVariant }) => {
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = null;
      }
      setHoverData({
        movie, anchorElement, align, isLarge, rowVariant,
        anchorRect: anchorElement.getBoundingClientRect(),
      });
    },
    [],
  );

  const handlePortalEnter = useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const showMyListToast = useCallback((message) => {
    setMyListToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setMyListToast("");
      toastTimerRef.current = null;
    }, 900);
  }, []);

  const triggerMovieFeedback = useCallback((movieId) => {
    setFeedbackMovieId(movieId);
    setTimeout(() => {
      setFeedbackMovieId((current) => (current === movieId ? null : current));
    }, 420);
  }, []);

  useEffect(() => {
    const loadGenreData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [favIds, myListRaw] = await Promise.all([
          movieApi.getFavouriteIds(),
          movieApi.getMyList(),
        ]);

        const myList = myListRaw.filter(m => m.mediaType === "tv" || m.seasons?.length > 0);

        const shuffleArray = (array) => {
          const newArr = [...array];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        const ROW_CONFIGS = [
          { key: "all_in_genre", type: "discover", params: { ...genreConfig }, title: `Phim và series ${genreLabel.toLowerCase()}` },
          { key: "top10_genre", type: "discover", params: { ...genreConfig, sort_by: "popularity.desc" }, title: `Top 10 series ${genreLabel.toLowerCase()} hôm nay`, variant: "top10" },
          { key: "new_in_genre", type: "discover", params: { ...genreConfig, sort_by: "first_air_date.desc" }, title: `Mới phát hành` },
          { key: "highly_rated", type: "discover", params: { ...genreConfig, sort_by: "vote_average.desc", "vote_count.gte": 100 }, title: `Được đánh giá cao` },
        ];

        if (genreId === "chau-a") {
          ROW_CONFIGS.push({ key: "cn_series", params: { type: "tv", country: "CN" }, title: "Series Trung Quốc đại lục" });
          ROW_CONFIGS.push({ key: "kr_series", params: { type: "tv", country: "KR" }, title: "Series Hàn Quốc" });
          ROW_CONFIGS.push({ key: "jp_series", params: { type: "tv", country: "JP" }, title: "Series Nhật Bản" });
        } else if (genreId === "hanh-dong") {
          ROW_CONFIGS.push({ key: "action_comedy", params: { type: "tv", genres: "10759,35" }, title: "Hành động hài hước" });
          ROW_CONFIGS.push({ key: "action_scifi", params: { type: "tv", genres: "10759,10765" }, title: "Hành động viễn tưởng" });
        } else {
          const isRegionGenre = ["chau-a", "chau-au", "my", "anh"].includes(genreId);
          console.log("Current genreId:", genreId, "isRegionGenre:", isRegionGenre);
          
          if (!isRegionGenre) {
            // Thêm các hàng lọc theo quốc gia để làm phong phú dữ liệu cho các thể loại khác
            ROW_CONFIGS.push({ key: "us_genre", params: { ...genreConfig, country: "US" }, title: `Series ${genreLabel.toLowerCase()} của Mỹ` });
            ROW_CONFIGS.push({ key: "kr_genre", params: { ...genreConfig, country: "KR" }, title: `Series ${genreLabel.toLowerCase()} Hàn Quốc` });
            ROW_CONFIGS.push({ key: "eu_genre", params: { ...genreConfig, country: "GB|FR|DE|ES" }, title: `Series ${genreLabel.toLowerCase()} Châu Âu` });
          }
          
          if (genreId !== "hai" && genreId !== "tai-lieu") {
            // Pha trộn thêm yếu tố giật gân/bí ẩn cho các thể loại như Lãng mạn, Kinh dị, Khoa học viễn tưởng
            ROW_CONFIGS.push({ key: "thriller_mix", params: { ...genreConfig, keywords: genreConfig.keywords ? `${genreConfig.keywords},9759` : "9759" }, title: `${genreLabel} kịch tính & hồi hộp` });
          }
        }

        const dynamicRowsData = await Promise.all(
          ROW_CONFIGS.map(async (config) => {
            const movies = await movieApi.discoverContent(config.params);
            return {
              key: config.key,
              title: config.title,
              movies: shuffleArray(movies),
              variant: config.variant || "standard"
            };
          })
        );

        const baseRows = [];
        baseRows.push(dynamicRowsData[0]);

        if (myList.length > 0) {
          baseRows.push({
              key: "continue",
              title: `Danh sách Tiếp tục xem của ${activeProfile?.name || "bạn"}`,
              movies: myList,
              variant: "continue",
          });
        }

        baseRows.push(...dynamicRowsData.slice(1));

        const seenIds = new Set();
        const kidsFilteredRows = baseRows.map((row) => {
          let moviesToKeep = row.movies || [];

          if (isKids) {
            moviesToKeep = moviesToKeep.filter((movie) =>
              ["G", "PG", "TV-G", "TV-PG"].includes(
                (movie.maturityLevel || "").toUpperCase(),
              ),
            );
          }

          if (row.key === "all_in_genre" || row.key === "new_in_genre") {
            moviesToKeep = moviesToKeep.filter((m) => {
              if (seenIds.has(m.id)) return false;
              seenIds.add(m.id);
              return true;
            });
          }

          return { ...row, movies: moviesToKeep };
        });

        const allGenreMovies = dynamicRowsData[0]?.movies || [];
        const featured = allGenreMovies.length > 0 
          ? allGenreMovies[Math.floor(Math.random() * allGenreMovies.length)] 
          : null;

        setFeaturedMovie(featured);
        setFavouriteIds(favIds);
        setRows(kidsFilteredRows);
      } catch (error) {
        console.error("Loi khi tai du lieu SeriesGenre:", error);
        setErrorMessage("Khong the tai du lieu. Vui long kiem tra lai.");
      } finally {
        setIsLoading(false);
      }
    };

    loadGenreData();
  }, [genreId, isKids, activeProfile?.name, genreConfig, genreLabel]);

  useEffect(() => {
    if (!hoverData) return undefined;
    const onViewportChange = () => refreshHoverRect();
    window.addEventListener("scroll", onViewportChange, true);
    window.addEventListener("resize", onViewportChange);
    return () => {
      window.removeEventListener("scroll", onViewportChange, true);
      window.removeEventListener("resize", onViewportChange);
    };
  }, [hoverData, refreshHoverRect]);

  useEffect(() => {
    return () => {
      clearHoverTimers();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, [clearHoverTimers]);

  const handleOpenMovieInfo = (movie) => {
    setHoverData(null);
    setSelectedMovie(movie);
    setIsModalOpen(true);
  };

  const handleCloseMovieInfo = () => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  };

  const handleToggleFavourite = useCallback(
    async (movie) => {
      try {
        let updatedIds = [];
        const isFavourite = favouriteIds.includes(movie.id);

        if (isFavourite) {
          updatedIds = await movieApi.removeFavourite(movie.id);
          showMyListToast("Da xoa khoi My List");
        } else {
          updatedIds = await movieApi.addFavourite(movie.id);
          showMyListToast("Da them vao My List");
        }

        setFavouriteIds(updatedIds);
        triggerMovieFeedback(movie.id);
      } catch (error) {
        console.error("Loi cap nhat My List:", error);
      }
    },
    [favouriteIds, showMyListToast, triggerMovieFeedback],
  );

  const handleRateFromHover = useCallback(async (movie, value) => {
    try {
      await movieApi.rateMovie(movie.id, value);
    } catch (error) {
      console.error("Loi cap nhat rating:", error);
    }
  }, []);

  const handleRemoveFromRow = useCallback((movie) => {
    setRows((prev) =>
      prev.map((row) => ({
        ...row,
        movies: row.movies.filter((m) => m.id !== movie.id),
      })),
    );
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] pb-28">
      <Navbar />
      
      <HeroBanner
        movie={featuredMovie}
        trailerUrl={trailerUrl}
        onMoreInfo={handleOpenMovieInfo}
      >
        <SubHeader title="Series" genreName={`Series ${genreLabel.toLowerCase()}`} />
      </HeroBanner>

      <div className="relative z-20 -mt-[20vw] md:-mt-[13vw] lg:-mt-[10vw]">
        {myListToast && (
          <div className="pointer-events-none fixed right-4 top-24 z-[95] rounded bg-[#1f1f1f] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.38)] motion-fade-in">
            {myListToast}
          </div>
        )}

        {errorMessage && (
          <div className="mx-4 mb-4 flex items-center gap-2 rounded-md border border-red-500/60 bg-red-950/70 p-4 text-sm text-red-200 md:mx-12">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="px-4 md:px-12 mt-8">
            <div className="h-8 w-60 animate-pulse rounded bg-[#2a2a2a]" />
            <div className="mt-4 flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 w-56 flex-shrink-0 animate-pulse rounded bg-[#2a2a2a] md:h-44 md:w-72"
                />
              ))}
            </div>
          </div>
        ) : hasRenderableRows ? (
          rows.map((row, index) => (
            <div
              key={row.key}
              className="motion-fade-in mt-6"
              style={{ animationDelay: `${Math.min(index * 70, 350)}ms` }}
            >
              <MovieRow
                title={row.title}
                movies={row.movies}
                isLarge={row.isLarge}
                variant={row.variant}
                onPlay={handleOpenMovieInfo}
                onMoreInfo={handleOpenMovieInfo}
                favouriteIds={favouriteIds}
                onToggleFavourite={handleToggleFavourite}
                feedbackMovieId={feedbackMovieId}
                onHoverStart={handleCardHoverStart}
                onHoverEnd={scheduleHoverClose}
              />
            </div>
          ))
        ) : (
          <div className="mx-4 rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200 md:mx-12 mt-8">
            Chưa có series nào thuộc thể loại này.
          </div>
        )}
      </div>

      <MovieInfoModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseMovieInfo}
        isInMyList={selectedMovie ? favouriteIds.includes(selectedMovie.id) : false}
        onToggleMyList={handleToggleFavourite}
        onPlay={handleOpenMovieInfo}
        contextGenre={genreLabel}
      />

      <MovieHoverPortal
        hoverData={hoverData}
        isFavourite={hoverData ? favouriteIds.includes(hoverData.movie.id) : false}
        onPlay={handleOpenMovieInfo}
        onMoreInfo={handleOpenMovieInfo}
        onToggleFavourite={handleToggleFavourite}
        onRemoveFromRow={hoverData?.rowVariant === "continue" ? handleRemoveFromRow : undefined}
        onRate={handleRateFromHover}
        onPortalEnter={handlePortalEnter}
        onPortalLeave={scheduleHoverClose}
      />
    </div>
  );
};

export default SeriesGenre;

