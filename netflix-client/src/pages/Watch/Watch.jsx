import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import {
  ArrowLeft,
  Maximize,
  Minimize,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  MessageSquare,
  Gauge,
  Layers,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { movieApi } from "../../api/movieApi";
import { watchApi } from "../../api/watchApi";
import useProfileStore from "../../store/profileStore";

const INTRO_START_SECONDS = 60;
const INTRO_END_SECONDS = 90;
const AUTO_NEXT_SECONDS = 10;

const formatTime = (seconds) => {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "00:00";
  }

  const total = Math.floor(seconds);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;

  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const Watch = () => {
  const navigate = useNavigate();
  const { movieId } = useParams();
  const activeProfile = useProfileStore((state) => state.activeProfile);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const hlsRef = useRef(null);
  const saveIntervalRef = useRef(null);
  const controlsTimeoutRef = useRef(null);
  const autoNextIntervalRef = useRef(null);
  const pendingResumeRef = useRef(0);

  const [movie, setMovie] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [seasonIndex, setSeasonIndex] = useState(0);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [subtitleLang, setSubtitleLang] = useState("off");
  const [qualities, setQualities] = useState([
    { label: "Auto", value: "auto" },
  ]);
  const [selectedQuality, setSelectedQuality] = useState("auto");
  const [qualityLevelMap, setQualityLevelMap] = useState({});
  const [autoNextCountdown, setAutoNextCountdown] = useState(null);
  
  // New State for UI
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showEpisodesMenu, setShowEpisodesMenu] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [clickEffect, setClickEffect] = useState(null);

  const selectedSeason = seasons[seasonIndex] || null;
  const selectedEpisode = selectedSeason?.episodes?.[episodeIndex] || null;

  const hasNextEpisode = useMemo(() => {
    if (!seasons.length || !selectedEpisode) return false;

    if (episodeIndex < (selectedSeason?.episodes?.length || 0) - 1) {
      return true;
    }

    return seasonIndex < seasons.length - 1;
  }, [episodeIndex, seasonIndex, seasons, selectedEpisode, selectedSeason]);

  const clearAutoNext = useCallback(() => {
    if (autoNextIntervalRef.current) {
      clearInterval(autoNextIntervalRef.current);
      autoNextIntervalRef.current = null;
    }
    setAutoNextCountdown(null);
  }, []);

  const getNextEpisodePosition = useCallback(() => {
    if (!hasNextEpisode) {
      return null;
    }

    if (episodeIndex < (selectedSeason?.episodes?.length || 0) - 1) {
      return {
        nextSeasonIndex: seasonIndex,
        nextEpisodeIndex: episodeIndex + 1,
      };
    }

    return { nextSeasonIndex: seasonIndex + 1, nextEpisodeIndex: 0 };
  }, [episodeIndex, hasNextEpisode, seasonIndex, selectedSeason]);

  const goToNextEpisode = useCallback(() => {
    const nextPosition = getNextEpisodePosition();
    if (!nextPosition) {
      return;
    }

    clearAutoNext();
    pendingResumeRef.current = 0;
    setSeasonIndex(nextPosition.nextSeasonIndex);
    setEpisodeIndex(nextPosition.nextEpisodeIndex);
  }, [clearAutoNext, getNextEpisodePosition]);

  const persistProgress = useCallback(async () => {
    const video = videoRef.current;

    if (!video || !selectedEpisode || !activeProfile?.id || !movieId) {
      return;
    }

    const timestampSeconds = Math.floor(video.currentTime || 0);

    if (timestampSeconds <= 0) {
      return;
    }

    try {
      await watchApi.upsertWatchHistory({
        profileId: activeProfile.id,
        movieId: Number(movieId),
        episodeId: selectedEpisode.id,
        timestampSeconds,
      });
    } catch (error) {
      console.error("Loi luu tien do xem:", error);
    }
  }, [activeProfile?.id, movieId, selectedEpisode]);

  useEffect(() => {
    const loadWatchData = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const [movieData, seasonResponse, histories] = await Promise.all([
          movieApi.getMovieById(movieId),
          watchApi.getMovieSeasons(movieId),
          watchApi.getWatchHistory(),
        ]);

        const seasonList = seasonResponse?.seasons || [];
        if (!seasonList.length) {
          throw new Error("Movie nay chua co season/episode de phat.");
        }

        setMovie(movieData);
        setSeasons(seasonList);

        const movieHistory = histories
          .filter((item) => Number(item.movieId) === Number(movieId))
          .filter(
            (item) => !activeProfile?.id || item.profileId === activeProfile.id,
          )
          .sort(
            (a, b) =>
              new Date(b.lastWatchedAt).getTime() -
              new Date(a.lastWatchedAt).getTime(),
          )[0];

        if (movieHistory?.episodeId) {
          let foundSeasonIndex = 0;
          let foundEpisodeIndex = 0;

          seasonList.forEach((season, sIndex) => {
            const eIndex = season.episodes.findIndex(
              (episode) => episode.id === movieHistory.episodeId,
            );
            if (eIndex >= 0) {
              foundSeasonIndex = sIndex;
              foundEpisodeIndex = eIndex;
            }
          });

          setSeasonIndex(foundSeasonIndex);
          setEpisodeIndex(foundEpisodeIndex);
          pendingResumeRef.current = movieHistory.timestampSeconds || 0;
        } else {
          setSeasonIndex(0);
          setEpisodeIndex(0);
          pendingResumeRef.current = 0;
        }
      } catch (error) {
        console.error("Loi tai du lieu watch:", error);
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            "Khong the tai du lieu phat video.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadWatchData();
  }, [activeProfile?.id, movieId]);

  useEffect(() => {
    if (!selectedEpisode || !videoRef.current) {
      return undefined;
    }

    const video = videoRef.current;
    clearAutoNext();

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const source = selectedEpisode.videoUrl;

    const applyResume = () => {
      if (pendingResumeRef.current > 0 && Number.isFinite(video.duration)) {
        video.currentTime = Math.min(
          pendingResumeRef.current,
          Math.max(video.duration - 2, 0),
        );
        pendingResumeRef.current = 0;
      }
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration || 0);
      applyResume();
    };

    const handleTimeUpdate = () => setCurrentTime(video.currentTime || 0);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);

      if (!hasNextEpisode) {
        return;
      }

      setAutoNextCountdown(AUTO_NEXT_SECONDS);
      autoNextIntervalRef.current = setInterval(() => {
        setAutoNextCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            goToNextEpisode();
            return null;
          }

          return prev - 1;
        });
      }, 1000);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);

    setQualities([{ label: "Auto", value: "auto" }]);
    setSelectedQuality("auto");
    setQualityLevelMap({});

    if (Hls.isSupported() && source.endsWith(".m3u8")) {
      const hls = new Hls({ enableWorker: true });
      hlsRef.current = hls;
      hls.loadSource(source);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_, data) => {
        const levels = (data.levels || []).map((level, index) => ({
          index,
          height: level.height || 0,
        }));
        const targets = [360, 720, 1080];

        const map = targets.reduce((acc, target) => {
          if (!levels.length) {
            acc[target] = -1;
            return acc;
          }

          const nearest = levels.reduce((best, level) => {
            if (!best) return level;

            const currentDiff = Math.abs(level.height - target);
            const bestDiff = Math.abs(best.height - target);
            return currentDiff < bestDiff ? level : best;
          }, null);

          acc[target] = nearest?.index ?? -1;
          return acc;
        }, {});

        setQualityLevelMap(map);
        setQualities([
          { label: "Auto", value: "auto" },
          { label: "360p", value: "360" },
          { label: "720p", value: "720" },
          { label: "1080p", value: "1080" },
        ]);
        video.play().catch(() => {
          // User gesture may be required by browser policy.
        });
      });
    } else {
      video.src = source;
      video.load();
      video.play().catch(() => {
        // User gesture may be required by browser policy.
      });
    }

    return () => {
      video.pause();
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
    };
  }, [clearAutoNext, goToNextEpisode, hasNextEpisode, selectedEpisode]);

  useEffect(() => {
    if (!selectedEpisode || !activeProfile?.id) {
      return undefined;
    }

    saveIntervalRef.current = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.paused) {
        return;
      }

      persistProgress();
    }, 10000);

    return () => {
      if (saveIntervalRef.current) {
        clearInterval(saveIntervalRef.current);
        saveIntervalRef.current = null;
      }
    };
  }, [activeProfile?.id, persistProgress, selectedEpisode]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        persistProgress();
      }
    };

    const handleBeforeUnload = () => {
      persistProgress();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [persistProgress]);

  useEffect(() => {
    return () => {
      clearAutoNext();

      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }

      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }

      persistProgress();
    };
  }, [clearAutoNext, persistProgress]);

  const handleMouseMove = () => {
    setShowControls(true);

    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }

    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    // Unmute on first user interaction (Chrome autoplay policy requires initial muted)
    if (video.muted) {
      video.muted = false;
      video.volume = volume;
      setIsMuted(false);
    }

    if (video.paused) {
      await video.play();
    } else {
      video.pause();
    }
  };

  const seekBy = (delta) => {
    const video = videoRef.current;
    if (!video) return;
    const next = Math.max(
      0,
      Math.min(video.duration || 0, video.currentTime + delta),
    );
    video.currentTime = next;
    setCurrentTime(next);
  };

  const handleProgressChange = (event) => {
    const value = Number(event.target.value);
    const video = videoRef.current;
    if (!video || !Number.isFinite(value)) return;

    const next = (value / 100) * (duration || 0);
    video.currentTime = next;
    setCurrentTime(next);
  };

  const handleVolumeChange = (event) => {
    const value = Number(event.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = value;
    video.muted = value === 0;
    setVolume(value);
    setIsMuted(value === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handlePlaybackRateChange = (rate) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const handleScreenClick = (e) => {
    if (e.target.closest('.controls-overlay')) return;
    
    const video = videoRef.current;
    if (!video) return;

    const willPlay = video.paused;
    togglePlay();
    
    setClickEffect(willPlay ? 'play' : 'pause');
    setTimeout(() => setClickEffect(null), 500);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) {
      return;
    }

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleQualityChange = (event) => {
    const value = event.target.value;
    setSelectedQuality(value);

    if (!hlsRef.current) {
      return;
    }

    if (value === "auto") {
      hlsRef.current.currentLevel = -1;
      return;
    }

    const level = qualityLevelMap[Number(value)];
    hlsRef.current.currentLevel = Number.isInteger(level) ? level : -1;
  };

  const skipIntroVisible =
    currentTime >= INTRO_START_SECONDS && currentTime <= INTRO_END_SECONDS;

  const subtitleTrack = useMemo(() => {
    if (subtitleLang === "off") {
      return null;
    }

    const src = subtitleLang === "vi" ? "/subtitles/vi.vtt" : "/subtitles/en.vtt";

    return {
      src,
      label: subtitleLang === "vi" ? "Tiếng Việt" : "English",
      lang: subtitleLang,
    };
  }, [subtitleLang]);

  const subtitleOptions = useMemo(() => {
    return [
      { value: "off", label: "CC Off" },
      { value: "vi", label: "Tiếng Việt" },
      { value: "en", label: "English" },
    ];
  }, []);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="animate-pulse text-lg">Dang tai player...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="w-full max-w-2xl rounded-lg border border-red-500/40 bg-red-950/40 p-6 text-center">
          <p className="text-lg font-semibold">Khong the phat video</p>
          <p className="mt-2 text-sm text-red-200">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate("/browse")}
            className="mt-4 rounded bg-white px-4 py-2 font-semibold text-black"
          >
            Quay lai Browse
          </button>
        </div>
      </main>
    );
  }

  return (
    <main
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-screen overflow-hidden bg-black text-white"
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full bg-black object-contain"
        playsInline
        muted
      >
        {subtitleTrack && (
          <track
            key={subtitleTrack.src + subtitleTrack.lang}
            src={subtitleTrack.src}
            kind="subtitles"
            srcLang={subtitleTrack.lang}
            label={subtitleTrack.label}
            default
          />
        )}
      </video>

      <div
        className={`absolute inset-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0"}`}
        onClick={handleScreenClick}
      >
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/85 to-transparent p-6 controls-overlay">
          <button
            type="button"
            onClick={() => navigate("/browse")}
            className="inline-flex items-center justify-center rounded-full p-2 hover:bg-black/40 transition"
          >
            <ArrowLeft className="h-8 w-8" />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 md:p-8 controls-overlay">
          
          {/* Timeline / Progress Bar */}
          <div className="group mb-4 flex items-center gap-4 text-sm font-semibold text-white">
            <span className="w-12 text-center">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center h-4 cursor-pointer">
              <input
                type="range"
                min="0"
                max="100"
                value={Number.isFinite(progressPercent) ? progressPercent : 0}
                onChange={handleProgressChange}
                className="absolute inset-0 w-full h-1 appearance-none bg-gray-600 outline-none rounded-full transition-all group-hover:h-2 z-10"
                style={{
                  background: `linear-gradient(to right, #e50914 ${progressPercent}%, #555 ${progressPercent}%)`,
                }}
              />
            </div>
            <span className="w-12 text-center">{formatTime(duration - currentTime)}</span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between relative">
            
            {/* Left Controls */}
            <div className="flex items-center gap-6">
              <button onClick={togglePlay} className="text-white hover:scale-110 transition-transform">
                {isPlaying ? <Pause className="h-8 w-8 fill-white" /> : <Play className="h-8 w-8 fill-white" />}
              </button>
              <button onClick={() => seekBy(-10)} className="text-white hover:scale-110 transition-transform">
                <RotateCcw className="h-7 w-7" />
              </button>
              <button onClick={() => seekBy(10)} className="text-white hover:scale-110 transition-transform">
                <RotateCw className="h-7 w-7" />
              </button>
              
              {/* Volume Control */}
              <div className="group relative flex items-center h-8">
                <button onClick={toggleMute} className="text-white hover:scale-110 transition-transform peer">
                  {isMuted || volume === 0 ? <VolumeX className="h-7 w-7" /> : <Volume2 className="h-7 w-7" />}
                </button>
                <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 h-28 w-8 rounded bg-zinc-900/95 peer-hover:flex group-hover:flex flex-col items-center justify-center shadow-lg z-50">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="h-20 cursor-pointer appearance-none bg-transparent outline-none accent-red-600"
                    style={{ WebkitAppearance: 'slider-vertical' }}
                  />
                </div>
              </div>
            </div>

            {/* Center Title */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex flex-col items-center text-white pointer-events-none">
              <h2 className="text-lg font-bold">{movie?.title || "Now Playing"}</h2>
              {selectedEpisode && (
                <p className="text-sm text-gray-300">
                  {selectedSeason?.title} • Tập {selectedEpisode.episodeNumber}
                </p>
              )}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-6 text-white">
              {skipIntroVisible && (
                <button onClick={() => seekBy(INTRO_END_SECONDS - currentTime)} className="rounded border border-white/40 bg-black/60 px-4 py-1.5 text-sm font-semibold hover:bg-white hover:text-black transition">
                  Bỏ qua đoạn giới thiệu
                </button>
              )}

              {hasNextEpisode && (
                <button onClick={goToNextEpisode} className="hover:scale-110 transition-transform" title="Tập tiếp theo">
                  <SkipForward className="h-7 w-7 fill-white" />
                </button>
              )}
              
              {/* Speed Menu */}
              <div className="relative">
                <button onClick={() => { setShowSpeedMenu(!showSpeedMenu); setShowEpisodesMenu(false); setShowSubtitleMenu(false); }} className="hover:scale-110 transition-transform">
                  <Gauge className="h-7 w-7" />
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-16 right-0 w-[480px] bg-[#232323] p-6 shadow-2xl z-50 rounded-sm">
                    <h3 className="mb-10 text-2xl font-medium text-white">Tốc độ phát lại</h3>
                    
                    <div className="relative flex items-center justify-between px-4">
                      {/* Horizontal Line connecting dots */}
                      <div className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 bg-gray-500 z-0"></div>
                      
                      {/* Dots and Labels */}
                      {[0.5, 0.75, 1, 1.25, 1.5].map((rate) => {
                        const isActive = playbackRate === rate;
                        return (
                          <div key={rate} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => handlePlaybackRateChange(rate)}>
                            {/* Dot Container */}
                            <div className="flex h-8 w-8 items-center justify-center">
                              {isActive ? (
                                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border-[3px] border-gray-400 bg-[#232323]">
                                  <div className="h-3.5 w-3.5 rounded-full bg-white"></div>
                                </div>
                              ) : (
                                <div className="h-3.5 w-3.5 rounded-full bg-gray-300 group-hover:scale-125 transition-transform"></div>
                              )}
                            </div>
                            
                            {/* Label */}
                            <div className={`absolute top-10 w-28 text-center text-xl tracking-wide ${isActive ? 'text-white font-medium' : 'text-gray-300 hover:text-white transition-colors'}`}>
                              {rate === 1 ? (
                                <div className="leading-snug">
                                  1x (Bình<br/>thường)
                                </div>
                              ) : (
                                `${rate}x`
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {/* Add bottom padding to account for absolute labels */}
                    <div className="h-16"></div>
                  </div>
                )}
              </div>

              {/* Episodes List Menu */}
              {seasons.length > 0 && !(seasons.length === 1 && seasons[0].episodes.length === 1) && (
                <div className="relative">
                  <button onClick={() => { setShowEpisodesMenu(!showEpisodesMenu); setShowSpeedMenu(false); setShowSubtitleMenu(false); }} className="hover:scale-110 transition-transform">
                    <Layers className="h-7 w-7" />
                  </button>
                  {showEpisodesMenu && (
                    <div className="absolute bottom-12 right-0 w-72 max-h-[60vh] overflow-y-auto rounded bg-zinc-900/95 shadow-lg border border-white/10 custom-scrollbar flex flex-col z-50">
                      <h3 className="sticky top-0 bg-zinc-900/95 p-4 text-base font-semibold border-b border-gray-700 z-10">Danh sách tập</h3>
                      <div className="p-2">
                        {seasons.map((season, sIndex) =>
                          season.episodes.map((episode, eIndex) => {
                            const active = sIndex === seasonIndex && eIndex === episodeIndex;
                            return (
                              <button
                                key={`${season.id}-${episode.id}`}
                                onClick={() => {
                                  clearAutoNext();
                                  pendingResumeRef.current = 0;
                                  setSeasonIndex(sIndex);
                                  setEpisodeIndex(eIndex);
                                  setShowEpisodesMenu(false);
                                }}
                                className={`w-full flex flex-col text-left p-3 rounded mb-1 transition ${active ? 'bg-white/20 font-bold border-l-4 border-red-600' : 'hover:bg-white/10'}`}
                              >
                                <span className="text-sm">Tập {episode.episodeNumber}: {episode.title}</span>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Subtitles Menu */}
              <div className="relative">
                <button onClick={() => { setShowSubtitleMenu(!showSubtitleMenu); setShowEpisodesMenu(false); setShowSpeedMenu(false); }} className="hover:scale-110 transition-transform">
                  <MessageSquare className="h-7 w-7" />
                </button>
                {showSubtitleMenu && (
                  <div className="absolute bottom-12 right-0 w-48 rounded bg-zinc-900/95 p-4 shadow-lg border border-white/10 z-50">
                    <h3 className="mb-3 text-base font-semibold text-center border-b border-gray-700 pb-2">Phụ đề</h3>
                    <div className="flex flex-col">
                      {subtitleOptions.map((option) => (
                        <button key={option.value} onClick={() => { setSubtitleLang(option.value); setShowSubtitleMenu(false); }} className={`py-1.5 text-left hover:text-white transition ${subtitleLang === option.value ? 'text-white font-bold text-lg' : 'text-gray-400 text-sm'}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform ml-2">
                {isFullscreen ? <Minimize className="h-7 w-7" /> : <Maximize className="h-7 w-7" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Click Effect Overlay */}
      {clickEffect && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none rounded-full bg-black/60 p-6 animate-pulse transition-transform scale-150 duration-500">
          {clickEffect === 'play' ? (
            <Play className="h-20 w-20 fill-white text-white opacity-80" />
          ) : (
            <Pause className="h-20 w-20 fill-white text-white opacity-80" />
          )}
        </div>
      )}
    </main>
  );
};

export default Watch;
