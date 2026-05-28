import { useRef } from "react";

const resolveImageUrl = (movie, isLarge) => {
  if (isLarge) {
    return movie?.posterUrl || movie?.backdropUrl || "";
  }

  return movie?.backdropUrl || movie?.posterUrl || "";
};

const MovieCard = ({
  movie,
  isLarge = false,
  variant = "standard",
  index = 0,
  totalCount = 1,
  onHoverStart,
  onHoverEnd,
  isInMyList = false,
  isFeedbackActive = false,
  onToggleMyList,
  onMoreInfo,
}) => {
  const stillnessTimerRef = useRef(null);
  const pendingDataRef = useRef(null);

  const clearStillness = () => {
    if (stillnessTimerRef.current) {
      clearTimeout(stillnessTimerRef.current);
      stillnessTimerRef.current = null;
    }
  };

  const scheduleOpen = (data) => {
    clearStillness();
    pendingDataRef.current = data;
    stillnessTimerRef.current = setTimeout(() => {
      if (pendingDataRef.current) {
        onHoverStart?.(pendingDataRef.current);
      }
      stillnessTimerRef.current = null;
    }, 500);
  };
  const imageUrl = resolveImageUrl(movie, isLarge);

  if (!movie || !imageUrl) {
    return null;
  }

  const hoverAlign =
    index === 0 ? "left" : index >= totalCount - 1 ? "right" : "center";
  const isTop10 = variant === "top10";
  const isContinue = variant === "continue";
  const progressPercent = ((movie.id * 37) % 65) + 20;

  const widthClass = isTop10
    ? "w-[36%] sm:w-[25%] md:w-[19%] lg:w-[16.6667%]"
    : "w-[50%] sm:w-[33.3333%] md:w-[25%] lg:w-[16.6667%]";

  const aspectClass = isTop10 || isLarge ? "aspect-[2/3]" : "aspect-video";

  return (
    <article
      onClick={() => onMoreInfo?.(movie)}
      onPointerEnter={(event) => {
        if (window.matchMedia("(hover: hover)").matches === false) return;
        scheduleOpen({
          movie,
          anchorElement: event.currentTarget,
          align: hoverAlign,
          isLarge,
          rowVariant: variant,
        });
      }}
      onPointerMove={(event) => {
        if (window.matchMedia("(hover: hover)").matches === false) return;
        scheduleOpen({
          movie,
          anchorElement: event.currentTarget,
          align: hoverAlign,
          isLarge,
          rowVariant: variant,
        });
      }}
      onPointerLeave={() => {
        clearStillness();
        pendingDataRef.current = null;
        onHoverEnd?.();
      }}
      className={`group relative flex-shrink-0 cursor-pointer ${widthClass} ${
        isFeedbackActive ? "motion-scale-in-[1.02]" : ""
      }`}
    >
      {isTop10 && (
        <span
          className="pointer-events-none absolute bottom-0 left-[5%] z-0 select-none text-[16vw] font-black leading-[0.82] text-transparent md:text-[11vw]"
          style={{ WebkitTextStroke: "2px #4f4f4f" }}
        >
          {index + 1}
        </span>
      )}

      <img
        className={`relative z-10 w-full rounded-[0.2vw] object-cover transition duration-300 ease-out group-hover:brightness-110 ${aspectClass} ${
          isTop10 ? "ml-[22%] w-[78%]" : ""
        }`}
        src={imageUrl}
        alt={movie.title}
        loading="lazy"
        onError={(event) => {
          const fallback =
            movie?.posterUrl || movie?.backdropUrl || "/images/hero.jpg";
          if (event.currentTarget.src.endsWith("/images/hero.jpg")) {
            return;
          }
          event.currentTarget.src = fallback;
        }}
      />

      {isContinue && (
        <div className="relative z-10 mt-2 h-[3px] w-[78%] bg-[#4d4d4d]">
          <span
            className="absolute left-0 top-0 h-full bg-[#e50914]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </article>
  );
};

export default MovieCard;
