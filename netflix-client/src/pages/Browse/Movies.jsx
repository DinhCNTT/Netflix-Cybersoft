import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import useProfileStore from "../../store/profileStore";
import Navbar from "../../components/layouts/Navbar";
import SubHeader from "../../components/layouts/SubHeader";
import HeroBanner from "../../components/movies/HeroBanner";
import MovieRow from "../../components/movies/MovieRow";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const Movies = () => {
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
    if (!featuredMovie?.trailerUrl) {
      return "";
    }
    return featuredMovie.trailerUrl;
  }, [featuredMovie]);

  const hasRenderableRows = useMemo(
    () => rows.some((row) => (row.movies || []).length > 0),
    [rows],
  );

  const clearHoverTimers = useCallback(() => {
    if (hoverOpenTimerRef.current) {
      clearTimeout(hoverOpenTimerRef.current);
      hoverOpenTimerRef.current = null;
    }
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const refreshHoverRect = useCallback(() => {
    setHoverData((current) => {
      if (!current?.anchorElement) {
        return current;
      }
      if (!current.anchorElement.isConnected) {
        return null;
      }
      return {
        ...current,
        anchorRect: current.anchorElement.getBoundingClientRect(),
      };
    });
  }, []);

  const scheduleHoverClose = useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
    }
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
        movie,
        anchorElement,
        align,
        isLarge,
        rowVariant,
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
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
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

  // Hàm lọc sạch phim bộ và phim nhạy cảm người lớn (18+/porn/sex)
  const cleanMovies = useCallback((movies) => {
    return (movies || []).filter((movie) => {
      const isNotTv = movie.mediaType === "movie" || !movie.seasons;
      const titleLower = (movie.title || movie.name || "").toLowerCase();
      const overviewLower = (movie.overview || "").toLowerCase();
      
      const isAdult = movie.adult === true ||
        titleLower.includes("porn") || 
        titleLower.includes("sex") || 
        titleLower.includes("18+") || 
        titleLower.includes("erotic") ||
        overviewLower.includes("khiêu dâm") || 
        overviewLower.includes("phim cấp 3");

      return isNotTv && !isAdult;
    });
  }, []);

  useEffect(() => {
    const loadBrowseData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          featuredRes,
          favIds,
          myListRaw,
        ] = await Promise.all([
          movieApi.discoverContent({ type: "movie" }),
          movieApi.getFavouriteIds(),
          movieApi.getMyList(),
        ]);

        const cleanedFeaturedRes = cleanMovies(featuredRes);
        const myList = cleanMovies(myListRaw);

        const shuffleArray = (array) => {
          const newArr = [...array];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        const MOVIE_ROW_CONFIGS = [
          { key: "popular_movies", params: { type: "movie", sort_by: "popularity.desc" }, title: "Phim được yêu thích nổi tiếng" },
          { key: "crime_drama", params: { type: "movie", genres: "18,80" }, title: "Phim chính kịch tội phạm" },
          { key: "netflix_originals", params: { type: "movie", sort_by: "vote_count.desc" }, title: "Chỉ có trên Netflix" },
          { key: "friendship_comedy", params: { type: "movie", genres: "35", keywords: "9716" }, title: "Phim hài về tình bạn" },
          { key: "drama_movies", params: { type: "movie", genres: "18" }, title: "Phim chính kịch" },
          { key: "top_picks", params: { type: "movie", sort_by: "popularity.desc", "vote_count.gte": 100 }, title: "Lựa chọn hàng đầu hôm nay cho bạn" },
          { key: "romance_comedy", params: { type: "movie", genres: "35,10749" }, title: "Phim hài lãng mạn" },
          { key: "history_20th", params: { type: "movie", genres: "36" }, title: "Phim thời kỳ lịch sử thế kỷ 20" },
          { key: "euro_us_action", params: { type: "movie", genres: "28", country: "US|GB|FR|DE|ES" }, title: "Phim hành động Âu – Mỹ" },
          { key: "emotional_drama", params: { type: "movie", genres: "18", keywords: "233633" }, title: "Phim chính kịch xúc động" },
          { key: "comedy_movies", params: { type: "movie", genres: "35" }, title: "Phim hài" },
          { key: "sci_fi", params: { type: "movie", genres: "878" }, title: "Phim khoa học viễn tưởng" },
          { key: "true_story", params: { type: "movie", keywords: "9663" }, title: "Phim dựa trên câu chuyện có thật" }
        ];

        const KIDS_ROW_CONFIGS = [
          { key: "kids_animation", params: { type: "movie", genres: "16" }, title: "Phim hoạt hình lẻ" },
          { key: "kids_family", params: { type: "movie", genres: "10751" }, title: "Phim gia đình" },
        ];

        const ROW_CONFIGS = isKids ? KIDS_ROW_CONFIGS : MOVIE_ROW_CONFIGS;

        const dynamicRowsData = await Promise.all(
          ROW_CONFIGS.map(async (config) => {
            try {
              const movies = await movieApi.discoverContent(config.params);
              return {
                key: config.key,
                title: config.title,
                movies: shuffleArray(cleanMovies(movies)),
                variant: "standard"
              };
            } catch (err) {
              console.error(`Lỗi tải hàng ${config.title}:`, err);
              return { key: config.key, title: config.title, movies: [], variant: "standard" };
            }
          })
        );

        let recommendationRow = null;
        if (myList && myList.length > 0) {
           const randomMyListMovie = myList[Math.floor(Math.random() * myList.length)];
           try {
             const recommendedMovies = await movieApi.getRecommendations(randomMyListMovie.id);
             const movieRecs = cleanMovies(recommendedMovies);
             if (movieRecs && movieRecs.length > 0) {
                 recommendationRow = {
                     key: `rec-${randomMyListMovie.id}`,
                     title: "Có thể bạn sẽ mê các tác phẩm này",
                     movies: movieRecs,
                     variant: "standard"
                 };
             }
           } catch (e) {
             console.error("Lỗi khi tải phim gợi ý:", e);
           }
        }

        let watchNextRow = null;
        if (cleanedFeaturedRes && cleanedFeaturedRes.length > 5) {
          watchNextRow = {
            key: "watch_next",
            title: "Xem gì tiếp theo",
            movies: shuffleArray(cleanedFeaturedRes).slice(5),
            variant: "standard"
          };
        }

        const baseRows = [];
        
        // 1. Có thể bạn sẽ mê các tác phẩm này
        if (recommendationRow) baseRows.push(recommendationRow);

        // 2. Tiếp tục xem (lấy myList tạm thời)
        baseRows.push({
            key: "continue",
            title: `Danh sách Tiếp tục xem của ${activeProfile?.name || "bạn"}`,
            movies: myList,
            variant: "continue",
        });

        // 3. Phim được yêu thích nổi tiếng
        const popularRow = dynamicRowsData.find(r => r.key === "popular_movies");
        if (popularRow) baseRows.push(popularRow);

        // 4. Lọc thêm các hàng động/chính kịch tội phạm...
        const otherRows = dynamicRowsData.filter(r => r.key !== "popular_movies");
        baseRows.push(...otherRows.slice(0, 4));

        // 5. Danh sách của tôi
        baseRows.push({
            key: "mylist",
            title: "Danh sách của tôi",
            movies: myList,
            variant: "standard",
        });

        // 6. Các hàng còn lại
        baseRows.push(...otherRows.slice(4));

        // 7. Xem gì tiếp theo
        if (watchNextRow) baseRows.push(watchNextRow);

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

          if (row.key.startsWith("rec-") || row.key === "watch_next") {
            moviesToKeep = moviesToKeep.filter((m) => {
              if (seenIds.has(m.id)) return false;
              seenIds.add(m.id);
              return true;
            });
          }

          return { ...row, movies: moviesToKeep };
        });

        const featured = cleanedFeaturedRes.length > 0 
          ? cleanedFeaturedRes[Math.floor(Math.random() * cleanedFeaturedRes.length)] 
          : null;

        setFeaturedMovie(featured);
        setFavouriteIds(favIds);
        setRows(kidsFilteredRows.filter(r => r.movies.length > 0).slice(0, 12)); // Đảm bảo lấy tối đa khoảng 12 hàng phim
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu Movies:", error);
        setErrorMessage(
          "Không thể tải dữ liệu phim từ backend. Vui lòng kiểm tra API và thử lại.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBrowseData();
  }, [isKids, activeProfile?.name, cleanMovies]);

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
          showMyListToast("Đã xóa khỏi Danh sách của tôi");
        } else {
          updatedIds = await movieApi.addFavourite(movie.id);
          showMyListToast("Đã thêm vào Danh sách của tôi");
        }

        setFavouriteIds(updatedIds);
        triggerMovieFeedback(movie.id);

        const myListRaw = await movieApi.getMyList();
        const myList = cleanMovies(myListRaw);
        
        setRows((prev) =>
          prev.map((row) =>
            row.key === "mylist"
              ? { ...row, movies: myList }
              : row,
          ),
        );
      } catch (error) {
        console.error("Lỗi cập nhật Danh sách của tôi:", error);
      }
    },
    [favouriteIds, showMyListToast, triggerMovieFeedback, cleanMovies],
  );

  const handleRateFromHover = useCallback(async (movie, value) => {
    try {
      await movieApi.rateMovie(movie.id, value);
    } catch (error) {
      console.error("Lỗi cập nhật rating:", error);
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
        <SubHeader title="Phim" type="movie" />
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
          <div className="px-4 md:px-12">
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
              id={row.key === "mylist" ? "browse-row-mylist" : undefined}
              className="motion-fade-in"
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
          <div className="mx-4 rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200 md:mx-12">
            Chưa có dữ liệu phim lẻ để hiển thị. Vui lòng kiểm tra lại.
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

export default Movies;
