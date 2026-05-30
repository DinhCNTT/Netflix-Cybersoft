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
import { getMappedMaturity } from "../../utils/movieUtils";

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
  const [fullMovie, setFullMovie] = useState(movie);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState(null);
  const [similarMovies, setSimilarMovies] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [reactionLabel, setReactionLabel] = useState("Thích");
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

  const isStandaloneMovie = seasons.length === 1 && seasons[0]?.episodes?.length === 1;
  const hasEpisodes = seasons.length > 0 && !isStandaloneMovie;
  const standaloneDuration = isStandaloneMovie ? seasons[0].episodes[0].durationMinutes : null;
  const heroImage =
    fullMovie?.backdropUrl || fullMovie?.posterUrl || "/images/hero.jpg";
  const displayGenres = (fullMovie?.genreNames || []).slice(0, 3);

  const displayMaturityLevel = useMemo(() => {
    return getMappedMaturity(fullMovie?.maturityLevel);
  }, [fullMovie?.maturityLevel]);

  const castText = useMemo(() => {
    if (fullMovie?.castNames?.length > 0) {
      return fullMovie.castNames.join(", ");
    }
    return "Đang cập nhật";
  }, [fullMovie?.castNames]);

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
    setFullMovie(movie);

    const loadModalData = async () => {
      try {
        const [ratingResult, similarResult, detailResult] = await Promise.allSettled([
          movieApi.getMovieRating(movie.id),
          movieApi.getSimilarMovies(movie.id),
          movieApi.getMovieById(movie.id)
        ]);

        if (!disposed) {
          if (ratingResult.status === "fulfilled") {
            setRatingData(ratingResult.value);
          } else {
            setRatingData((current) => ({ ...current, userRating: null }));
          }

          if (similarResult.status === "fulfilled") {
            setSimilarMovies(similarResult.value.filter((item) => item.id !== movie.id));
          } else {
            setSimilarMovies([]);
          }

          if (detailResult.status === "fulfilled" && detailResult.value) {
            setFullMovie((prev) => ({ ...prev, ...detailResult.value }));
          }
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
            setSelectedSeasonId(seasonData[0].id);
            setActiveTab("episodes");
          }
        }
      } catch {
        if (!disposed) {
          setSeasons([]);
          setSelectedSeasonId(null);
          setActiveTab("details");
        }
      }
    };

    setSeasons([]);
    setSelectedSeasonId(null);
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

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId) || seasons[0];

  return (
    <div
      className="fixed inset-0 z-[70] motion-fade-in flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        className={`relative max-h-[90vh] w-full max-w-[950px] overflow-y-auto rounded-lg bg-[#181818] text-white shadow-2xl transition-[transform,opacity] duration-[340ms] ease-[cubic-bezier(0.22,0.68,0,1.01)] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${
          isVisible ? "scale-100 opacity-100" : "scale-[0.94] opacity-0"
        }`}
      >
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 z-[100] flex h-10 w-10 items-center justify-center rounded-full bg-[#181818] text-white transition hover:bg-[#181818]/80"
          aria-label="Close"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative h-[30rem] w-full overflow-hidden bg-black">
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

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#181818] via-[#181818]/40 to-transparent" />

          <div className="absolute bottom-[5%] left-10 right-10 flex items-end justify-between">
            <div className="w-[60%]">
              <h3 className="text-5xl font-black drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] md:text-[4vw]">
                {movie.title}
              </h3>
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onPlay?.(movie);
                    navigate(`/watch/${movie.id}`);
                  }}
                  className="inline-flex items-center gap-3 rounded-md bg-white px-8 py-2.5 text-[17px] font-bold text-black transition hover:bg-white/80"
                >
                  <Play className="h-6 w-6 fill-black text-black" />
                  Phát
                </button>

                <div className="group relative">
                  <div className="pointer-events-none absolute bottom-[calc(100%+14px)] left-1/2 z-30 -translate-x-1/2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <div className="relative whitespace-nowrap rounded-md bg-[#e6e6e6] px-3 py-[6px] text-[15px] font-bold text-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4)] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[#e6e6e6]">
                      {isInMyList ? "Xóa khỏi Danh sách của tôi" : "Thêm vào Danh sách của tôi"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleMyList}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[1.5px] border-white/60 bg-[#2a2a2a]/60 text-white transition hover:border-white hover:bg-white/20"
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
                </div>

                <div
                  className="relative h-[42px] w-[42px]"
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
                    <div className="absolute bottom-[calc(100%+14px)] left-1/2 z-30 -translate-x-1/2 motion-fade-in">
                      <div className="relative rounded-md bg-[#e6e6e6] px-3 py-[6px] text-[15px] font-bold text-[#1a1a1a] shadow-[0_4px_12px_rgba(0,0,0,0.4)] after:absolute after:left-1/2 after:top-full after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[#e6e6e6] whitespace-nowrap">
                        {reactionLabel}
                      </div>
                    </div>
                  )}

                  <div
                    className={`absolute left-1/2 top-0 h-[42px] -translate-x-1/2 overflow-visible rounded-full transition-all duration-200 ${
                      showReactionTray ? "w-[140px] bg-[#232323] shadow-lg" : "w-[42px] bg-transparent"
                    }`}
                  >
                    <button
                      type="button"
                      onMouseEnter={() =>
                        setReactionLabel("Không thích")
                      }
                      onClick={() => handleRateWithKey(-1, "dislike")}
                      className={`absolute left-1/2 top-1/2 z-10 flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-all duration-200 ${
                        showReactionTray
                          ? "-translate-x-[64px] opacity-100 hover:bg-white/10"
                          : "-translate-x-1/2 opacity-0 pointer-events-none"
                      }`}
                      aria-label="Dislike"
                    >
                      <ThumbsDown
                        className={`h-[22px] w-[22px] transition-all ${
                          effectiveReactionKey === "dislike" ? "fill-white" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onMouseEnter={() => setReactionLabel("Thích")}
                      onClick={() => handleRateWithKey(1, "like")}
                      className={`absolute left-1/2 top-1/2 z-20 flex h-[42px] w-[42px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white transition-all duration-200 ${
                        showReactionTray
                          ? "h-[38px] w-[38px] border-transparent bg-transparent hover:bg-white/10"
                          : "border-[1.5px] border-white/60 bg-[#2a2a2a]/60 hover:border-white hover:bg-white/20"
                      }`}
                      aria-label="Like"
                    >
                      <ThumbsUp
                        className={`h-[22px] w-[22px] transition-all ${
                          effectiveReactionKey === "like" ? "fill-white" : ""
                        }`}
                      />
                    </button>

                    <button
                      type="button"
                      onMouseEnter={() =>
                        setReactionLabel("Rất thích")
                      }
                      onClick={() => handleRateWithKey(1, "superlike")}
                      className={`absolute left-1/2 top-1/2 z-10 flex h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full text-white transition-all duration-200 ${
                        showReactionTray
                          ? "translate-x-[26px] opacity-100 hover:bg-white/10"
                          : "-translate-x-1/2 opacity-0 pointer-events-none"
                      }`}
                      aria-label="Super like"
                    >
                      <Star
                        className={`h-[22px] w-[22px] transition-all ${
                          effectiveReactionKey === "superlike"
                            ? "fill-white"
                            : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

              </div>
            </div>

            <div className="flex items-center gap-3">
                {movie.trailerUrl && (
                  <button
                    type="button"
                    onClick={() => setIsMuted((prev) => !prev)}
                    className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-[1.5px] border-white/60 bg-[#2a2a2a]/60 text-white transition hover:border-white hover:bg-white/20"
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
        </div>

        <div className="px-12 py-8 pb-12">
          <div className="grid gap-14 md:grid-cols-[2fr_1fr]">
            {/* Left Column */}
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3 text-[17px] font-medium text-white">
                <span className="font-semibold text-[#46d369]">
                  {ratingData.matchPercent}% Match
                </span>
                <span>{fullMovie?.releaseYear || "2024"}</span>
                {hasEpisodes && <span>{seasons.length} mùa</span>}
                {isStandaloneMovie && standaloneDuration && <span>{Math.floor(standaloneDuration / 60)}g {standaloneDuration % 60}p</span>}
                <span className="flex h-5 items-center rounded-[3px] border border-white/40 px-1.5 text-xs font-bold text-white/90">
                  HD
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="flex h-[24px] items-center border border-white/40 px-2 text-[15px] font-medium text-white/90">
                  {displayMaturityLevel}
                </span>
              </div>

              <p className="mt-5 text-[17px] leading-relaxed text-white">
                {fullMovie?.overview || "Nội dung đang được cập nhật."}
              </p>
            </div>

            {/* Right Column */}
            <div className="space-y-4 text-[15px] leading-snug">
              <div>
                <span className="text-[#777]">Diễn viên: </span>
                <span className="cursor-pointer text-white hover:underline">{castText}</span>
              </div>
              <div>
                <span className="text-[#777]">Thể loại: </span>
                <span className="cursor-pointer text-white hover:underline">
                  {displayGenres.length ? displayGenres.join(", ") : "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>

          {feedback && (
            <div className="mt-4 inline-flex rounded bg-[#2f2f2f] px-3 py-1 text-xs font-medium text-white motion-fade-in">
              {feedback}
            </div>
          )}

          {hasEpisodes && (
             <div className="mt-12">
               <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-[24px] font-bold text-white">Tập</h4>
                  <div className="relative">
                    <select 
                      className="appearance-none bg-[#242424] text-white text-[17px] font-medium border border-white/20 rounded px-4 py-2 pr-10 focus:outline-none focus:ring-1 focus:ring-white transition hover:bg-[#2a2a2a] cursor-pointer"
                      value={selectedSeasonId || ""}
                      onChange={(e) => setSelectedSeasonId(Number(e.target.value))}
                    >
                      {seasons.map(s => (
                         <option key={s.id} value={s.id}>Mùa {s.seasonNumber}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
               </div>

               {selectedSeason && (
                  <div className="mb-4 text-[15px] font-medium text-white/90">
                    Mùa {selectedSeason.seasonNumber}: 
                    <span className="border border-white/40 px-1.5 text-sm ml-2">{displayMaturityLevel}</span> 
                  </div>
               )}

               <div className="flex flex-col border-t border-[#404040]">
                 {(selectedSeason?.episodes || []).map((episode) => (
                   <div 
                     key={episode.id} 
                     className="group flex items-center gap-4 border-b border-[#404040] p-6 cursor-pointer hover:bg-[#333] transition-colors rounded-b-sm"
                     onClick={() => {
                        onPlay?.(movie);
                        navigate(`/watch/${movie.id}?episode=${episode.id}`);
                     }}
                   >
                     <div className="text-2xl text-[#d2d2d2] w-8 text-center font-medium">
                        {episode.episodeNumber}
                     </div>
                     <div className="relative w-[130px] h-[73px] shrink-0 overflow-hidden rounded bg-[#1f1f1f]">
                        <img 
                           src={heroImage} 
                           alt={episode.title}
                           className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                        />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                            <Play className="w-8 h-8 fill-white text-white drop-shadow-md" />
                        </div>
                     </div>
                     <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between items-start">
                           <span className="font-bold text-white text-[16px]">{episode.title}</span>
                           <span className="text-[#d2d2d2] text-[15px]">{episode.durationMinutes}ph</span>
                        </div>
                     </div>
                   </div>
                 ))}
               </div>
             </div>
          )}

          <section className="mt-12">
            <h4 className="mb-6 text-[24px] font-bold text-white">
              Nội dung tương tự
            </h4>
            {similarMovies.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {similarMovies.slice(0, 6).map((similar) => {
                  const simIsMovie = similar.seasons?.length === 1 && similar.seasons[0]?.episodes?.length === 1;
                  const simDuration = simIsMovie ? similar.seasons[0].episodes[0].durationMinutes : null;
                  const durationBadge = simIsMovie && simDuration 
                    ? `${Math.floor(simDuration / 60)}g ${simDuration % 60}ph`
                    : (similar.seasons?.length > 1 ? `${similar.seasons.length} mùa` : (similar.seasons?.[0]?.episodes?.length > 1 ? `${similar.seasons[0].episodes.length} tập` : ""));

                  return (
                    <div
                      key={similar.id}
                      className="group flex flex-col overflow-hidden rounded-md bg-[#2f2f2f]"
                    >
                      <div 
                        className="relative aspect-video w-full cursor-pointer overflow-hidden"
                        onClick={() => {
                          onPlay?.(similar);
                          navigate(`/watch/${similar.id}`);
                        }}
                      >
                        <img
                          src={
                            similar.backdropUrl ||
                            similar.posterUrl ||
                            "/images/hero.jpg"
                          }
                          alt={similar.title}
                          className="h-full w-full object-cover"
                        />
                        {durationBadge && (
                          <div className="absolute right-2 top-2 font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                            {durationBadge}
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity group-hover:opacity-100">
                           <Play className="h-12 w-12 fill-white text-white drop-shadow-lg" />
                        </div>
                      </div>
                      
                      <div className="flex flex-1 flex-col p-4">
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium text-white/90">
                            <span className="flex h-[22px] items-center border border-white/40 px-1.5 text-sm">
                              {getMappedMaturity(similar.maturityLevel)}
                            </span>
                            <span className="flex h-[18px] items-center rounded-[3px] border border-white/40 px-1 text-[10px] font-bold">
                              HD
                            </span>
                            <span>{similar.releaseYear || "2024"}</span>
                          </div>
                          
                          <button
                            type="button"
                            className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-full border-[1.5px] border-white/60 bg-transparent text-white transition hover:border-white hover:bg-white/10"
                            onClick={(e) => {
                               e.stopPropagation();
                            }}
                            aria-label="Add to My List"
                          >
                            <Plus className="h-5 w-5" />
                          </button>
                        </div>
                        <p className="line-clamp-4 text-[14px] leading-snug text-[#d2d2d2]">
                          {similar.overview || similar.description || "Nội dung phim đang được cập nhật."}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded border border-white/20 bg-transparent px-4 py-3 text-[15px] font-medium text-white/90">
                Chưa có phim tương tự.
              </div>
            )}
          </section>

          <div className="mt-8 flex items-center gap-2 text-[15px] font-medium text-white/90">
            <Info className="h-6 w-6" />
            <span>Xem thêm thông tin trong Browse</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieInfoModal;
