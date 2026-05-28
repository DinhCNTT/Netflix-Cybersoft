import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import MovieCard from "./MovieCard";

const MovieRow = ({
  title,
  movies = [],
  isLarge = false,
  variant = "standard",
  onPlay,
  onMoreInfo,
  favouriteIds = [],
  onToggleFavourite,
  feedbackMovieId,
  onHoverStart,
  onHoverEnd,
}) => {
  const sliderRef = useRef(null);

  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollLeft = 0;
    }
  }, [title, movies.length, variant]);

  const scrollRow = (direction) => {
    if (!sliderRef.current) return;

    const viewport = sliderRef.current.clientWidth;
    const amount = Math.max(
      320,
      Math.floor(viewport * (isLarge ? 0.65 : 0.75)),
    );
    sliderRef.current.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!movies.length) {
    return null;
  }

  return (
    <section className="group relative mt-[0.7vw] text-white">
      <h2 className="mb-[0.5vw] px-4 text-[3.2vw] font-medium tracking-[0.01em] text-[#e5e5e5] sm:text-lg md:px-12 md:text-[1.35vw]">
        {title}
      </h2>

      <div className="pointer-events-none absolute left-0 top-0 z-20 hidden h-full w-12 bg-gradient-to-r from-[#141414] to-transparent opacity-0 transition duration-300 group-hover:opacity-100 md:block" />
      <div className="pointer-events-none absolute right-0 top-0 z-20 hidden h-full w-12 bg-gradient-to-l from-[#141414] to-transparent opacity-0 transition duration-300 group-hover:opacity-100 md:block" />

      <button
        type="button"
        onClick={() => scrollRow("left")}
        className="absolute left-0 top-[56.5%] z-30 hidden h-[56%] -translate-y-1/2 items-center bg-[hsla(0,0%,8%,0.5)] px-2 text-white opacity-0 transition duration-300 hover:bg-[hsla(0,0%,8%,0.7)] group-hover:flex group-hover:opacity-100 md:left-3"
        aria-label={`Scroll left ${title}`}
      >
        <ChevronLeft className="h-8 w-8" />
      </button>

      <div
        ref={sliderRef}
        className="scrollbar-hide netflix-row-track flex gap-[0.26vw] overflow-x-auto overflow-y-visible pt-[0.2vw] pb-[2.1vw]"
      >
        <div className="w-4 shrink-0 md:w-12" aria-hidden="true" />
        {movies.map((movie, index) => (
          <MovieCard
            key={`${title}-${movie.id}`}
            movie={movie}
            isLarge={isLarge}
            variant={variant}
            index={index}
            totalCount={movies.length}
            isInMyList={favouriteIds.includes(movie.id)}
            isFeedbackActive={feedbackMovieId === movie.id}
            onToggleMyList={onToggleFavourite}
            onMoreInfo={onMoreInfo}
            onHoverStart={onHoverStart}
            onHoverEnd={onHoverEnd}
          />
        ))}
        <div className="w-4 shrink-0 md:w-12" aria-hidden="true" />
      </div>

      <button
        type="button"
        onClick={() => scrollRow("right")}
        className="absolute right-0 top-[56.5%] z-30 hidden h-[56%] -translate-y-1/2 items-center bg-[hsla(0,0%,8%,0.5)] px-2 text-white opacity-0 transition duration-300 hover:bg-[hsla(0,0%,8%,0.7)] group-hover:flex group-hover:opacity-100 md:right-3"
        aria-label={`Scroll right ${title}`}
      >
        <ChevronRight className="h-8 w-8" />
      </button>
    </section>
  );
};

export default MovieRow;
