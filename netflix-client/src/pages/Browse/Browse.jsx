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
          genres,
          favIds,
        ] = await Promise.all([
          movieApi.getFeaturedMovie(),
          movieApi.getTrendingMovies(),
          movieApi.getNetflixOriginals(),
          movieApi.getNewReleases(),
          movieApi.getMyList(),
          movieApi.getGenres(),
          movieApi.getFavouriteIds(),
        ]);

        const genreRows = await Promise.all(
          genres.slice(0, 4).map(async (genre) => {
            const movies = await movieApi.getMoviesByGenre(genre.id);
            return {
              key: `genre-${genre.id}`,
              title: genre.name,
              movies,
            };
          }),
        );

        const primaryGenreRow = genreRows[0];
        const continueWatchingMovies = (
          myList.length ? myList : originals
        ).slice(0, 2);
        const top10Movies = (newReleases.length ? newReleases : trending).slice(
          0,
          10,
        );

        const baseRows = [
          {
            key: "asia",
            title: "Phim va series chau A",
            movies: (primaryGenreRow?.movies || trending).slice(0, 12),
            variant: "standard",
          },
          {
            key: "continue",
            title: `Danh sach Tiep tuc xem cua ${activeProfile?.name || "ban"}`,
            movies: continueWatchingMovies,
            variant: "continue",
          },
          {
            key: "top10",
            title: "Top 10 series tai Viet Nam hom nay",
            movies: top10Movies,
            variant: "top10",
          },
          {
            key: "mylist",
            title: "Danh sach cua toi",
            movies: myList,
            variant: "standard",
          },
        ];

        const kidsFilteredRows = isKids
          ? [...baseRows, ...genreRows.slice(1)].map((row) => ({
              ...row,
              movies: row.movies.filter((movie) =>
                ["G", "PG", "TV-G", "TV-PG"].includes(
                  (movie.maturityLevel || "").toUpperCase(),
                ),
              ),
            }))
          : [...baseRows, ...genreRows.slice(1)];

        const candidateMovies = [
          featured,
          ...trending,
          ...originals,
          ...newReleases,
          ...myList,
          ...genreRows.flatMap((row) => row.movies || []),
        ].filter(Boolean);

        const firstMovieWithTrailer = candidateMovies.find((movie) =>
          Boolean(movie?.trailerUrl),
        );

        setFeaturedMovie(
          firstMovieWithTrailer ||
            featured ||
            trending[0] ||
            originals[0] ||
            null,
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
