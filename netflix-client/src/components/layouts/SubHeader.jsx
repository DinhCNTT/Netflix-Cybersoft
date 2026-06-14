import { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";

export const GENRE_MAP = {
  "anh": { type: "tv", country: "GB" },
  "anime": { type: "tv", genres: "16", country: "JP" },
  "chau-a": { type: "tv", country: "KR|JP|CN|TW|TH" },
  "chau-au": { type: "tv", country: "FR|ES|DE|IT|NO|SE|DK|GB" },
  "chiem-tinh": { type: "tv", keywords: "310344" }, // astrology keyword id
  "chinh-kich": { type: "tv", genres: "18" },
  "giat-gan": { type: "tv", keywords: "10078" }, // thriller keyword id
  "hai": { type: "tv", genres: "35" },
  "hanh-dong": { type: "tv", genres: "10759" },
  "khoa-hoc-thien-nhien": { type: "tv", genres: "99" },
  "vien-tuong": { type: "tv", genres: "10765" },
  "kinh-di": { type: "tv", keywords: "3335", without_genres: "16,10762,35" }, // chuẩn keyword horror, loại trừ hoạt hình(16), trẻ em(10762), hài(35)
  "lang-man": { type: "tv", keywords: "9799" }, // chuẩn keyword romance của TMDB
  "my": { type: "tv", country: "US" },
  "chuyen-the": { type: "tv", keywords: "818" }, // based on novel keyword id
  "chinh-kich-han": { type: "tv", country: "KR", genres: "18" },
  "tai-lieu": { type: "tv", genres: "99" },
  "tam-trang": { type: "tv", genres: "18" }, 
  "thang-tu-hao": { type: "tv", keywords: "158718" }, // lgbt keyword id
  "toi-pham": { type: "tv", genres: "80" },
  "tre-em": { type: "tv", genres: "10762" },
  "tuoi-teen": { type: "tv", keywords: "14881" }, // teen keyword id
};

export const MOVIE_GENRE_MAP = {
  "anime": { type: "movie", genres: "16", country: "JP" },
  "chau-a": { type: "movie", country: "KR|JP|CN|TW|TH|HK" },
  "chiem-tinh": { type: "movie", keywords: "310344" },
  "gia-tuong": { type: "movie", genres: "14" },
  "award-winning": { type: "movie", keywords: "307044|285640" },
  "giat-gan": { type: "movie", genres: "53" },
  "hai": { type: "movie", genres: "35" },
  "hanh-dong": { type: "movie", genres: "28" },
  "hollywood": { type: "movie", country: "US" },
  "khoa-hoc-vien-tuong": { type: "movie", genres: "878" },
  "kinh-di": { type: "movie", genres: "27" },
  "kinh-dien": { type: "movie", keywords: "297395|9670" },
  "lang-man": { type: "movie", genres: "10749" },
  "chuyen-the": { type: "movie", keywords: "818" },
  "chinh-kich": { type: "movie", genres: "18" },
  "doc-lap": { type: "movie", keywords: "10183" },
  "phim-ngan": { type: "movie", keywords: "210083" },
  "tai-lieu": { type: "movie", genres: "99" },
  "phim-viet-nam": { type: "movie", country: "VN" },
  "quoc-te": { type: "movie", without_countries: "US,VN" },
  "tam-trang": { type: "movie", keywords: "233633" },
  "thang-tu-hao": { type: "movie", keywords: "158718" },
  "toi-pham": { type: "movie", genres: "80" },
  "tre-em-va-gia-dinh": { type: "movie", genres: "10751" },
};

const COL_1 = [
  { label: "Anh", slug: "anh" },
  { label: "Anime", slug: "anime" },
  { label: "Châu Á", slug: "chau-a" },
  { label: "Châu Âu", slug: "chau-au" },
  { label: "Chiêm tinh", slug: "chiem-tinh" },
  { label: "Chính kịch", slug: "chinh-kich" },
  { label: "Giật gân", slug: "giat-gan" },
  { label: "Hài", slug: "hai" },
];

const COL_2 = [
  { label: "Hành động", slug: "hanh-dong" },
  { label: "Khoa học và thiên nhiên", slug: "khoa-hoc-thien-nhien" },
  { label: "Khoa học viễn tưởng và giả tưởng", slug: "vien-tuong" },
  { label: "Kinh dị", slug: "kinh-di" },
  { label: "Lãng mạn", slug: "lang-man" },
  { label: "Mỹ", slug: "my" },
  { label: "Nội dung chuyển thể từ sách", slug: "chuyen-the" },
  { label: "Phim chính kịch Hàn Quốc", slug: "chinh-kich-han" },
];

const COL_3 = [
  { label: "Tài liệu", slug: "tai-lieu" },
  { label: "Tâm trạng", slug: "tam-trang" },
  { label: "Tháng Tự hào", slug: "thang-tu-hao" },
  { label: "Tội phạm", slug: "toi-pham" },
  { label: "Trẻ em", slug: "tre-em" },
  { label: "Tuổi teen", slug: "tuoi-teen" },
];

const MOVIE_COL_1 = [
  { label: "Anime", slug: "anime" },
  { label: "Châu Á", slug: "chau-a" },
  { label: "Chiêm tinh", slug: "chiem-tinh" },
  { label: "Giả tưởng", slug: "gia-tuong" },
  { label: "Giành giải thưởng", slug: "award-winning" },
  { label: "Giật gân", slug: "giat-gan" },
  { label: "Hài", slug: "hai" },
  { label: "Hành động", slug: "hanh-dong" },
];

const MOVIE_COL_2 = [
  { label: "Hollywood", slug: "hollywood" },
  { label: "Khoa học viễn tưởng", slug: "khoa-hoc-vien-tuong" },
  { label: "Kinh dị", slug: "kinh-di" },
  { label: "Kinh điển", slug: "kinh-dien" },
  { label: "Lãng mạn", slug: "lang-man" },
  { label: "Nội dung chuyển thể từ sách", slug: "chuyen-the" },
  { label: "Phim chính kịch", slug: "chinh-kich" },
  { label: "Phim độc lập", slug: "doc-lap" },
];

const MOVIE_COL_3 = [
  { label: "Phim ngắn", slug: "phim-ngan" },
  { label: "Phim tài liệu", slug: "tai-lieu" },
  { label: "Phim Việt Nam", slug: "phim-viet-nam" },
  { label: "Quốc tế", slug: "quoc-te" },
  { label: "Tâm trạng", slug: "tam-trang" },
  { label: "Tháng Tự hào", slug: "thang-tu-hao" },
  { label: "Tội phạm", slug: "toi-pham" },
  { label: "Trẻ em và gia đình", slug: "tre-em-va-gia-dinh" },
];

const SubHeader = ({ title = "Series", genreName = null, type = "tv" }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isMovie = type === "movie" || title === "Phim" || window.location.pathname.includes("/movies");
  
  const currentGenresCol1 = isMovie ? MOVIE_COL_1 : COL_1;
  const currentGenresCol2 = isMovie ? MOVIE_COL_2 : COL_2;
  const currentGenresCol3 = isMovie ? MOVIE_COL_3 : COL_3;
  
  const genreBaseUrl = isMovie ? "/browse/movies/genre" : "/browse/series/genre";
  const parentUrl = isMovie ? "/browse/movies" : "/browse/series";

  return (
    <div className="absolute top-[68px] left-0 right-0 z-40 flex items-center px-4 md:px-[4%] 2xl:px-[60px] h-[68px]">
      <div className="flex items-center gap-4">
        {genreName ? (
          <div className="flex items-center gap-2 text-white text-sm md:text-xl font-medium">
            <Link to={parentUrl} className="text-[#a6a6a6] hover:text-white transition">
              {title}
            </Link>
            <span className="text-[#a6a6a6]">{">"}</span>
            <span className="text-white text-2xl md:text-4xl font-bold">{genreName}</span>
          </div>
        ) : (
          <h1 className="text-white text-2xl md:text-4xl font-bold">{title}</h1>
        )}

        {!genreName && (
          <div className="relative ml-4" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 bg-black/60 border border-white/20 hover:bg-white/10 transition px-3 py-1 rounded-sm text-white text-sm font-medium"
            >
              Thể loại
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 bg-black/95 border border-white/15 w-[max-content] p-4 shadow-xl z-50">
                <div className="flex gap-12">
                  <ul className="flex flex-col gap-3 min-w-[150px]">
                    {currentGenresCol1.map((item) => (
                      <li key={item.slug}>
                        <Link
                          to={`${genreBaseUrl}/${item.slug}`}
                          className="text-[#e5e5e5] text-[13px] hover:text-white hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <ul className="flex flex-col gap-3 min-w-[150px]">
                    {currentGenresCol2.map((item) => (
                      <li key={item.slug}>
                        <Link
                          to={`${genreBaseUrl}/${item.slug}`}
                          className="text-[#e5e5e5] text-[13px] hover:text-white hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <ul className="flex flex-col gap-3 min-w-[150px]">
                    {currentGenresCol3.map((item) => (
                      <li key={item.slug}>
                        <Link
                          to={`${genreBaseUrl}/${item.slug}`}
                          className="text-[#e5e5e5] text-[13px] hover:text-white hover:underline"
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SubHeader;
