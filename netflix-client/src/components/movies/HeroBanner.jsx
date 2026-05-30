import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Hls from "hls.js";
import useAuthStore from "../../store/authStore";
import { getMappedMaturity } from "../../utils/movieUtils";

const PREVIEW_START_SECOND = 2;
const PREVIEW_LENGTH_SECONDS = 18;
const DEFAULT_HERO_TRAILER =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";

const HeroBanner = ({ movie, trailerUrl, onMoreInfo }) => {
  const navigate = useNavigate();
  const accessToken = useAuthStore((state) => state.accessToken);
  const videoRef = useRef(null);
  const authObjectUrlRef = useRef(null);
  const [isMuted, setIsMuted] = useState(true);
  const [videoFailed, setVideoFailed] = useState(false);
  const [playbackSrc, setPlaybackSrc] = useState("");

  const fallbackImageUrl =
    movie?.backdropUrl || movie?.posterUrl || "/images/hero.jpg";
  const useVideoBackground = Boolean(playbackSrc) && !videoFailed;

  const maturityBadge = useMemo(() => {
    return getMappedMaturity(movie?.maturityLevel);
  }, [movie?.maturityLevel]);

  useEffect(() => {
    let disposed = false;

    const clearAuthObjectUrl = () => {
      if (authObjectUrlRef.current) {
        URL.revokeObjectURL(authObjectUrlRef.current);
        authObjectUrlRef.current = null;
      }
    };

    const preparePlaybackSource = async () => {
      clearAuthObjectUrl();

      if (!trailerUrl) {
        setPlaybackSrc("");
        return;
      }

      const sourceCandidate = trailerUrl;

      const isHlsStream = /\.m3u8(\?|$)/i.test(sourceCandidate);
      const isLikelyProtected = /\/api\//i.test(sourceCandidate);

      // Keep HLS URL direct so hls.js can request segments itself.
      if (isHlsStream || !isLikelyProtected || !accessToken) {
        setPlaybackSrc(sourceCandidate);
        return;
      }

      try {
        const response = await fetch(sourceCandidate, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(
            `Trailer fetch failed with status ${response.status}`,
          );
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (!disposed) {
          authObjectUrlRef.current = objectUrl;
          setPlaybackSrc(objectUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
        }
      } catch (error) {
        if (!disposed) {
          setPlaybackSrc("");
        }
      }
    };

    preparePlaybackSource();

    return () => {
      disposed = true;
      clearAuthObjectUrl();
    };
  }, [trailerUrl, accessToken]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !playbackSrc || videoFailed) {
      return undefined;
    }

    const isHlsStream = /\.m3u8(\?|$)/i.test(playbackSrc);
    let hls;

    if (isHlsStream && Hls.isSupported()) {
      hls = new Hls({
        xhrSetup: (xhr) => {
          if (accessToken) {
            xhr.setRequestHeader("Authorization", `Bearer ${accessToken}`);
          }
        },
      });
      hls.loadSource(playbackSrc);
      hls.attachMedia(videoElement);
    } else {
      videoElement.src = playbackSrc;
      videoElement.load();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (!isHlsStream) {
        videoElement.removeAttribute("src");
      }
    };
  }, [playbackSrc, accessToken, videoFailed]);

  useEffect(() => {
    const handleScroll = () => {
      if (!videoRef.current || !playbackSrc) {
        return;
      }

      if (window.scrollY > window.innerWidth * 0.35) {
        videoRef.current.pause();
      } else if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {
          // Ignore autoplay rejections silently.
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [playbackSrc]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !playbackSrc || videoFailed) {
      return undefined;
    }

    const startPlayback = () => {
      const duration = Number.isFinite(videoElement.duration)
        ? videoElement.duration
        : 0;

      if (duration > PREVIEW_START_SECOND + 1) {
        videoElement.currentTime = PREVIEW_START_SECOND;
      }

      videoElement.play().catch(() => {
        // Ignore autoplay rejection.
      });
    };

    const keepPreviewLoop = () => {
      const duration = Number.isFinite(videoElement.duration)
        ? videoElement.duration
        : 0;

      if (!duration || duration <= PREVIEW_START_SECOND + 1) {
        return;
      }

      const previewEnd = Math.min(
        duration - 0.25,
        PREVIEW_START_SECOND + PREVIEW_LENGTH_SECONDS,
      );

      if (videoElement.currentTime >= previewEnd) {
        videoElement.currentTime = PREVIEW_START_SECOND;
      }
    };

    videoElement.addEventListener("loadeddata", startPlayback);
    videoElement.addEventListener("timeupdate", keepPreviewLoop);

    startPlayback();

    const playbackRecoveryTimer = setTimeout(() => {
      const seemsStuck =
        videoElement.readyState < 2 ||
        (videoElement.currentTime === 0 && videoElement.paused);

      if (seemsStuck && playbackSrc !== DEFAULT_HERO_TRAILER) {
        setPlaybackSrc(DEFAULT_HERO_TRAILER);
      }
    }, 2200);

    return () => {
      clearTimeout(playbackRecoveryTimer);
      videoElement.removeEventListener("loadeddata", startPlayback);
      videoElement.removeEventListener("timeupdate", keepPreviewLoop);
    };
  }, [playbackSrc, videoFailed]);

  useEffect(() => {
    setVideoFailed(false);
  }, [playbackSrc, movie?.id]);

  if (!movie) {
    return (
      <section className="relative h-[56.25vw] min-h-[420px] w-full overflow-hidden bg-[#141414]">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-[#1f1f1f] via-[#2a2a2a] to-[#1f1f1f]" />
      </section>
    );
  }

  return (
    <header className="relative h-[56.25vw] min-h-[460px] w-full overflow-hidden text-white">
      {useVideoBackground ? (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted={isMuted}
          defaultMuted
          playsInline
          preload="metadata"
          onError={() => {
            if (playbackSrc !== DEFAULT_HERO_TRAILER) {
              setVideoFailed(false);
              setPlaybackSrc(DEFAULT_HERO_TRAILER);
              return;
            }
            setVideoFailed(true);
          }}
        />
      ) : (
        <img
          src={fallbackImageUrl}
          alt={movie.title}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      <div className="absolute inset-0 bg-black/20" />
      <div className="absolute bottom-0 left-0 right-[15%] top-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[14.7vw] bg-gradient-to-t from-[#141414] via-[#141414cc] to-transparent" />

      <div className="relative z-10 h-full">
        <div className="motion-fade-in absolute bottom-[35%] left-4 right-4 flex max-w-[92%] flex-col justify-end md:left-[4%] md:top-0 md:w-[40%] md:max-w-none md:right-auto 2xl:left-[60px]">
          <h1 className="text-4xl font-black leading-[1.1] tracking-[-0.02em] md:text-[4.5vw] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)]">
            {movie.title}
          </h1>
          <p className="mt-[1vw] text-[14px] font-medium leading-[1.5] text-white md:text-[1.2vw] drop-shadow-[2px_2px_4px_rgba(0,0,0,0.8)] line-clamp-4">
            {movie.overview ||
              "Khám phá những bộ phim đặc sắc chỉ có trên Netflix Clone."}
          </p>

          <div className="mt-[1.5vw] flex flex-wrap gap-3 whitespace-nowrap">
            <button
              type="button"
              onClick={() => navigate(`/watch/${movie.id}`)}
              className="inline-flex items-center justify-center gap-3 rounded-md bg-white px-5 py-2 text-[15px] font-bold text-black transition hover:bg-white/80 md:px-[2.4vw] md:py-[0.8vw] md:text-[1.3vw]"
            >
              <Play className="h-6 w-6 fill-black text-black md:h-[1.8vw] md:w-[1.8vw]" />
              Phát
            </button>
            <button
              type="button"
              onClick={() => onMoreInfo?.(movie)}
              className="inline-flex items-center justify-center gap-3 rounded-md bg-[rgba(109,109,110,0.7)] px-5 py-2 text-[15px] font-bold text-white transition hover:bg-[rgba(109,109,110,0.4)] md:px-[2.4vw] md:py-[0.8vw] md:text-[1.3vw]"
            >
              <Info className="h-6 w-6 md:h-[1.8vw] md:w-[1.8vw]" />
              Thông tin khác
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[35%] right-0 z-20 flex items-center gap-[1.1vw]">
        {useVideoBackground && (
          <button
            type="button"
            onClick={() => setIsMuted((prev) => !prev)}
            className="rounded-full border border-white/50 bg-black/20 p-2 text-white transition hover:bg-white/10 md:p-[0.6vw]"
            aria-label={isMuted ? "Unmute trailer" : "Mute trailer"}
          >
            {isMuted ? (
              <VolumeX className="h-5 w-5 md:h-[1.4vw] md:w-[1.4vw]" />
            ) : (
              <Volume2 className="h-5 w-5 md:h-[1.4vw] md:w-[1.4vw]" />
            )}
          </button>
        )}
        <span className="flex h-10 items-center border-l-[3px] border-l-white bg-[rgba(51,51,51,0.6)] px-4 text-[15px] font-medium text-white md:h-[2.4vw] md:px-[1.2vw] md:text-[1.2vw]">
          {maturityBadge}
        </span>
      </div>
    </header>
  );
};

export default HeroBanner;
