import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useLocation, useParams } from "react-router-dom";
import useProfileStore from "../../store/profileStore";
import Navbar from "../../components/layouts/Navbar";
import SubHeader, { MOVIE_GENRE_MAP } from "../../components/layouts/SubHeader";
import HeroBanner from "../../components/movies/HeroBanner";
import MovieRow from "../../components/movies/MovieRow";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

const MovieGenre = () => {
  const { genreId } = useParams();
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
    if (!featuredMovie?.trailerUrl) return "";
    return featuredMovie.trailerUrl;
  }, [featuredMovie]);

  const genreConfig = useMemo(() => MOVIE_GENRE_MAP[genreId] || { type: "movie" }, [genreId]);

  const genreLabel = useMemo(() => {
    if (genreId === "anime") return "Anime";
    if (genreId === "chau-a") return "Châu Á";
    if (genreId === "chiem-tinh") return "Chiêm tinh";
    if (genreId === "gia-tuong") return "Giả tưởng";
    if (genreId === "award-winning") return "Giành giải thưởng";
    if (genreId === "giat-gan") return "Giật gân";
    if (genreId === "hai") return "Hài";
    if (genreId === "hanh-dong") return "Hành động";
    if (genreId === "hollywood") return "Hollywood";
    if (genreId === "khoa-hoc-vien-tuong") return "Khoa học viễn tưởng";
    if (genreId === "kinh-di") return "Kinh dị";
    if (genreId === "kinh-dien") return "Kinh điển";
    if (genreId === "lang-man") return "Lãng mạn";
    if (genreId === "chuyen-the") return "Nội dung chuyển thể từ sách";
    if (genreId === "chinh-kich") return "Phim chính kịch";
    if (genreId === "doc-lap") return "Phim độc lập";
    if (genreId === "phim-ngan") return "Phim ngắn";
    if (genreId === "tai-lieu") return "Phim tài liệu";
    if (genreId === "phim-viet-nam") return "Phim Việt Nam";
    if (genreId === "quoc-te") return "Quốc tế";
    if (genreId === "tam-trang") return "Tâm trạng";
    if (genreId === "thang-tu-hao") return "Tháng Tự hào";
    if (genreId === "toi-pham") return "Tội phạm";
    if (genreId === "tre-em-va-gia-dinh") return "Trẻ em và gia đình";

    const parts = (genreId || "").split("-");
    return parts.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
  }, [genreId]);

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

  // Lọc phim lẻ và phim sạch (không sex, không 18+)
  const cleanMovies = useCallback((movies) => {
    return (movies || []).filter((movie) => {
      const isNotTv = movie.mediaType === "movie" || !movie.seasons;
      const titleLower = (movie.title || movie.name || "").toLowerCase();
      const overviewLower = (movie.overview || "").toLowerCase();
      
      const isAdult = movie.adult === true ||
        titleLower.includes("porn") || 
        titleLower.includes("sex") || 
        titleLower.includes("18+") || 
        titleLower.includes("erotic") ||
        overviewLower.includes("khiêu dâm") || 
        overviewLower.includes("phim cấp 3");

      return isNotTv && !isAdult;
    });
  }, []);

  // Gộp cấu hình bộ lọc thể loại đã chọn với cấu hình của từng hàng phim
  const mergeParams = useCallback((categoryParams, genreConfig) => {
    const merged = { ...categoryParams, ...genreConfig };
    
    if (categoryParams.genres && genreConfig.genres) {
      const catGenres = categoryParams.genres.split(",");
      const genGenres = genreConfig.genres.split(",");
      const allGenres = Array.from(new Set([...catGenres, ...genGenres])).join(",");
      merged.genres = allGenres;
    }

    if (categoryParams.keywords && genreConfig.keywords) {
      merged.keywords = `${categoryParams.keywords},${genreConfig.keywords}`;
    }

    if (categoryParams.country && genreConfig.country) {
      // Ưu tiên quốc gia của thể loại hoặc của hàng tùy ngữ cảnh
      merged.country = genreConfig.country;
    }

    merged.type = "movie"; // Luôn chỉ lấy phim lẻ
    return merged;
  }, []);

  useEffect(() => {
    const loadGenreData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [favIds, myListRaw] = await Promise.all([
          movieApi.getFavouriteIds(),
          movieApi.getMyList(),
        ]);

        const myList = cleanMovies(myListRaw);

        const shuffleArray = (array) => {
          const newArr = [...array];
          for (let i = newArr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
          }
          return newArr;
        };

        // Danh sách 12 hàng chủ đề phim đã gộp bộ lọc thể loại hiện tại
        const CATEGORIES = [
          { key: "popular_movies", params: { sort_by: "popularity.desc" }, title: "Phim được yêu thích nổi tiếng" },
          { key: "crime_drama", params: { genres: "18,80" }, title: "Phim chính kịch tội phạm" },
          { key: "netflix_originals", params: { sort_by: "vote_count.desc" }, title: "Chỉ có trên Netflix" },
          { key: "friendship_comedy", params: { genres: "35", keywords: "9716" }, title: "Phim hài về tình bạn" },
          { key: "drama_movies", params: { genres: "18" }, title: "Phim chính kịch" },
          { key: "top_picks", params: { sort_by: "popularity.desc", "vote_count.gte": 80 }, title: "Lựa chọn hàng đầu hôm nay cho bạn" },
          { key: "romance_comedy", params: { genres: "35,10749" }, title: "Phim hài lãng mạn" },
          { key: "history_20th", params: { genres: "36" }, title: "Phim thời kỳ lịch sử thế kỷ 20" },
          { key: "euro_us_action", params: { genres: "28", country: "US|GB|FR|DE|ES" }, title: "Phim hành động Âu – Mỹ" },
          { key: "emotional_drama", params: { genres: "18", keywords: "233633" }, title: "Phim chính kịch xúc động" },
          { key: "comedy_movies", params: { genres: "35" }, title: "Phim hài" },
          { key: "sci_fi", params: { genres: "878" }, title: "Phim khoa học viễn tưởng" },
        ];

        const dynamicRowsData = await Promise.all(
          CATEGORIES.map(async (config) => {
            try {
              const mergedParams = mergeParams(config.params, genreConfig);
              const movies = await movieApi.discoverContent(mergedParams);
              return {
                key: config.key,
                title: config.title,
                movies: shuffleArray(cleanMovies(movies)),
                variant: "standard"
              };
            } catch (err) {
              console.error(`Lỗi tải hàng ${config.title}:`, err);
              return { key: config.key, title: config.title, movies: [], variant: "standard" };
            }
          })
        );

        let recommendationRow = null;
        if (myList.length > 0) {
          const randomMyListMovie = myList[Math.floor(Math.random() * myList.length)];
          try {
            const recommendedMovies = await movieApi.getRecommendations(randomMyListMovie.id);
            // Lọc các gợi ý thuộc đúng thể loại này
            const genreFilteredRecs = cleanMovies(recommendedMovies).filter(m => {
              if (!genreConfig.genres) return true;
              const genreIds = genreConfig.genres.split(",").map(Number);
              return (m.genreIds || []).some(id => genreIds.includes(id));
            });

            if (genreFilteredRecs && genreFilteredRecs.length > 0) {
              recommendationRow = {
                key: `rec-${randomMyListMovie.id}`,
                title: "Có thể bạn sẽ mê các tác phẩm này",
                movies: genreFilteredRecs,
                variant: "standard"
              };
            }
          } catch (e) {
            console.error("Lỗi khi tải phim gợi ý:", e);
          }
        }

        const baseRows = [];
        
        // 1. Gợi ý hàng đầu
        if (recommendationRow) {
          baseRows.push(recommendationRow);
        }

        // 2. Tiếp tục xem (My List)
        if (myList.length > 0) {
          const myGenreList = myList.filter(m => {
            if (!genreConfig.genres) return true;
            const genreIds = genreConfig.genres.split(",").map(Number);
            return (m.genreIds || []).some(id => genreIds.includes(id));
          });

          if (myGenreList.length > 0) {
            baseRows.push({
                key: "continue",
                title: `Danh sách Tiếp tục xem của ${activeProfile?.name || "bạn"}`,
                movies: myGenreList,
                variant: "continue",
            });
          }
        }

        // 3. Phổ biến nhất trong thể loại này
        baseRows.push(dynamicRowsData[0]);

        // 4. Các chủ đề khác
        baseRows.push(...dynamicRowsData.slice(1));

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

          if (row.key === "popular_movies" || row.key.startsWith("rec-")) {
            moviesToKeep = moviesToKeep.filter((m) => {
              if (seenIds.has(m.id)) return false;
              seenIds.add(m.id);
              return true;
            });
          }

          return { ...row, movies: moviesToKeep };
        });

        // Tìm phim làm Hero Banner ngẫu nhiên từ hàng đầu tiên
        const allGenreMovies = dynamicRowsData[0]?.movies || [];
        const featured = allGenreMovies.length > 0 
          ? allGenreMovies[Math.floor(Math.random() * allGenreMovies.length)] 
          : null;

        setFeaturedMovie(featured);
        setFavouriteIds(favIds);
        setRows(kidsFilteredRows.filter(r => r.movies.length > 0).slice(0, 12)); // Giữ tối đa 12 hàng phim lẻ
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu MovieGenre:", error);
        setErrorMessage("Không thể tải dữ liệu phim theo thể loại này. Vui lòng kiểm tra lại.");
      } finally {
        setIsLoading(false);
      }
    };

    loadGenreData();
  }, [genreId, isKids, activeProfile?.name, genreConfig, genreLabel, cleanMovies, mergeParams]);

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
          showMyListToast("Đã xóa khỏi Danh sách của tôi");
        } else {
          updatedIds = await movieApi.addFavourite(movie.id);
          showMyListToast("Đã thêm vào Danh sách của tôi");
        }

        setFavouriteIds(updatedIds);
        triggerMovieFeedback(movie.id);
      } catch (error) {
        console.error("Lỗi cập nhật Danh sách của tôi:", error);
      }
    },
    [favouriteIds, showMyListToast, triggerMovieFeedback],
  );

  const handleRateFromHover = useCallback(async (movie, value) => {
    try {
      await movieApi.rateMovie(movie.id, value);
    } catch (error) {
      console.error("Lỗi cập nhật rating:", error);
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
        <SubHeader title="Phim" genreName={`Phim ${genreLabel.toLowerCase()}`} type="movie" />
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
          <div className="px-4 md:px-12 mt-8">
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
              className="motion-fade-in mt-6"
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
          <div className="mx-4 rounded-md border border-zinc-700 bg-zinc-900/60 p-4 text-sm text-zinc-200 md:mx-12 mt-8">
            Chưa có phim lẻ nào thuộc thể loại này.
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
        contextGenre={genreLabel}
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

export default MovieGenre;
