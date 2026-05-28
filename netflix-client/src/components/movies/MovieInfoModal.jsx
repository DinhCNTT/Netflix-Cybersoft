import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  Info,
  Play,
  Plus,
  Star,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { movieApi } from "../../api/movieApi";

const MovieInfoModal = ({
  movie,
  isOpen,
  onClose,
  isInMyList = false,
  onToggleMyList,
  onPlay,
}) => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(isOpen);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [ratingData, setRatingData] = useState({
    matchPercent: 95,
    userRating: null,
    likeCount: 0,
    dislikeCount: 0,
  });
  const [seasons, setSeasons] = useState([]);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [reactionLabel, setReactionLabel] = useState("Th\u00edch");
  const [selectedReactionKey, setSelectedReactionKey] = useState(null);
  const closeTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);
  const hideTrayTimerRef = useRef(null);

  const effectiveReactionKey =
    selectedReactionKey ??
    (ratingData.userRating === 1
      ? "like"
      : ratingData.userRating === -1
        ? "dislike"
        : null);

  const handleRateWithKey = async (value, key) => {
    setSelectedReactionKey(key);
    try {
      await movieApi.rateMovie(movie.id, value);
      const updated = await movieApi.getMovieRating(movie.id);
      setRatingData(updated);
    } catch {
      // keep UI stable
    }
  };

  const hasEpisodes = seasons.length > 0;
  const heroImage =
    movie?.backdropUrl || movie?.posterUrl || "/images/hero.jpg";
  const displayGenres = (movie?.genreNames || []).slice(0, 3);

  const castText = useMemo(() => {
    if (displayGenres.length > 0) {
      return `${displayGenres.join(", ")} ensemble`;
    }

    return "Cast đang được cập nhật";
  }, [displayGenres]);

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      document.body.style.overflow = "hidden";
    } else {
      setIsVisible(false);
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (feedbackTimerRef.current) {
        window.clearTimeout(feedbackTimerRef.current);
      }
    };
  }, [isOpen]);

  useEffect(() => {
    if (!movie?.id || !isOpen) {
      return;
    }

    let disposed = false;

    const loadModalData = async () => {
      try {
        const [rating, similar] = await Promise.all([
          movieApi.getMovieRating(movie.id),
          movieApi.getSimilarMovies(movie.id),
        ]);

        if (!disposed) {
          setRatingData(rating);
          setSimilarMovies(similar.filter((item) => item.id !== movie.id));
        }
      } catch {
        if (!disposed) {
          setRatingData((current) => ({ ...current, userRating: null }));
          setSimilarMovies([]);
        }
      }

      try {
        const seasonData = await movieApi.getMovieSeasons(movie.id);
        if (!disposed) {
          setSeasons(seasonData);
          if (seasonData.length > 0) {
            setActiveTab("episodes");
          }
        }
      } catch {
        if (!disposed) {
          setSeasons([]);
          setActiveTab("details");
        }
      }
    };

    setSeasons([]);
    setSimilarMovies([]);
    setActiveTab("details");
    loadModalData();

    return () => {
      disposed = true;
    };
  }, [movie?.id, isOpen]);

  const handleClose = useCallback(() => {
    if (closeTimerRef.current) {
      return;
    }

    setIsVisible(false);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 250);
  }, [onClose]);

  useEffect(() => {
    const onEsc = (event) => {
      if (event.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [handleClose, isOpen]);

  if (!movie || (!isOpen && !isVisible)) {
    return null;
  }

  const showFeedback = (message) => {
    setFeedback(message);

    if (feedbackTimerRef.current) {
      window.clearTimeout(feedbackTimerRef.current);
    }

    feedbackTimerRef.current = window.setTimeout(() => {
      setFeedback("");
      feedbackTimerRef.current = null;
    }, 950);
  };

  const handleToggleMyList = async () => {
    await onToggleMyList?.(movie);
    showFeedback(isInMyList ? "Da xoa khoi My List" : "Da them vao My List");
  };

  const handleRateMovie = async (value) => {
    try {
      await movieApi.rateMovie(movie.id, value);
      const updated = await movieApi.getMovieRating(movie.id);
      setRatingData(updated);
    } catch {
      // Keep UI stable if backend rating fails.
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] motion-fade-in flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-[#181818] text-white shadow-2xl transition-[transform,opacity] duration-[340ms] ease-[cubic-bezier(0.22,0.68,0,1.01)] ${
          isVisible ? "scale-100 opacity-100" : "scale-[0.94] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 hover:bg-black/80"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative h-80 w-full overflow-hidden bg-black">
          {movie.trailerUrl ? (
            <video
              src={movie.trailerUrl}
              className="h-full w-full object-cover"
              autoPlay
              loop
              muted={isMuted}
              playsInline
              preload="metadata"
              poster={heroImage}
            />
          ) : (
            <img
              src={heroImage}
              alt={movie.title}
              className="h-full w-full object-cover"
            />
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#181818] via-[#18181866] to-transparent" />

          <div className="absolute bottom-6 left-8 right-8 flex items-end justify-between">
            <div>
              <h3 className="text-3xl font-extrabold drop-shadow-[0_2px_8px_rgba(0,0,0,0.45)]">
                {movie.title}
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onPlay?.(movie);
                    navigate(`/watch/${movie.id}`);
                  }}
                  className="inline-flex items-center gap-2 rounded bg-white px-6 py-2 font-semibold text-black transition hover:bg-gray-200"
                >
                  <Play className="h-4 w-4 fill-black text-black" />
                  Play
                </button>

                <button
                  type="button"
                  onClick={handleToggleMyList}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-300 transition hover:border-white"
                  aria-label={
                    isInMyList ? "Remove from My List" : "Add to My List"
                  }
                >
                  {isInMyList ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <Plus className="h-5 w-5 text-white" />
                  )}
                </button>

                <div
                  className="relative h-10 w-10"
                  onMouseEnter={() => {
                    if (hideTrayTimerRef.current)
                      clearTimeout(hideTrayTimerRef.current);
                    setShowReactionTray(true);
                  }}
                  onMouseLeave={() => {
                    hideTrayTimerRef.current = setTimeout(
                      () => setShowReactionTray(false),
                      120,
                    );
                  }}
                >
                  {showReactionTray && (
                    <div className="absolute bottom-[calc(100%+10px)] left-1/2 z-20 -translate-x-1/2">
                      <span className="mb-2 inline-flex whitespace-nowrap rounded-md bg-[#e6e6e6] px-3 py-1 text-sm font-semibold text-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.35)]">
                        {reactionLabel}
                      </span>
                    </div>
                  )}

                  <div
                    className={`absolute left-1/2 top-0 h-10 -translate-x-1/2 overflow-visible rounded-full bg-[#1f1f1f] transition-all duration-200 ${
                      showReactionTray ? "w-[132px]" : "w-10"
                    }`}
                  >
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setReactionLabel("Kh\u00f4ng th\u00edch")
                      }
                      onClick={() => handleRateWithKey(-1, "dislike")}
                      className={`absolute left-1/2 top-0 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-[#232323] text-white transition-all duration-200 hover:border-white ${
                        showReactionTray
                          ? "-translate-x-[54px] opacity-100"
                          : "opacity-0"
                      } ${
                        effectiveReactionKey === "dislike"
                          ? "border-white"
                          : "border-[#6a6a6a]"
                      }`}
                      aria-label="Dislike"
                    >
                      <ThumbsDown
                        className={`h-5 w-5 transition-all ${
                          effectiveReactionKey === "dislike" ? "fill-white" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onMouseEnter={() => setReactionLabel("Th\u00edch")}
                      onClick={() => handleRateWithKey(1, "like")}
                      className={`absolute left-1/2 top-0 z-20 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-[#232323] text-white transition-all duration-200 hover:scale-105 hover:border-white ${
                        effectiveReactionKey === "like"
                          ? "border-white"
                          : "border-[#6a6a6a]"
                      }`}
                      aria-label="Like"
                    >
                      <ThumbsUp
                        className={`h-5 w-5 transition-all ${
                          effectiveReactionKey === "like" ? "fill-white" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onMouseEnter={() =>
                        setReactionLabel("R\u1ea5t th\u00edch")
                      }
                      onClick={() => handleRateWithKey(1, "superlike")}
                      className={`absolute left-1/2 top-0 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-[#232323] text-white transition-all duration-200 hover:border-white ${
                        showReactionTray
                          ? "translate-x-[14px] opacity-100"
                          : "opacity-0"
                      } ${
                        effectiveReactionKey === "superlike"
                          ? "border-white"
                          : "border-[#6a6a6a]"
                      }`}
                      aria-label="Super like"
                    >
                      <Star
                        className={`h-5 w-5 transition-all ${
                          effectiveReactionKey === "superlike"
                            ? "fill-white"
                            : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {movie.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setIsMuted((prev) => !prev)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-zinc-300 text-white transition hover:border-white"
                    aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
                  >
                    {isMuted ? (
                      <VolumeX className="h-5 w-5" />
                    ) : (
                      <Volume2 className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <span className="rounded border border-zinc-300 bg-black/35 px-2 py-1 text-sm text-white">
              {movie.maturityLevel || "13+"}
            </span>
          </div>
        </div>

        <div className="space-y-5 p-8">
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <span className="font-semibold text-[#46d369]">
              {ratingData.matchPercent}% Match
            </span>
            <span>{movie.releaseYear || "Mới cập nhật"}</span>
            <span className="border border-gray-500 px-1 text-[10px]">
              {movie.maturityLevel || "13+"}
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <ThumbsUp className="h-3.5 w-3.5" /> {ratingData.likeCount}
            </span>
            <span className="inline-flex items-center gap-1 text-zinc-400">
              <ThumbsDown className="h-3.5 w-3.5" /> {ratingData.dislikeCount}
            </span>
          </div>

          {feedback && (
            <div className="inline-flex rounded bg-[#2f2f2f] px-3 py-1 text-xs font-medium text-white motion-fade-in">
              {feedback}
            </div>
          )}

          <div className="flex gap-2 border-b border-zinc-700 pb-2">
            <button
              type="button"
              onClick={() => setActiveTab("details")}
              className={`rounded px-3 py-1 text-sm font-medium transition ${
                activeTab === "details"
                  ? "bg-zinc-100 text-black"
                  : "text-zinc-300 hover:text-white"
              }`}
            >
              Chi tiết
            </button>

            {hasEpisodes && (
              <button
                type="button"
                onClick={() => setActiveTab("episodes")}
                className={`rounded px-3 py-1 text-sm font-medium transition ${
                  activeTab === "episodes"
                    ? "bg-zinc-100 text-black"
                    : "text-zinc-300 hover:text-white"
                }`}
              >
                Episodes
              </button>
            )}
          </div>

          {activeTab === "details" ? (
            <div className="grid gap-5 md:grid-cols-[1.35fr_1fr]">
              <p className="leading-relaxed text-gray-200">
                {movie.overview || "Nội dung đang được cập nhật."}
              </p>

              <div className="space-y-2 text-sm text-zinc-300">
                <p>
                  <span className="text-zinc-500">Cast:</span> {castText}
                </p>
                <p>
                  <span className="text-zinc-500">Thể loại:</span>{" "}
                  {displayGenres.length
                    ? displayGenres.join(", ")
                    : "Đang cập nhật"}
                </p>
                <p>
                  <span className="text-zinc-500">Năm:</span>{" "}
                  {movie.releaseYear || "N/A"}
                </p>
                <p>
                  <span className="text-zinc-500">Độ tuổi:</span>{" "}
                  {movie.maturityLevel || "13+"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {seasons.map((season) => (
                <div
                  key={season.id}
                  className="rounded-md border border-zinc-700 bg-[#1f1f1f] p-4"
                >
                  <h4 className="mb-3 text-sm font-semibold text-white">
                    Season {season.seasonNumber}: {season.title}
                  </h4>
                  <div className="space-y-2">
                    {season.episodes.map((episode) => (
                      <div
                        key={episode.id}
                        className="flex items-center justify-between rounded bg-[#2a2a2a] px-3 py-2 text-sm"
                      >
                        <span>
                          {episode.episodeNumber}. {episode.title}
                        </span>
                        <span className="text-zinc-400">
                          {episode.durationMinutes}m
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <section>
            <h4 className="mb-3 text-lg font-semibold text-white">
              More Like This
            </h4>
            {similarMovies.length ? (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {similarMovies.slice(0, 6).map((similar) => (
                  <button
                    key={similar.id}
                    type="button"
                    onClick={() => onPlay?.(similar)}
                    className="group overflow-hidden rounded-md border border-zinc-700 bg-[#202020] text-left transition hover:border-zinc-500"
                  >
                    <img
                      src={
                        similar.backdropUrl ||
                        similar.posterUrl ||
                        "/images/hero.jpg"
                      }
                      alt={similar.title}
                      className="aspect-video w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                    />
                    <div className="space-y-1 p-3">
                      <p className="line-clamp-1 text-sm font-semibold text-white">
                        {similar.title}
                      </p>
                      <p className="text-xs text-zinc-300">
                        {similar.releaseYear || "N/A"} •{" "}
                        {similar.maturityLevel || "13+"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded border border-zinc-700 bg-[#202020] px-3 py-2 text-sm text-zinc-300">
                Chưa có phim tương tự.
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={() => onPlay?.(movie)}
            className="inline-flex items-center gap-2 text-sm text-zinc-300 transition hover:text-white"
          >
            <Info className="h-4 w-4" />
            Xem thêm thông tin trong Browse
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovieInfoModal;
