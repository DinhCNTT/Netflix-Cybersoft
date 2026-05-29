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
    if (!selectedEpisode?.subtitleUrl || subtitleLang === "off") {
      return null;
    }

    return {
      src: selectedEpisode.subtitleUrl,
      label: subtitleLang === "vi" ? "Tieng Viet" : "English",
      lang: subtitleLang,
    };
  }, [selectedEpisode?.subtitleUrl, subtitleLang]);

  const subtitleOptions = useMemo(() => {
    const options = [{ value: "off", label: "CC Off" }];
    if (selectedEpisode?.subtitleUrl) {
      options.push({ value: "vi", label: "Tieng Viet" });
      options.push({ value: "en", label: "English" });
    }

    return options;
  }, [selectedEpisode?.subtitleUrl]);

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
      >
        <div className="absolute left-0 right-0 top-0 bg-gradient-to-b from-black/85 to-transparent p-6">
          <button
            type="button"
            onClick={() => navigate("/browse")}
            className="inline-flex items-center gap-2 rounded bg-black/50 px-4 py-2 text-sm hover:bg-black/70"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="mt-4 text-xl font-bold md:text-2xl">
            {movie?.title || "Now Playing"}
          </h1>
          {selectedEpisode && (
            <p className="mt-1 text-sm text-gray-300">
              {selectedSeason?.title} • Tap {selectedEpisode.episodeNumber}:{" "}
              {selectedEpisode.title}
            </p>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/70 to-transparent p-6 md:p-8">
          <div className="mb-4 flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="rounded-full bg-white p-3 text-black hover:bg-gray-200"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-black" />
              ) : (
                <Play className="h-5 w-5 fill-black" />
              )}
            </button>

            <button
              type="button"
              onClick={() => seekBy(-10)}
              className="rounded-full bg-white/10 p-3 hover:bg-white/20"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => seekBy(10)}
              className="rounded-full bg-white/10 p-3 hover:bg-white/20"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            <div className="ml-2 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
              />
            </div>

            <div className="ml-auto flex items-center gap-2 text-sm">
              <label className="text-gray-300">CC</label>
              <select
                value={subtitleLang}
                onChange={(event) => setSubtitleLang(event.target.value)}
                className="rounded bg-black/60 px-2 py-1"
              >
                {subtitleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              <label className="ml-2 text-gray-300">Quality</label>
              <select
                value={selectedQuality}
                onChange={handleQualityChange}
                className="rounded bg-black/60 px-2 py-1"
              >
                {qualities.map((quality) => (
                  <option key={quality.value} value={quality.value}>
                    {quality.label}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-full bg-white/10 p-2 hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="mb-2 flex items-center gap-2 text-xs text-gray-200 md:text-sm">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={Number.isFinite(progressPercent) ? progressPercent : 0}
              onChange={handleProgressChange}
              className="w-full accent-red-600"
            />
            <span>{formatTime(duration)}</span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            {skipIntroVisible && (
              <button
                type="button"
                onClick={() => seekBy(INTRO_END_SECONDS - currentTime)}
                className="rounded bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-gray-200"
              >
                Skip Intro
              </button>
            )}

            {hasNextEpisode && (
              <button
                type="button"
                onClick={goToNextEpisode}
                className="rounded bg-white/15 px-4 py-2 text-sm font-semibold hover:bg-white/25"
              >
                Next Episode
              </button>
            )}

            {autoNextCountdown !== null && (
              <p className="text-sm text-gray-200">
                Tu dong chuyen tap sau sau {autoNextCountdown}s
              </p>
            )}
          </div>

          {seasons.length > 0 && !(seasons.length === 1 && seasons[0].episodes.length === 1) && (
            <div className="mt-5 grid gap-2 md:grid-cols-2 lg:grid-cols-3">
              {seasons.map((season, sIndex) =>
                season.episodes.map((episode, eIndex) => {
                  const active =
                    sIndex === seasonIndex && eIndex === episodeIndex;
                  return (
                    <button
                      type="button"
                      key={`${season.id}-${episode.id}`}
                      onClick={() => {
                        clearAutoNext();
                        pendingResumeRef.current = 0;
                        setSeasonIndex(sIndex);
                        setEpisodeIndex(eIndex);
                      }}
                      className={`rounded border px-3 py-2 text-left text-sm transition ${
                        active
                          ? "border-red-500 bg-red-950/50"
                          : "border-white/20 bg-black/30 hover:border-white/50"
                      }`}
                    >
                      <div className="font-semibold">
                        {season.title} • Tập {episode.episodeNumber}
                      </div>
                      <div className="text-xs text-gray-300">
                        {episode.title}
                      </div>
                    </button>
                  );
                }),
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Watch;
