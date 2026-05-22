import { useEffect } from 'react';
import Navbar from '../../components/layouts/Navbar';
import Banner from '../../components/movies/Banner';
import Row from '../../components/movies/Row';
import { tmdbRequests } from '../../api/tmdb';
import useProfileStore from '../../store/profileStore';

const Browse = () => {
  const activeProfile = useProfileStore((state) => state.activeProfile);
  const isKids = activeProfile?.isKids;
  return (
    <div className="bg-[#141414] min-h-screen pb-20">
      <Navbar />
      <Banner />
      
      <div className="-mt-[150px] relative z-20">
        {isKids ? (
          <>
            <Row title="Dành Cho Bé" fetchUrl={`/discover/movie?with_genres=16,10751&sort_by=popularity.desc`} isLargeRow />
            <Row title="Phim Hoạt Hình Dài Tập" fetchUrl={`/discover/tv?with_genres=16`} />
            <Row title="Gắn Kết Gia Đình" fetchUrl={`/discover/movie?with_genres=10751`} />
            <Row title="Phiêu Lưu Kỳ Thú" fetchUrl={`/discover/movie?with_genres=12,16`} />
            <Row title="Hài Hước Vui Nhộn" fetchUrl={`/discover/movie?with_genres=35,16`} />
          </>
        ) : (
          <>
            <Row title="Netflix Originals" fetchUrl={tmdbRequests.fetchNetflixOriginals} isLargeRow />
            <Row title="Hiện Đang Thịnh Hành" fetchUrl={tmdbRequests.fetchTrending} />
            <Row title="Phim Hành Động" fetchUrl={tmdbRequests.fetchActionMovies} />
            <Row title="Phim Hài" fetchUrl={tmdbRequests.fetchComedyMovies} />
            <Row title="Phim Kinh Dị" fetchUrl={tmdbRequests.fetchHorrorMovies} />
            <Row title="Phim Lãng Mạn" fetchUrl={tmdbRequests.fetchRomanceMovies} />
            <Row title="Phim Tài Liệu" fetchUrl={tmdbRequests.fetchDocumentaries} />
          </>
        )}
      </div>
    </div>
  );
};

export default Browse;
