import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  ChevronDown,
  Play,
  Plus,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const resolveImageUrl = (movie, isLarge) => {
  if (isLarge) {
    return movie?.posterUrl || movie?.backdropUrl || "";
  }

  return movie?.backdropUrl || movie?.posterUrl || "";
};

const MovieHoverPortal = ({
  hoverData,
  isFavourite,
  onPlay,
  onMoreInfo,
  onToggleFavourite,
  onRemoveFromRow,
  onRate,
  onPortalEnter,
  onPortalLeave,
}) => {
  const [showReactionTray, setShowReactionTray] = useState(false);
  const [reactionLabel, setReactionLabel] = useState("Thích");
  const [selectedReaction, setSelectedReaction] = useState({
    movieId: null,
    value: null,
  });
  const hideTrayTimerRef = useRef(null);

  const isSelected = (movieId, key) =>
    selectedReaction.movieId === movieId && selectedReaction.value === key;

  const handleRate = (movie, numericValue, key) => {
    setSelectedReaction({ movieId: movie.id, value: key });
    onRate?.(movie, numericValue);
  };

  if (!hoverData?.movie || !hoverData?.anchorRect) {
    return null;
  }

  const { movie, anchorRect, align, isLarge } = hoverData;
  const imageUrl = resolveImageUrl(movie, isLarge);

  if (!imageUrl) {
    return null;
  }

  const scale = 1.34;
  const width = anchorRect.width * scale;
  const height = anchorRect.height * scale;
  const top = clamp(
    anchorRect.top - anchorRect.height * 0.66,
    82,
    window.innerHeight - height - 24,
  );

  let left = anchorRect.left - (width - anchorRect.width) * 0.24;
  if (align === "left") {
    left = anchorRect.left;
  }
  if (align === "right") {
    left = anchorRect.right - width;
  }

  left = clamp(left, 16, window.innerWidth - width - 16);

  const zoomClass =
    align === "left"
      ? "motion-zoom-in-left"
      : align === "right"
        ? "motion-zoom-in-right"
        : "motion-zoom-in";

  return createPortal(
    <div
      className="fixed z-[85] hidden sm:block"
      style={{ top, left, width }}
      onMouseEnter={onPortalEnter}
      onMouseLeave={onPortalLeave}
    >
      <div
        className={`overflow-hidden rounded-md bg-[#181818] shadow-[0_10px_34px_rgba(0,0,0,0.65)] ${zoomClass}`}
      >
        <div className="relative">
          <img
            className="aspect-video w-full object-cover"
            src={imageUrl}
            alt={movie.title}
            loading="lazy"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 to-transparent" />
        </div>

        <div className="space-y-2 p-3 lg:p-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPlay?.(movie)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white transition hover:bg-gray-200"
              aria-label={`Play ${movie.title}`}
            >
              <Play className="ml-0.5 h-5 w-5 fill-black text-black" />
            </button>

            <button
              type="button"
              onClick={() => onToggleFavourite?.(movie)}
              className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-[#232323] transition hover:border-white"
              aria-label={isFavourite ? "Remove from list" : "Add to list"}
            >
              {isFavourite ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Plus className="h-5 w-5 text-white" />
              )}
            </button>

            {onRemoveFromRow && (
              <button
                type="button"
                onClick={() => onRemoveFromRow(movie)}
                title="X\u00f3a kh\u1ecfi h\u00e0ng"
                className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 bg-[#232323] text-white transition hover:border-white"
                aria-label="X\u00f3a kh\u1ecfi h\u00e0ng"
              >
                <X className="h-5 w-5" />
              </button>
            )}

            <div
              className="relative h-10 w-10"
              onMouseEnter={() => {
                if (hideTrayTimerRef.current) {
                  clearTimeout(hideTrayTimerRef.current);
                  hideTrayTimerRef.current = null;
                }
                setShowReactionTray(true);
              }}
              onMouseLeave={() => {
                hideTrayTimerRef.current = setTimeout(() => {
                  setShowReactionTray(false);
                }, 120);
              }}
            >
              {showReactionTray && (
                <div className="absolute bottom-[calc(100%+12px)] left-1/2 z-20 -translate-x-1/2">
                  <span className="mb-2 inline-flex whitespace-nowrap rounded-md bg-[#e6e6e6] px-4 py-1 text-[40px] leading-none font-semibold text-[#1a1a1a] shadow-[0_8px_16px_rgba(0,0,0,0.35)] md:text-[38px]">
                    {reactionLabel}
                  </span>
                </div>
              )}

              <div
                className={`absolute left-1/2 top-0 h-10 -translate-x-1/2 overflow-visible rounded-full bg-[#1f1f1f] transition-all duration-200 ${showReactionTray ? "w-[132px]" : "w-10"}`}
              >
                <button
                  type="button"
                  onMouseEnter={() => setReactionLabel("Không thích")}
                  onClick={() => handleRate(movie, -1, "dislike")}
                  className={`absolute top-0 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-[#232323] text-white transition-all duration-200 hover:border-white
                    ${showReactionTray ? "-translate-x-[54px] opacity-100" : "opacity-0"}
                    ${isSelected(movie.id, "dislike") ? "border-white" : "border-[#6a6a6a]"}`}
                  aria-label="Dislike"
                >
                  <ThumbsDown
                    className={`h-5 w-5 transition-all ${isSelected(movie.id, "dislike") ? "fill-white" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onMouseEnter={() => setReactionLabel("Thích")}
                  onClick={() => handleRate(movie, 1, "like")}
                  className={`absolute top-0 left-1/2 z-20 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-[#232323] text-white transition-all duration-200 hover:scale-105 hover:border-white
                    ${isSelected(movie.id, "like") ? "border-white" : "border-[#6a6a6a]"}`}
                  aria-label="Like"
                >
                  <ThumbsUp
                    className={`h-5 w-5 transition-all ${isSelected(movie.id, "like") ? "fill-white" : ""}`}
                  />
                </button>

                <button
                  type="button"
                  onMouseEnter={() => setReactionLabel("Rất thích")}
                  onClick={() => handleRate(movie, 2, "superlike")}
                  className={`absolute top-0 left-1/2 z-10 flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border-2 bg-[#232323] text-white transition-all duration-200 hover:border-white
                    ${showReactionTray ? "translate-x-[14px] opacity-100" : "opacity-0"}
                    ${isSelected(movie.id, "superlike") ? "border-white" : "border-[#6a6a6a]"}`}
                  aria-label="Super like"
                >
                  <Star
                    className={`h-5 w-5 transition-all ${isSelected(movie.id, "superlike") ? "fill-white" : ""}`}
                  />
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onMoreInfo?.(movie)}
              className="ml-auto flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-300 transition hover:border-white"
              aria-label={`More info ${movie.title}`}
            >
              <ChevronDown className="h-5 w-5 text-white" />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-300">
            <span className="font-semibold text-[#46d369]">98% Match</span>
            <span>{movie.releaseYear || "Mới nhất"}</span>
            <span className="rounded border border-zinc-500 px-1 py-[1px] text-[10px] text-zinc-200">
              {movie.maturityLevel || "13+"}
            </span>
          </div>

          <h3 className="truncate text-sm font-semibold text-[#ececec] md:text-base">
            {movie.title}
          </h3>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default MovieHoverPortal;
