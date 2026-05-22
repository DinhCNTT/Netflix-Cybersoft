import { useState, useEffect } from 'react';
import tmdbAxios, { imageUrl } from '../../api/tmdb';
import { Play, Plus, ThumbsUp, ChevronDown } from 'lucide-react';

const Row = ({ title, fetchUrl, isLargeRow = false }) => {
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await tmdbAxios.get(fetchUrl);
        setMovies(response.data.results);
      } catch (error) {
        console.error("Lỗi khi lấy phim cho hàng:", title, error);
      }
    };
    fetchData();
  }, [fetchUrl, title]);

  return (
    <div className="ml-4 md:ml-12 text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif] mt-8">
      <h2 className="text-xl md:text-2xl font-bold mb-4">{title}</h2>

      <div className="flex overflow-y-hidden overflow-x-scroll p-4 -ml-4 scrollbar-hide gap-2">
        {movies.map((movie) => (
          ((isLargeRow && movie.poster_path) || (!isLargeRow && movie.backdrop_path)) && (
            <div 
              key={movie.id} 
              className={`relative group cursor-pointer transition-transform duration-300 ease-out flex-shrink-0 ${
                isLargeRow ? 'w-[150px] md:w-[200px]' : 'w-[200px] md:w-[280px]'
              }`}
            >
              <img
                className="w-full h-full object-cover rounded-md"
                src={`${imageUrl}${isLargeRow ? movie.poster_path : movie.backdrop_path}`}
                alt={movie.name}
              />
              
              {/* Hiệu ứng Hover - Hiện hộp thông tin */}
              <div className="opacity-0 group-hover:opacity-100 absolute top-0 left-0 w-full h-full bg-black/80 rounded-md scale-100 group-hover:scale-110 group-hover:-translate-y-4 transition-all duration-300 z-10 p-4 flex flex-col justify-between shadow-2xl">
                <div>
                  <h3 className="text-sm md:text-base font-bold truncate mb-2">
                    {movie?.title || movie?.name || movie?.original_name}
                  </h3>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 bg-white rounded-full flex items-center justify-center hover:bg-gray-300 transition">
                      <Play className="w-4 h-4 text-black fill-black ml-1" />
                    </button>
                    <button className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition">
                      <Plus className="w-4 h-4 text-white" />
                    </button>
                    <button className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition">
                      <ThumbsUp className="w-4 h-4 text-white" />
                    </button>
                    <button className="w-8 h-8 border-2 border-gray-400 rounded-full flex items-center justify-center hover:border-white transition ml-auto">
                      <ChevronDown className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
                
                <div className="text-xs font-semibold flex items-center gap-2 mt-3">
                  <span className="text-[#46d369]">Độ trùng {Math.floor(Math.random() * 20 + 80)}%</span>
                  <span className="border border-gray-500 px-1 text-[10px]">HD</span>
                </div>
              </div>
            </div>
          )
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
};

export default Row;
