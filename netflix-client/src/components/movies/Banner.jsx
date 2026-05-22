import { useState, useEffect } from 'react';
import tmdbAxios, { tmdbRequests, imageUrl } from '../../api/tmdb';
import { Play, Info } from 'lucide-react';
import useProfileStore from '../../store/profileStore';

const Banner = () => {
  const [movie, setMovie] = useState(null);
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isKids = activeProfile?.isKids;

  useEffect(() => {
    const fetchRandomMovie = async () => {
      try {
        const url = isKids 
          ? `/discover/movie?with_genres=16,10751&sort_by=popularity.desc` 
          : tmdbRequests.fetchNetflixOriginals;
          
        const response = await tmdbAxios.get(url);
        // Lấy ngẫu nhiên 1 bộ phim từ mảng kết quả
        const movies = response.data.results;
        setMovie(movies[Math.floor(Math.random() * movies.length)]);
      } catch (error) {
        console.error("Lỗi khi tải Banner:", error);
      }
    };
    
    fetchRandomMovie();
  }, []);

  // Cắt ngắn chuỗi nếu quá dài
  const truncate = (str, n) => {
    return str?.length > n ? str.substr(0, n - 1) + "..." : str;
  };

  return (
    <header 
      className="relative h-[80vh] text-white object-contain font-['Helvetica_Neue',Helvetica,Arial,sans-serif]"
      style={{
        backgroundSize: "cover",
        backgroundImage: `url("${imageUrl}${movie?.backdrop_path}")`,
        backgroundPosition: "center center",
      }}
    >
      <div className="absolute inset-0 bg-black/30"></div>
      
      <div className="relative z-10 pt-[140px] px-8 md:px-16 h-full flex flex-col justify-center">
        <h1 className="text-4xl md:text-6xl font-bold font-['Arial_Black',Impact,sans-serif] pb-2 text-shadow-md">
          {movie?.title || movie?.name || movie?.original_name}
        </h1>

        <div className="flex gap-4 mt-6">
          <button className="cursor-pointer text-black outline-none border-none font-bold rounded px-8 py-2 md:py-3 bg-white hover:bg-white/80 transition flex items-center gap-2 text-lg">
            <Play className="w-6 h-6 fill-black" /> Phát
          </button>
          <button className="cursor-pointer text-white outline-none border-none font-bold rounded px-8 py-2 md:py-3 bg-[rgba(109,109,110,0.7)] hover:bg-[rgba(109,109,110,0.4)] transition flex items-center gap-2 text-lg">
            <Info className="w-6 h-6" /> Thông tin khác
          </button>
        </div>

        <h1 className="w-full md:max-w-[45rem] leading-snug pt-6 text-sm md:text-lg font-medium text-shadow-md drop-shadow-lg">
          {truncate(movie?.overview, 150)}
        </h1>
      </div>

      <div 
        className="absolute bottom-0 h-[10rem] w-full"
        style={{
          background: "linear-gradient(180deg, transparent, rgba(37,37,37,0.61), #141414)"
        }}
      ></div>
    </header>
  );
};

export default Banner;
