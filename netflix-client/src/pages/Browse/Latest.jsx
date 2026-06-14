import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import useProfileStore from "../../store/profileStore";
import Navbar from "../../components/layouts/Navbar";
import MovieRow from "../../components/movies/MovieRow";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const Latest = () => {
  const activeProfile = useProfileStore((state) => state.activeProfile);

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
    const loadLatestData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const favIds = await movieApi.getFavouriteIds();

        const today = new Date();
        const formatDate = (d) => d.toISOString().split('T')[0];
        const todayStr = formatDate(today);

        const currentDay = today.getDay();
        const diffToMonday = currentDay === 0 ? -6 : 1 - currentDay;
        const thisMonday = new Date(today);
        thisMonday.setDate(today.getDate() + diffToMonday);
        const thisSunday = new Date(thisMonday);
        thisSunday.setDate(thisMonday.getDate() + 6);

        const nextMonday = new Date(thisMonday);
        nextMonday.setDate(thisMonday.getDate() + 7);
        const nextSunday = new Date(thisSunday);
        nextSunday.setDate(thisSunday.getDate() + 7);

        const ROW_CONFIGS = [
          { 
            key: "new_on_netflix", 
            params: { sort_by: "primary_release_date.desc", "primary_release_date.lte": todayStr, "vote_count.gte": 10 }, 
            title: "Mới trên Netflix" 
          },
          { 
            key: "top10_series", 
            params: { type: "tv", sort_by: "popularity.desc" }, 
            title: "Top 10 series tại Việt Nam hôm nay", 
            variant: "top10" 
          },
          { 
            key: "coming_next_week", 
            params: { "primary_release_date.gte": formatDate(nextMonday), "primary_release_date.lte": formatDate(nextSunday), sort_by: "popularity.desc" }, 
            title: "Ra mắt tuần tới" 
          },
          { 
            key: "anticipated", 
            params: { "primary_release_date.gte": todayStr, sort_by: "popularity.desc" }, 
            title: "Đáng chờ đợi" 
          },
          { 
            key: "top10_movies", 
            params: { type: "movie", sort_by: "popularity.desc" }, 
            title: "Top 10 phim tại Việt Nam hôm nay", 
            variant: "top10" 
          },
          { 
            key: "coming_this_week", 
            params: { "primary_release_date.gte": formatDate(thisMonday), "primary_release_date.lte": formatDate(thisSunday), sort_by: "popularity.desc" }, 
            title: "Ra mắt tuần này" 
          },
        ];

        const dynamicRowsData = await Promise.all(
          ROW_CONFIGS.map(async (config) => {
            const movies = await movieApi.discoverContent(config.params);
            // Filter out exact duplicates within the same row, just in case TMDB returns dupes
            const uniqueMovies = Array.from(new Map(movies.map(item => [item.id, item])).values());
            return {
              key: config.key,
              title: config.title,
              movies: uniqueMovies,
              variant: config.variant || "standard"
            };
          })
        );

        const kidsFilteredRows = dynamicRowsData.map((row) => {
          let moviesToKeep = row.movies || [];

          if (isKids) {
            moviesToKeep = moviesToKeep.filter((movie) =>
              ["G", "PG", "TV-G", "TV-PG"].includes(
                (movie.maturityLevel || "").toUpperCase(),
              ),
            );
          }

          return { ...row, movies: moviesToKeep };
        });

        setFavouriteIds(favIds);
        setRows(kidsFilteredRows);
      } catch (error) {
        console.error("Loi khi tai du lieu Latest:", error);
        setErrorMessage("Không thể tải danh sách Mới & Phổ biến. Vui lòng kiểm tra lại kết nối.");
      } finally {
        setIsLoading(false);
      }
    };

    loadLatestData();
  }, [isKids]);

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
          showMyListToast("Đã xóa khỏi My List");
        } else {
          updatedIds = await movieApi.addFavourite(movie.id);
          showMyListToast("Đã thêm vào My List");
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

  return (
    <div className="min-h-screen bg-[#141414] pb-28">
      {/* Background đen đặc vì không có HeroBanner */}
      <div className="bg-[#141414] fixed inset-0 -z-10" />
      
      <Navbar />

      {/* Chừa khoảng trống phía trên cho navbar */}
      <div className="relative z-20 pt-[100px] md:pt-[130px]">
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
            row.movies.length > 0 && (
              <div
                key={row.key}
                className="motion-fade-in mt-6 md:mt-10"
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
            )
          ))
        ) : (
          <div className="mx-4 rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200 md:mx-12">
            Chưa có dữ liệu nào mới trong khoảng thời gian này.
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
        onRate={handleRateFromHover}
        onPortalEnter={handlePortalEnter}
        onPortalLeave={scheduleHoverClose}
      />
    </div>
  );
};

export default Latest;
