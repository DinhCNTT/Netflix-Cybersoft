import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import Navbar from "../../components/layouts/Navbar";
import MovieRow from "../../components/movies/MovieRow";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const MyList = () => {
  const [myListMovies, setMyListMovies] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [hoverData, setHoverData] = useState(null);
  const [myListToast, setMyListToast] = useState("");
  const [feedbackMovieId, setFeedbackMovieId] = useState(null);

  const hoverOpenTimerRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

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
    const loadMyList = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [myList, ids] = await Promise.all([
          movieApi.getMyList(),
          movieApi.getFavouriteIds(),
        ]);

        setMyListMovies(myList);
        setFavouriteIds(ids);
      } catch (error) {
        console.error("Loi khi tai My List:", error);
        setErrorMessage("Khong the tai Danh sach cua toi. Vui long thu lai.");
      } finally {
        setIsLoading(false);
      }
    };

    loadMyList();
  }, []);

  useEffect(() => {
    return () => {
      clearHoverTimers();
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, [clearHoverTimers]);

  const handleCardHoverStart = useCallback(
    ({ movie, anchorElement, align, isLarge }) => {
      if (hoverCloseTimerRef.current) {
        clearTimeout(hoverCloseTimerRef.current);
        hoverCloseTimerRef.current = null;
      }

      setHoverData({
        movie,
        anchorElement,
        align,
        isLarge,
        anchorRect: anchorElement.getBoundingClientRect(),
      });
    },
    [],
  );

  const scheduleHoverClose = useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
    }

    hoverCloseTimerRef.current = setTimeout(() => {
      setHoverData(null);
      hoverCloseTimerRef.current = null;
    }, 120);
  }, []);

  const handlePortalEnter = useCallback(() => {
    if (hoverCloseTimerRef.current) {
      clearTimeout(hoverCloseTimerRef.current);
      hoverCloseTimerRef.current = null;
    }
  }, []);

  const handleOpenMovieInfo = useCallback((movie) => {
    setHoverData(null);
    setSelectedMovie(movie);
    setIsModalOpen(true);
  }, []);

  const handleCloseMovieInfo = useCallback(() => {
    setIsModalOpen(false);
    setSelectedMovie(null);
  }, []);

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

        const myList = await movieApi.getMyList();
        setMyListMovies(myList);
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
    <div className="min-h-screen bg-[#141414] pb-24 text-white">
      <Navbar />

      <main className="pt-[96px]">
        {myListToast && (
          <div className="pointer-events-none fixed right-4 top-24 z-[95] rounded bg-[#1f1f1f] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.38)] motion-fade-in">
            {myListToast}
          </div>
        )}

        <div className="px-4 md:px-12">
          <h1 className="mb-3 text-4xl font-semibold tracking-tight">
            Danh sách của tôi
          </h1>
        </div>

        {errorMessage && (
          <div className="mx-4 mb-4 flex items-center gap-2 rounded-md border border-red-500/60 bg-red-950/70 p-4 text-sm text-red-200 md:mx-12">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="px-4 md:px-12">
            <div className="h-8 w-72 animate-pulse rounded bg-[#2a2a2a]" />
            <div className="mt-4 flex gap-3 overflow-hidden">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="h-36 w-56 flex-shrink-0 animate-pulse rounded bg-[#2a2a2a] md:h-44 md:w-72"
                />
              ))}
            </div>
          </div>
        ) : myListMovies.length > 0 ? (
          <MovieRow
            title="Danh sách của tôi"
            movies={myListMovies}
            variant="standard"
            onPlay={handleOpenMovieInfo}
            onMoreInfo={handleOpenMovieInfo}
            favouriteIds={favouriteIds}
            onToggleFavourite={handleToggleFavourite}
            feedbackMovieId={feedbackMovieId}
            onHoverStart={handleCardHoverStart}
            onHoverEnd={scheduleHoverClose}
          />
        ) : (
          <div className="mx-4 rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200 md:mx-12">
            Danh sách của bạn đang trống. Hãy thêm phim bằng nút + để hiển thị ở
            đây.
          </div>
        )}
      </main>

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
        onRemoveFromRow={handleToggleFavourite}
        onRate={handleRateFromHover}
        onPortalEnter={handlePortalEnter}
        onPortalLeave={scheduleHoverClose}
      />
    </div>
  );
};

export default MyList;
