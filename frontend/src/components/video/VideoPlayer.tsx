'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Loader2,
  Settings, CheckCircle, XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LectureQuestion } from '@/types';

interface QualityLevel {
  idx: number;
  label: string;
}

interface VideoPlayerProps {
  src: string;
  title?: string;
  onProgress?: (seconds: number) => void;
  onComplete?: () => void;
  initialTime?: number;
  questions?: LectureQuestion[];
}

export default function VideoPlayer({
  src,
  title,
  onProgress,
  onComplete,
  initialTime = 0,
  questions = [],
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const completedRef = useRef(false);

  // Quality
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [selectedLevel, setSelectedLevel] = useState(-1);
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  // Questions — use refs so timeupdate handler always sees latest values
  const prevTimeRef = useRef(0);
  const answeredQuestionsRef = useRef<Set<string>>(new Set());
  const activeQuestionRef = useRef<LectureQuestion | null>(null);
  const questionsRef = useRef<LectureQuestion[]>(questions);
  questionsRef.current = questions;
  const [activeQuestion, setActiveQuestion] = useState<LectureQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Reset question + quality state when lecture changes
    answeredQuestionsRef.current = new Set();
    activeQuestionRef.current = null;
    prevTimeRef.current = 0;
    completedRef.current = false;
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    setQualityLevels([]);
    setSelectedLevel(-1);
    setIsLoading(true);

    const setupHls = () => {
      if (Hls.isSupported()) {
        const apiBase = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1';
        const apiOrigin = apiBase.replace(/\/api\/v1\/?$/, '');

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          xhrSetup: (xhr: XMLHttpRequest, url: string) => {
            if (url.startsWith(apiOrigin) || url.startsWith('/')) {
              const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
              if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            }
          },
        });
        hlsRef.current = hls;
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          if (initialTime > 0) video.currentTime = initialTime;
          setIsLoading(false);
          const levels: QualityLevel[] = data.levels.map((level, idx) => ({
            idx,
            label: level.height ? `${level.height}p` : `Level ${idx + 1}`,
          }));
          setQualityLevels(levels);
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) console.error('HLS fatal error', data);
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        video.currentTime = initialTime;
        setIsLoading(false);
      }
    };

    setupHls();

    return () => {
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, [src, initialTime]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      const curr = video.currentTime;
      const prev = prevTimeRef.current;
      prevTimeRef.current = curr;

      setCurrentTime(curr);
      onProgress?.(Math.floor(curr));

      // Fire onComplete when 90% of video is watched
      if (!completedRef.current && video.duration > 0 && curr / video.duration >= 0.9) {
        completedRef.current = true;
        onComplete?.();
      }

      // Question detection: pause when crossing a question's showAtSecond threshold
      if (!activeQuestionRef.current && questionsRef.current.length > 0) {
        const triggered = questionsRef.current.find(
          (q) => !answeredQuestionsRef.current.has(q.id) && prev < q.showAtSecond && curr >= q.showAtSecond,
        );
        if (triggered) {
          video.pause();
          activeQuestionRef.current = triggered;
          setActiveQuestion(triggered);
          setSelectedAnswer(null);
          setShowResult(false);
        }
      }
    };

    const onDurationChange = () => setDuration(video.duration);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, [onProgress, onComplete]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play();
    else video.pause();
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) videoRef.current.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = val;
    setCurrentTime(val);
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) document.exitFullscreen();
    else video.requestFullscreen();
  };

  const handleQualityChange = (levelIdx: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = levelIdx; // -1 = Auto ABR
      setSelectedLevel(levelIdx);
    }
    setShowQualityMenu(false);
  };

  const handleAnswerSelect = (answerIdx: number) => {
    setSelectedAnswer(answerIdx);
    setShowResult(true);
  };

  const handleContinue = () => {
    if (!activeQuestion) return;
    answeredQuestionsRef.current.add(activeQuestion.id);
    activeQuestionRef.current = null;
    setActiveQuestion(null);
    setSelectedAnswer(null);
    setShowResult(false);
    videoRef.current?.play();
  };

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const resetControlsTimer = () => {
    setShowControls(true);
    clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => {
      if (isPlaying && !showQualityMenu) setShowControls(false);
    }, 3000);
  };

  const currentQualityLabel =
    selectedLevel === -1
      ? 'Auto'
      : (qualityLevels.find((l) => l.idx === selectedLevel)?.label ?? 'Auto');

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-lg overflow-hidden group select-none"
      onMouseMove={resetControlsTimer}
      onMouseLeave={() => isPlaying && !showQualityMenu && setShowControls(false)}
    >
      {title && (
        <div className={cn(
          'absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent px-4 py-3 z-10 transition-opacity duration-300',
          showControls && !activeQuestion ? 'opacity-100' : 'opacity-0',
        )}>
          <p className="text-white text-sm font-medium truncate">{title}</p>
        </div>
      )}

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full aspect-video cursor-pointer"
        onClick={togglePlay}
        playsInline
      />

      {/* Loading spinner */}
      {isLoading && !activeQuestion && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="w-10 h-10 text-white animate-spin" />
        </div>
      )}

      {/* ─── Question overlay ──────────────────────────────────────────────── */}
      {activeQuestion && (
        <div className="absolute inset-0 bg-black/80 z-30 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <p className="text-white font-semibold text-base mb-4 leading-snug">
              {activeQuestion.question}
            </p>
            <div className="space-y-2 mb-4">
              {activeQuestion.options.map((opt, i) => {
                const isCorrect = i === activeQuestion.correctIndex;
                const isChosen = i === selectedAnswer;
                return (
                  <button
                    key={i}
                    onClick={() => !showResult && handleAnswerSelect(i)}
                    disabled={showResult}
                    className={cn(
                      'w-full text-left px-4 py-2.5 rounded-lg text-sm border transition-colors',
                      !showResult &&
                        'text-gray-200 bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-gray-500',
                      showResult && isCorrect &&
                        'bg-green-900/50 border-green-500 text-green-300',
                      showResult && isChosen && !isCorrect &&
                        'bg-red-900/50 border-red-500 text-red-300',
                      showResult && !isCorrect && !isChosen &&
                        'text-gray-500 bg-gray-800/60 border-gray-700',
                    )}
                  >
                    <span className="font-mono text-xs mr-2.5 opacity-60">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
            {showResult && (
              <>
                <div className={cn(
                  'flex items-center gap-2 text-sm mb-3',
                  selectedAnswer === activeQuestion.correctIndex ? 'text-green-400' : 'text-red-400',
                )}>
                  {selectedAnswer === activeQuestion.correctIndex ? (
                    <><CheckCircle className="w-4 h-4 shrink-0" /> Correct!</>
                  ) : (
                    <><XCircle className="w-4 h-4 shrink-0" /> Incorrect — correct answer: <strong>{activeQuestion.options[activeQuestion.correctIndex]}</strong></>
                  )}
                </div>
                {activeQuestion.explanation && (
                  <p className="text-gray-400 text-xs mb-4 leading-relaxed">{activeQuestion.explanation}</p>
                )}
                <button
                  onClick={handleContinue}
                  className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-lg py-2.5 text-sm font-medium transition-colors"
                >
                  Continue watching
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ─── Controls ─────────────────────────────────────────────────────── */}
      <div className={cn(
        'absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 z-10 transition-opacity duration-300',
        showControls && !activeQuestion ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
      )}>
        {/* Progress bar */}
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1 mb-3 accent-primary-500 cursor-pointer"
        />

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
            </button>
            <button onClick={toggleMute} className="text-white hover:text-primary-400 transition-colors">
              {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 h-1 accent-primary-500 cursor-pointer"
            />
            <span className="text-white text-xs tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Quality selector — only shown when HLS levels are available */}
            {qualityLevels.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => setShowQualityMenu((p) => !p)}
                  className="flex items-center gap-1 text-white hover:text-primary-400 transition-colors"
                  title="Video quality"
                >
                  <Settings className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline">{currentQualityLabel}</span>
                </button>
                {showQualityMenu && (
                  <div className="absolute bottom-full right-0 mb-2 bg-gray-900 border border-gray-600 rounded-lg overflow-hidden min-w-[90px] z-20 shadow-xl">
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className={cn(
                        'w-full px-4 py-2 text-xs text-left hover:bg-gray-700 transition-colors',
                        selectedLevel === -1 ? 'text-primary-400 font-semibold' : 'text-gray-200',
                      )}
                    >
                      Auto {selectedLevel === -1 && '✓'}
                    </button>
                    {[...qualityLevels].reverse().map((ql) => (
                      <button
                        key={ql.idx}
                        onClick={() => handleQualityChange(ql.idx)}
                        className={cn(
                          'w-full px-4 py-2 text-xs text-left hover:bg-gray-700 transition-colors',
                          selectedLevel === ql.idx ? 'text-primary-400 font-semibold' : 'text-gray-200',
                        )}
                      >
                        {ql.label} {selectedLevel === ql.idx && '✓'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={handleFullscreen} className="text-white hover:text-primary-400 transition-colors">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
