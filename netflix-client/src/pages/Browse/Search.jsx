import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import Navbar from "../../components/layouts/Navbar";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverData, setHoverData] = useState(null);
  const [myListToast, setMyListToast] = useState("");
  const [feedbackMovieId, setFeedbackMovieId] = useState(null);

  const hoverOpenTimerRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const clearHoverTimers = useCallback(() => {
    if (hoverOpenTimerRef.current) clearTimeout(hoverOpenTimerRef.current);
    if (hoverCloseTimerRef.current) clearTimeout(hoverCloseTimerRef.current);
  }, []);

  const showMyListToast = useCallback((message) => {
    setMyListToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setMyListToast(""), 900);
  }, []);

  const triggerMovieFeedback = useCallback((movieId) => {
    setFeedbackMovieId(movieId);
    setTimeout(
      () => setFeedbackMovieId((c) => (c === movieId ? null : c)),
      420,
    );
  }, []);

  // Load favourite ids once
  useEffect(() => {
    movieApi
      .getFavouriteIds()
      .then(setFavouriteIds)
      .catch(() => {});
  }, []);

  // Search whenever query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setIsLoading(true);
    movieApi
      .searchMovies(query)
      .then((data) => {
        if (!cancelled) {
          setResults(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const handleHoverStart = useCallback(
    (data) => {
      clearHoverTimers();
      hoverOpenTimerRef.current = setTimeout(() => setHoverData(data), 200);
    },
    [clearHoverTimers],
  );

  const handleHoverEnd = useCallback(() => {
    clearHoverTimers();
    hoverCloseTimerRef.current = setTimeout(() => setHoverData(null), 300);
  }, [clearHoverTimers]);

  const handleToggleMyList = useCallback(
    async (movie) => {
      const isInList = favouriteIds.includes(movie.id);
      try {
        if (isInList) {
          await movieApi.removeFavourite(movie.id);
          setFavouriteIds((prev) => prev.filter((id) => id !== movie.id));
          showMyListToast("Đã xóa khỏi Danh sách của tôi");
        } else {
          await movieApi.addFavourite(movie.id);
          setFavouriteIds((prev) => [...prev, movie.id]);
          showMyListToast("Đã thêm vào Danh sách của tôi");
        }
        triggerMovieFeedback(movie.id);
      } catch {
        showMyListToast("Có lỗi xảy ra");
      }
    },
    [favouriteIds, showMyListToast, triggerMovieFeedback],
  );

  const handleMoreInfo = useCallback((movie) => {
    setSelectedMovie(movie);
    setIsModalOpen(true);
    setHoverData(null);
  }, []);

  return (
    <div className="min-h-screen bg-[#141414] text-white">
      <Navbar />

      <div className="px-4 pt-28 pb-16 md:px-[4%] 2xl:px-[60px]">
        {/* Heading */}
        {query ? (
          <h2 className="mb-6 text-xl font-semibold text-[#e5e5e5]">
            Kết quả tìm kiếm cho: <span className="text-white">"{query}"</span>
          </h2>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="mb-4 h-16 w-16 text-[#555]" />
            <p className="text-xl text-[#999]">
              Nhập từ khóa để tìm kiếm phim hoặc series
            </p>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-md bg-[#2a2a2a]"
              />
            ))}
          </div>
        )}

        {/* No results */}
        {!isLoading && query && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <SearchIcon className="mb-4 h-14 w-14 text-[#555]" />
            <p className="text-lg text-[#999]">
              Không tìm thấy kết quả cho "{query}"
            </p>
            <p className="mt-2 text-sm text-[#666]">
              Thử từ khóa khác hoặc kiểm tra chính tả
            </p>
          </div>
        )}

        {/* Results grid */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((movie, index) => {
              const imageUrl = movie.backdropUrl || movie.posterUrl;
              if (!imageUrl) return null;
              return (
                <div
                  key={movie.id}
                  className="group relative cursor-pointer overflow-hidden rounded-md"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const align =
                      index % 6 === 0
                        ? "left"
                        : index % 6 === 5
                          ? "right"
                          : "center";
                    handleHoverStart({ movie, rect, hoverAlign: align });
                  }}
                  onMouseLeave={handleHoverEnd}
                  onClick={() => handleMoreInfo(movie)}
                >
                  <img
                    src={imageUrl}
                    alt={movie.title}
                    className="aspect-video w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <p className="line-clamp-1 text-xs font-semibold text-white">
                      {movie.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Hover portal */}
      {hoverData && (
        <MovieHoverPortal
          movie={hoverData.movie}
          triggerRect={hoverData.rect}
          hoverAlign={hoverData.hoverAlign}
          isInMyList={favouriteIds.includes(hoverData.movie?.id)}
          isFeedbackActive={feedbackMovieId === hoverData.movie?.id}
          onToggleMyList={handleToggleMyList}
          onMoreInfo={handleMoreInfo}
          onMouseEnter={() => clearHoverTimers()}
          onMouseLeave={handleHoverEnd}
        />
      )}

      {/* Movie info modal */}
      {isModalOpen && selectedMovie && (
        <MovieInfoModal
          movie={selectedMovie}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMovie(null);
          }}
          isInMyList={favouriteIds.includes(selectedMovie?.id)}
          onToggleMyList={handleToggleMyList}
        />
      )}

      {/* Toast */}
      {myListToast && (
        <div className="fixed bottom-8 left-1/2 z-[9999] -translate-x-1/2 rounded bg-white px-5 py-3 text-sm font-semibold text-black shadow-lg">
          {myListToast}
        </div>
      )}
    </div>
  );
};

export default Search;
