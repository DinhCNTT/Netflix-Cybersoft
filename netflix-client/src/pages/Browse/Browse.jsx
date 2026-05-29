import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLocation } from "react-router-dom";
import useProfileStore from "../../store/profileStore";
import Navbar from "../../components/layouts/Navbar";
import HeroBanner from "../../components/movies/HeroBanner";
import MovieRow from "../../components/movies/MovieRow";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const Browse = () => {
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

  useEffect(() => {
    const loadBrowseData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [
          featured,
          trending,
          originals,
          newReleases,
          myList,
          favIds,
        ] = await Promise.all([
          movieApi.getFeaturedMovie(),
          movieApi.getTrendingMovies(),
          movieApi.getNetflixOriginals(),
          movieApi.getNewReleases(),
          movieApi.getMyList(),
          movieApi.getFavouriteIds(),
        ]);

        // Hàm trộn ngẫu nhiên mảng để tạo sự thay đổi mỗi lần F5
        const shuffleArray = (array) => {
          const newArr = [...array];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        // Cấu hình các hàng "Của Netflix" (Người lớn)
        const ADULT_ROW_CONFIGS = [
          { key: "romance_kr", type: "discover", params: { type: "tv", country: "KR", genres: "10749" }, title: "Series Hàn Quốc lãng mạn" },
          { key: "anime", type: "discover", params: { type: "tv", language: "ja", genres: "16" }, title: "Anime" },
          { key: "heist", type: "discover", params: { type: "movie", keywords: "9759" }, title: "Ai mà không mê những phi vụ?" },
          { key: "thriller_us", type: "discover", params: { type: "movie", country: "US", genres: "53" }, title: "Phim Mỹ lý thú" },
          { key: "drama_kr_triangle", type: "discover", params: { type: "tv", country: "KR", genres: "18", keywords: "12554" }, title: "Phim chính kịch Hàn Quốc về tình tay ba" },
          { key: "comedy_hollywood", type: "discover", params: { type: "movie", country: "US", genres: "35" }, title: "Phim hài Hollywood" },
          { key: "eu_us_series", type: "discover", params: { type: "tv", country: "US,GB" }, title: "Series Âu – Mỹ" },
          { key: "asia_movies", type: "discover", params: { type: "movie", country: "KR,JP,CN,TH,TW" }, title: "Phim và series châu Á" },
          { key: "scifi", type: "discover", params: { type: "movie", genres: "878" }, title: "Phim khoa học viễn tưởng" },
          { key: "action", type: "discover", params: { type: "movie", genres: "28" }, title: "Hành động & phiêu lưu" },
          { key: "documentary", type: "discover", params: { type: "movie", genres: "99" }, title: "Phim tài liệu" },
          { key: "horror", type: "discover", params: { type: "movie", genres: "27" }, title: "Phim kinh dị" },
          { key: "family", type: "discover", params: { type: "movie", genres: "10751" }, title: "Gia đình cùng xem" },
          { key: "crime", type: "discover", params: { type: "movie", genres: "80" }, title: "Phim tội phạm" },
          { key: "reality", type: "discover", params: { type: "tv", genres: "10764" }, title: "Truyền hình thực tế" },
        ];

        // Cấu hình các hàng dành riêng cho Trẻ em
        const KIDS_ROW_CONFIGS = [
          { key: "kids_animation", type: "discover", params: { type: "movie", genres: "16" }, title: "Phim hoạt hình cực vui" },
          { key: "kids_family", type: "discover", params: { type: "movie", genres: "10751" }, title: "Gia đình cùng xem" },
          { key: "kids_comedy", type: "discover", params: { type: "movie", genres: "35" }, title: "Phim hài hước" },
          { key: "kids_adventure", type: "discover", params: { type: "movie", genres: "12" }, title: "Phiêu lưu kỳ thú" },
          { key: "kids_fantasy", type: "discover", params: { type: "movie", genres: "14" }, title: "Thế giới phép thuật" },
          { key: "kids_music", type: "discover", params: { type: "movie", genres: "10402" }, title: "Âm nhạc rộn rã" },
          { key: "kids_tv_animation", type: "discover", params: { type: "tv", genres: "16" }, title: "Phim hoạt hình dài tập" },
          { key: "kids_action", type: "discover", params: { type: "movie", genres: "28" }, title: "Hành động mãn nhãn" },
        ];

        const ROW_CONFIGS = isKids ? KIDS_ROW_CONFIGS : ADULT_ROW_CONFIGS;

        // Lấy tất cả cấu hình, xáo trộn ngẫu nhiên để có rất nhiều hàng như Netflix thật
        const shuffledConfigs = shuffleArray(ROW_CONFIGS);
        const dynamicRowsData = await Promise.all(
          shuffledConfigs.map(async (config) => {
            const movies = await movieApi.discoverContent(config.params);
            return {
              key: config.key,
              title: config.title,
              movies: shuffleArray(movies)
            };
          })
        );

        // Hàng "Của Bạn": Vì bạn đã thích...
        let recommendationRow = null;
        if (myList && myList.length > 0) {
           const randomMyListMovie = myList[Math.floor(Math.random() * myList.length)];
           try {
             const recommendedMovies = await movieApi.getRecommendations(randomMyListMovie.id);
             if (recommendedMovies && recommendedMovies.length > 0) {
                 recommendationRow = {
                     key: `rec-${randomMyListMovie.id}`,
                     title: `Vì bạn đã thích ${randomMyListMovie.title}`,
                     movies: recommendedMovies,
                     variant: "standard"
                 };
             }
           } catch (e) {
             console.error("Lỗi khi tải phim gợi ý:", e);
           }
        }

        const continueWatchingMovies = (myList.length ? myList : originals);
        const top10Movies = (newReleases.length ? newReleases : trending).slice(0, 10);

        const baseRows = [];
        
        if (recommendationRow) baseRows.push(recommendationRow);

        baseRows.push({
            key: "continue",
            title: `Danh sách Tiếp tục xem của ${activeProfile?.name || "bạn"}`,
            movies: continueWatchingMovies,
            variant: "continue",
        });

        // Chèn 2 hàng động (Của Netflix)
        baseRows.push(...dynamicRowsData.slice(0, 2));

        baseRows.push({
            key: "top10",
            title: "Top 10 series tại Việt Nam hôm nay",
            movies: top10Movies,
            variant: "top10",
        });

        baseRows.push({
            key: "mylist",
            title: "Danh sách của tôi",
            movies: myList,
            variant: "standard",
        });

        // Chèn các hàng động còn lại
        baseRows.push(...dynamicRowsData.slice(2));

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

          if (row.key === "asia" || row.key.startsWith("rec-")) {
            moviesToKeep = moviesToKeep.filter((m) => {
              if (seenIds.has(m.id)) return false;
              seenIds.add(m.id);
              return true;
            });
          }

          return { ...row, movies: moviesToKeep };
        });

        let candidateMovies = [
          featured,
          ...trending,
          ...originals,
          ...newReleases,
          ...myList,
          ...dynamicRowsData.flatMap((row) => row.movies || []),
        ].filter(Boolean);

        if (isKids) {
          candidateMovies = candidateMovies.filter((movie) =>
            ["G", "PG", "TV-G", "TV-PG"].includes(
              (movie.maturityLevel || "").toUpperCase(),
            ),
          );
        }

        // Ưu tiên chọn ngẫu nhiên một phim có Trailer (đối với profile người lớn)
        const moviesWithTrailers = candidateMovies.filter((movie) => Boolean(movie?.trailerUrl));
        const randomTrailerMovie = moviesWithTrailers.length > 0 
           ? moviesWithTrailers[Math.floor(Math.random() * moviesWithTrailers.length)] 
           : null;

        // Hoặc chọn ngẫu nhiên một phim bất kỳ (đối với profile trẻ em không có sẵn trailer)
        const randomAnyMovie = candidateMovies.length > 0
           ? candidateMovies[Math.floor(Math.random() * candidateMovies.length)]
           : null;

        setFeaturedMovie(
          randomTrailerMovie || randomAnyMovie || null
        );
        setFavouriteIds(favIds);
        setRows(kidsFilteredRows);
      } catch (error) {
        console.error("Loi khi tai du lieu Browse:", error);
        setErrorMessage(
          "Khong the tai du lieu phim tu backend. Vui long kiem tra API movies va thu lai.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBrowseData();
  }, [isKids, activeProfile?.name]);

  useEffect(() => {
    if (!hoverData) {
      return undefined;
    }

    const onViewportChange = () => {
      refreshHoverRect();
    };

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
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [clearHoverTimers]);

  useEffect(() => {
    if (!rows.length) {
      return;
    }

    const params = new URLSearchParams(location.search);
    if (params.get("section") !== "mylist") {
      return;
    }

    const scrollToMyList = () => {
      const rowElement = document.getElementById("browse-row-mylist");
      if (!rowElement) {
        return;
      }

      rowElement.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const timer = window.setTimeout(scrollToMyList, 180);
    return () => window.clearTimeout(timer);
  }, [rows, location.search]);

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

        // Re-pull My List row from backend for consistent ordering.
        const myList = await movieApi.getMyList();
        setRows((prev) =>
          prev.map((row) =>
            row.key === "mylist"
              ? {
                  ...row,
                  movies: myList,
                }
              : row,
          ),
        );
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
      />

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
            Chua co du lieu row phim de hien thi. Hay kiem tra backend
            movies/genres.
          </div>
        )}
      </div>

      <MovieInfoModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseMovieInfo}
        isInMyList={
          selectedMovie ? favouriteIds.includes(selectedMovie.id) : false
        }
        onToggleMyList={handleToggleFavourite}
        onPlay={handleOpenMovieInfo}
      />

      <MovieHoverPortal
        hoverData={hoverData}
        isFavourite={
          hoverData ? favouriteIds.includes(hoverData.movie.id) : false
        }
        onPlay={handleOpenMovieInfo}
        onMoreInfo={handleOpenMovieInfo}
        onToggleFavourite={handleToggleFavourite}
        onRemoveFromRow={
          hoverData?.rowVariant === "continue" ? handleRemoveFromRow : undefined
        }
        onRate={handleRateFromHover}
        onPortalEnter={handlePortalEnter}
        onPortalLeave={scheduleHoverClose}
      />
    </div>
  );
};

export default Browse;
