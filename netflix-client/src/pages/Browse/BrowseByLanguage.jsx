import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import useProfileStore from "../../store/profileStore";
import Navbar from "../../components/layouts/Navbar";
import MovieInfoModal from "../../components/movies/MovieInfoModal";
import MovieHoverPortal from "../../components/movies/MovieHoverPortal";
import { movieApi } from "../../api/movieApi";

// Danh sách ngôn ngữ được Việt hóa và sắp xếp theo bảng chữ cái tiếng Việt
const LANGUAGES = [
  { value: "ar", label: "Tiếng Ả Rập" },
  { value: "bn", label: "Tiếng Bengal" },
  { value: "ca", label: "Tiếng Catalunya" },
  { value: "da", label: "Tiếng Đan Mạch" },
  { value: "de", label: "Tiếng Đức" },
  { value: "el", label: "Tiếng Hy Lạp" },
  { value: "en", label: "Tiếng Anh" },
  { value: "es", label: "Tiếng Tây Ban Nha" },
  { value: "eu", label: "Tiếng Basque" },
  { value: "fi", label: "Tiếng Phần Lan" },
  { value: "fr", label: "Tiếng Pháp" },
  { value: "gl", label: "Tiếng Galicia" },
  { value: "he", label: "Tiếng Hebrew" },
  { value: "hi", label: "Tiếng Hindi" },
  { value: "hr", label: "Tiếng Croatia" },
  { value: "hu", label: "Tiếng Hungary" },
  { value: "id", label: "Tiếng Indonesia" },
  { value: "is", label: "Tiếng Iceland" },
  { value: "it", label: "Tiếng Ý" },
  { value: "ja", label: "Tiếng Nhật" },
  { value: "ko", label: "Tiếng Hàn" },
  { value: "ms", label: "Tiếng Malay" },
  { value: "nl", label: "Tiếng Hà Lan" },
  { value: "no", label: "Tiếng Na Uy" },
  { value: "pl", label: "Tiếng Ba Lan" },
  { value: "pt", label: "Tiếng Bồ Đào Nha" },
  { value: "ro", label: "Romania" },
  { value: "ru", label: "Tiếng Nga" },
  { value: "sv", label: "Tiếng Thụy Điển" },
  { value: "th", label: "Tiếng Thái" },
  { value: "tr", label: "Tiếng Thổ Nhĩ Kỳ" },
  { value: "vi", label: "Tiếng Việt" },
  { value: "zh", label: "Tiếng Trung" },
].sort((a, b) => a.label.localeCompare(b.label, "vi"));

const AUDIO_TYPES = [
  { value: "original", label: "Ngôn ngữ gốc" },
  { value: "dubbed", label: "Lồng tiếng" },
  { value: "subtitles", label: "Phụ đề" },
];

// Custom Dropdown Component mô phỏng thiết kế của Netflix
const NetflixDropdown = ({ label, options, selectedValue, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  return (
    <div ref={dropdownRef} className="relative inline-block text-left z-30">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-5 border border-white/60 bg-black/80 px-4 py-[6px] text-[13px] font-medium text-white transition hover:border-white focus:outline-none min-w-[140px] text-left"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <ul className="absolute left-0 top-full mt-1 max-h-[250px] min-w-full overflow-y-auto border border-white/20 bg-black/95 py-1 shadow-lg focus:outline-none custom-scrollbar z-50">
          {options.map((option) => (
            <li key={option.value}>
              <button
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full whitespace-nowrap px-4 py-2 text-left text-[13px] hover:bg-white/10 transition-colors ${
                  option.value === selectedValue ? "underline font-bold text-white" : "text-zinc-300 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const BrowseByLanguage = () => {
  const activeProfile = useProfileStore((state) => state.activeProfile);

  const [audioType, setAudioType] = useState("original");
  const [selectedLang, setSelectedLang] = useState("en"); // Mặc định là Tiếng Anh giống hình ảnh mẫu
  const [results, setResults] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hoverData, setHoverData] = useState(null);
  const [myListToast, setMyListToast] = useState("");
  const [feedbackMovieId, setFeedbackMovieId] = useState(null);

  const hoverOpenTimerRef = useRef(null);
  const hoverCloseTimerRef = useRef(null);
  const toastTimerRef = useRef(null);

  const isKids = activeProfile?.isKids;

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

  // Tính số cột hiển thị responsive để tìm đúng alignment cho HoverPortal
  const getColumnCount = () => {
    const width = window.innerWidth;
    if (width >= 1280) return 6; // xl
    if (width >= 1024) return 5; // lg
    if (width >= 768) return 4;  // md
    if (width >= 640) return 3;  // sm
    return 2;
  };

  // Load danh sách phim yêu thích
  useEffect(() => {
    movieApi
      .getFavouriteIds()
      .then(setFavouriteIds)
      .catch(() => {});
  }, []);

  // Khám phá nội dung theo ngôn ngữ được chọn
  useEffect(() => {
    let cancelled = false;
    const loadContent = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        // Gọi song song cả movies và tv shows để hiển thị nội dung phong phú
        const [moviesData, tvShowsData] = await Promise.all([
          movieApi.discoverContent({ type: "movie", language: selectedLang }),
          movieApi.discoverContent({ type: "tv", language: selectedLang }),
        ]);

        if (cancelled) return;

        // Trộn xen kẽ phim lẻ và phim truyền hình
        const combined = [];
        const maxLen = Math.max(moviesData.length, tvShowsData.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < moviesData.length) combined.push(moviesData[i]);
          if (i < tvShowsData.length) combined.push(tvShowsData[i]);
        }

        // Lọc nội dung cho trẻ em nếu profile là trẻ em
        let filtered = combined;
        if (isKids) {
          filtered = combined.filter((movie) =>
            ["G", "PG", "TV-G", "TV-PG"].includes(
              (movie.maturityLevel || "").toUpperCase()
            )
          );
        }

        // Loại bỏ trùng lặp id nếu có
        const unique = Array.from(
          new Map(filtered.map((item) => [item.id, item])).values()
        );

        setResults(unique);
      } catch (err) {
        console.error("Loi khi tai du lieu ngon ngu:", err);
        setErrorMessage("Không thể tải danh sách phim. Vui lòng kiểm tra lại kết nối.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadContent();

    return () => {
      cancelled = true;
    };
  }, [selectedLang, isKids, audioType]);

  // Cập nhật tọa độ của HoverPortal khi cuộn hoặc resize
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
    <div className="min-h-screen bg-[#141414] pb-28 text-white">
      <Navbar />

      <div className="px-4 pt-28 pb-16 md:px-[4%] 2xl:px-[60px]">
        {/* Bộ lọc lựa chọn ở đầu trang */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <h1 className="text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              Duyệt tìm theo ngôn ngữ
            </h1>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <span className="text-[13px] text-zinc-400">
              Điều chỉnh tùy chọn của bạn
            </span>
            <NetflixDropdown
              label="Lọc theo"
              options={AUDIO_TYPES}
              selectedValue={audioType}
              onChange={setAudioType}
            />
            <NetflixDropdown
              label="Chọn ngôn ngữ"
              options={LANGUAGES}
              selectedValue={selectedLang}
              onChange={setSelectedLang}
            />
          </div>
        </div>

        {/* Thông báo lỗi nếu có */}
        {errorMessage && (
          <div className="mb-6 flex items-center gap-2 rounded-md border border-red-500/60 bg-red-950/70 p-4 text-sm text-red-200">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Trạng thái Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="aspect-video animate-pulse rounded-md bg-[#2a2a2a]"
              />
            ))}
          </div>
        )}

        {/* Trạng thái trống (Không tìm thấy kết quả) */}
        {!isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500">
            <AlertCircle className="mb-4 h-12 w-12" />
            <p className="text-lg font-medium">Không tìm thấy nội dung phù hợp.</p>
            <p className="text-sm mt-1">Hãy thử đổi bộ lọc hoặc ngôn ngữ khác.</p>
          </div>
        )}

        {/* Danh sách lưới phim */}
        {!isLoading && results.length > 0 && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-12 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((movie, index) => {
              const imageUrl = movie.backdropUrl || movie.posterUrl;
              if (!imageUrl) return null;

              const isFeedbackActive = feedbackMovieId === movie.id;

              return (
                <div
                  key={movie.id}
                  onClick={() => handleOpenMovieInfo(movie)}
                  onPointerEnter={(event) => {
                    if (window.matchMedia("(hover: hover)").matches === false) return;
                    const cols = getColumnCount();
                    const colIndex = index % cols;
                    const align =
                      colIndex === 0
                        ? "left"
                        : colIndex === cols - 1
                          ? "right"
                          : "center";

                    handleCardHoverStart({
                      movie,
                      anchorElement: event.currentTarget,
                      align,
                      isLarge: false,
                    });
                  }}
                  onPointerLeave={scheduleHoverClose}
                  className={`group relative cursor-pointer overflow-visible rounded-md transition duration-300 ${
                    isFeedbackActive ? "motion-scale-in-[1.02]" : ""
                  }`}
                >
                  <img
                    src={imageUrl}
                    alt={movie.title}
                    className="aspect-video w-full rounded-md object-cover transition duration-300 group-hover:brightness-110"
                    loading="lazy"
                    onError={(event) => {
                      const fallback = movie?.posterUrl || movie?.backdropUrl || "/images/hero.jpg";
                      if (event.currentTarget.src.endsWith("/images/hero.jpg")) return;
                      event.currentTarget.src = fallback;
                    }}
                  />
                  <div className="absolute inset-x-0 bottom-0 rounded-b-md bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
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

      {/* Info Modal chi tiết phim */}
      <MovieInfoModal
        movie={selectedMovie}
        isOpen={isModalOpen}
        onClose={handleCloseMovieInfo}
        isInMyList={selectedMovie ? favouriteIds.includes(selectedMovie.id) : false}
        onToggleMyList={handleToggleFavourite}
        onPlay={handleOpenMovieInfo}
      />

      {/* Hover Portal hiển thị tóm tắt phim khi di chuột */}
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

      {/* Toast thông báo cập nhật Danh sách */}
      {myListToast && (
        <div className="pointer-events-none fixed right-4 top-24 z-[95] rounded bg-[#1f1f1f] px-3 py-2 text-xs font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.38)] motion-fade-in">
          {myListToast}
        </div>
      )}
    </div>
  );
};

export default BrowseByLanguage;
