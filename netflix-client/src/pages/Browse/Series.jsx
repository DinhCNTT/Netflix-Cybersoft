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

const Series = () => {
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
          featuredRes,
          favIds,
          myListRaw,
        ] = await Promise.all([
          movieApi.discoverContent({ type: "tv" }),
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

        const SERIES_ROW_CONFIGS = [
          { key: "top10_vn", type: "discover", params: { type: "tv" }, title: "Top 10 series tại Việt Nam hôm nay", variant: "top10" },
          { key: "kr_series", type: "discover", params: { type: "tv", country: "KR" }, title: "Sản xuất tại Hàn Quốc" },
          { key: "us_drama", type: "discover", params: { type: "tv", country: "US", genres: "18" }, title: "Chính kịch Mỹ" },
          { key: "kr_romance", type: "discover", params: { type: "tv", country: "KR,JP,CN", genres: "10749" }, title: "Series Châu Á lãng mạn" },
          { key: "highly_rated", type: "discover", params: { type: "tv" }, title: "Series được giới chuyên môn đánh giá cao" },
          { key: "eu_us_series", type: "discover", params: { type: "tv", country: "US,GB,DE,ES,FR" }, title: "Series Âu – Mỹ" },
          { key: "comedy_series", type: "discover", params: { type: "tv", genres: "35" }, title: "Series hài hước" },
          { key: "action_series", type: "discover", params: { type: "tv", genres: "10759" }, title: "Hành động & phiêu lưu" },
          { key: "crime_series", type: "discover", params: { type: "tv", genres: "80" }, title: "Series tội phạm" },
        ];

        const KIDS_ROW_CONFIGS = [
          { key: "kids_animation", type: "discover", params: { type: "tv", genres: "16" }, title: "Phim hoạt hình dài tập" },
          { key: "kids_family", type: "discover", params: { type: "tv", genres: "10762" }, title: "Series dành cho trẻ em" },
        ];

        const ROW_CONFIGS = isKids ? KIDS_ROW_CONFIGS : SERIES_ROW_CONFIGS;

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

        let recommendationRow = null;
        if (myList && myList.length > 0) {
           const randomMyListMovie = myList[Math.floor(Math.random() * myList.length)];
           try {
             const recommendedMovies = await movieApi.getRecommendations(randomMyListMovie.id);
             const seriesRecs = recommendedMovies.filter(m => m.mediaType === "tv");
             if (seriesRecs && seriesRecs.length > 0) {
                 recommendationRow = {
                     key: `rec-${randomMyListMovie.id}`,
                     title: `Vì bạn đã xem ${randomMyListMovie.title}`,
                     movies: seriesRecs,
                     variant: "standard"
                 };
             }
           } catch (e) {
             console.error("Lỗi khi tải series gợi ý:", e);
           }
        }

        const baseRows = [];
        
        if (recommendationRow) baseRows.push(recommendationRow);

        baseRows.push({
            key: "continue",
            title: `Danh sách Tiếp tục xem của ${activeProfile?.name || "bạn"}`,
            movies: myList, // Tạm dùng MyList làm continue watching
            variant: "continue",
        });

        const top10Row = dynamicRowsData.find(r => r.variant === "top10");
        if (top10Row) {
          baseRows.push(top10Row);
        }

        baseRows.push(...dynamicRowsData.filter(r => r.variant !== "top10").slice(0, 3));

        baseRows.push({
            key: "mylist",
            title: "Danh sách của tôi",
            movies: myList,
            variant: "standard",
        });

        baseRows.push(...dynamicRowsData.filter(r => r.variant !== "top10").slice(3));

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

          if (row.key.startsWith("rec-")) {
            moviesToKeep = moviesToKeep.filter((m) => {
              if (seenIds.has(m.id)) return false;
              seenIds.add(m.id);
              return true;
            });
          }

          return { ...row, movies: moviesToKeep };
        });

        const featured = featuredRes && featuredRes.length > 0 ? featuredRes[Math.floor(Math.random() * featuredRes.length)] : null;

        setFeaturedMovie(featured);
        setFavouriteIds(favIds);
        setRows(kidsFilteredRows);
      } catch (error) {
        console.error("Loi khi tai du lieu Series:", error);
        setErrorMessage(
          "Khong the tai du lieu series tu backend. Vui long kiem tra API movies va thu lai.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadBrowseData();
  }, [isKids, activeProfile?.name]);

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

        const myListRaw = await movieApi.getMyList();
        const myList = myListRaw.filter(m => m.mediaType === "tv" || m.seasons?.length > 0);
        
        setRows((prev) =>
          prev.map((row) =>
            row.key === "mylist"
              ? { ...row, movies: myList }
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
      >
        <SubHeader title="Series" />
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
            Chua co du lieu row series de hien thi. Hay kiem tra backend movies/genres.
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

export default Series;
