'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import VideoPlayer from '@/components/video/VideoPlayer';
import { courseApi, lectureApi, progressApi, lectureRatingApi } from '@/lib/api';
import { Course, Lecture, LectureResource } from '@/types';
import { CheckCircle2, ChevronDown, PlayCircle, Menu, X, Paperclip, Link2, ChevronLeft, ChevronRight, FileText, Loader2, Star, Smartphone } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [activeLecture, setActiveLecture] = useState<Lecture | null>(null);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [courseProgress, setCourseProgress] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoadingLecture, setIsLoadingLecture] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'transcript'>('description');

  // Transcript polling
  const [transcriptStatus, setTranscriptStatus] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState<string | null>(null);
  const transcriptPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lecture rating state
  const [myRating, setMyRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [ratingLoading, setRatingLoading] = useState(false);

  // Mobile detection (UA + screen width)
  const [isMobile, setIsMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const check = () => {
      const ua = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const narrow = window.innerWidth < 768;
      setIsMobile(ua || narrow);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Flat list of all lectures for prev/next navigation
  const allLectures = course?.sections?.flatMap((s) => s.lectures) ?? [];
  const activeIndex = allLectures.findIndex((l) => l.id === activeLecture?.id);
  const prevLecture = activeIndex > 0 ? allLectures[activeIndex - 1] : null;
  const nextLecture = activeIndex >= 0 && activeIndex < allLectures.length - 1 ? allLectures[activeIndex + 1] : null;

  useEffect(() => {
    loadCourse();
  }, [slug]);

  const loadCourse = async () => {
    try {
      const { data } = await courseApi.getBySlug(slug);
      const courseData: Course = data.data;
      setCourse(courseData);

      // Load progress
      const { data: progressData } = await progressApi.getCourse(courseData.id);
      const { completedLectures: completedLectureIds, percentage } = progressData.data;
      setCompletedIds(new Set(completedLectureIds));
      setCourseProgress(percentage);

      // Auto-select first incomplete lecture
      for (const section of courseData.sections ?? []) {
        for (const lecture of section.lectures) {
          if (!completedLectureIds.includes(lecture.id)) {
            await selectLecture(lecture.id);
            return;
          }
        }
      }

      // All complete → select first lecture
      const firstLecture = courseData.sections?.[0]?.lectures?.[0];
      if (firstLecture) await selectLecture(firstLecture.id);
    } catch {
      toast.error('Failed to load course. Make sure you are enrolled.');
      router.push(`/courses/${slug}`);
    }
  };

  const selectLecture = async (lectureId: string) => {
    setIsLoadingLecture(true);
    // Clear transcript state for new lecture
    setTranscriptStatus(null);
    setTranscriptText(null);
    setActiveTab('description');
    setMyRating(0);
    setHoverRating(0);
    if (transcriptPollRef.current) clearInterval(transcriptPollRef.current);
    try {
      const [lectureRes, ratingRes] = await Promise.allSettled([
        lectureApi.get(lectureId),
        lectureRatingApi.getMyRating(lectureId),
      ]);
      if (lectureRes.status === 'fulfilled') setActiveLecture(lectureRes.value.data.data);
      if (ratingRes.status === 'fulfilled') setMyRating(ratingRes.value.data.data?.rating ?? 0);
    } catch {
      toast.error('Could not load lecture');
    } finally {
      setIsLoadingLecture(false);
    }
  };

  // Fetch transcript when transcript tab is clicked
  const loadTranscript = async (lectureId: string) => {
    try {
      const { data } = await lectureApi.getTranscript(lectureId);
      const { status, transcript } = data.data;
      setTranscriptStatus(status);
      if (transcript) setTranscriptText(transcript);

      // Poll every 20 s while job is in progress
      if (status === 'IN_PROGRESS') {
        if (transcriptPollRef.current) clearInterval(transcriptPollRef.current);
        transcriptPollRef.current = setInterval(async () => {
          try {
            const { data: pollData } = await lectureApi.getTranscript(lectureId);
            setTranscriptStatus(pollData.data.status);
            if (pollData.data.transcript) {
              setTranscriptText(pollData.data.transcript);
            }
            if (pollData.data.status !== 'IN_PROGRESS') {
              clearInterval(transcriptPollRef.current!);
            }
          } catch { /* ignore poll errors */ }
        }, 20000);
      }
    } catch {
      setTranscriptStatus('FAILED');
    }
  };

  const handleRateLecture = async (rating: number) => {
    if (!activeLecture || ratingLoading) return;
    setRatingLoading(true);
    try {
      await lectureRatingApi.rate(activeLecture.id, rating);
      setMyRating(rating);
      toast.success('Rating saved!');
    } catch {
      toast.error('Failed to save rating');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleProgress = async (watchedSeconds: number) => {
    if (!activeLecture) return;
    await progressApi.update(activeLecture.id, { watchedSeconds }).catch(() => {});
  };

  const handleComplete = async () => {
    if (!activeLecture || completedIds.has(activeLecture.id)) return;
    try {
      await progressApi.update(activeLecture.id, { completed: true });
      setCompletedIds((prev) => new Set([...prev, activeLecture.id]));

      const totalLectures = course?.sections?.reduce((s, sec) => s + sec.lectures.length, 0) ?? 0;
      const newCount = completedIds.size + 1;
      const newPercentage = totalLectures > 0 ? Math.round((newCount / totalLectures) * 100) : 0;
      setCourseProgress(newPercentage);

      toast.success('Lecture completed! 🎉');
    } catch {
      // silent
    }
  };

  if (!course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="w-10 h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Mobile-only gate: block desktop access if course requires mobile
  if (course.mobileOnly && isMobile === false) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 mx-auto bg-primary-900/50 rounded-full flex items-center justify-center mb-6">
            <Smartphone className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Mobile Access Only</h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-6">
            This course is configured for <span className="text-white font-medium">mobile devices only</span>.
            Please open it on your smartphone or tablet to continue learning.
          </p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Top bar */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center gap-4 shrink-0">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white text-sm"
        >
          ← Back
        </button>
        <h1 className="text-white font-semibold text-sm truncate flex-1">{course.title}</h1>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <div className="w-32 h-2 bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${courseProgress}%` }}
            />
          </div>
          <span>{courseProgress}% complete</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-gray-400 hover:text-white"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Video area */}
        <div className={cn('flex-1 flex flex-col overflow-auto', sidebarOpen ? 'lg:mr-80' : '')}>
          <div className="p-4 md:p-6 flex-1">
            {activeLecture?.videoUrl ? (
              <VideoPlayer
                src={activeLecture.videoUrl}
                title={activeLecture.title}
                onProgress={handleProgress}
                onComplete={handleComplete}
                questions={activeLecture.questions ?? []}
              />
            ) : isLoadingLecture ? (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="aspect-video bg-gray-800 rounded-lg flex items-center justify-center text-gray-400">
                Select a lecture to start watching
              </div>
            )}

            {activeLecture && (
              <div className="mt-6 text-white">
                <h2 className="text-xl font-bold mb-2">{activeLecture.title}</h2>

                {/* Tabs: Description | Transcript */}
                <div className="flex border-b border-gray-700 mb-4">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={cn(
                      'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                      activeTab === 'description'
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200',
                    )}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab('transcript');
                      if (!transcriptStatus && activeLecture) loadTranscript(activeLecture.id);
                    }}
                    className={cn(
                      'flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                      activeTab === 'transcript'
                        ? 'border-primary-500 text-primary-400'
                        : 'border-transparent text-gray-400 hover:text-gray-200',
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Transcript
                  </button>
                </div>

                {activeTab === 'description' ? (
                  <>
                    {activeLecture.description && (
                      <p className="text-gray-300 text-sm leading-relaxed">{activeLecture.description}</p>
                    )}
                  </>
                ) : (
                  <div className="min-h-[80px]">
                    {transcriptStatus === null || transcriptStatus === 'IN_PROGRESS' ? (
                      <div className="flex items-center gap-2 text-gray-400 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {transcriptStatus === 'IN_PROGRESS'
                          ? 'Generating transcript… this can take a few minutes.'
                          : 'Loading transcript…'}
                      </div>
                    ) : transcriptStatus === 'COMPLETED' && transcriptText ? (
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {transcriptText}
                      </p>
                    ) : transcriptStatus === 'NO_VIDEO' ? (
                      <p className="text-gray-500 text-sm">No video uploaded for this lecture yet.</p>
                    ) : (
                      <p className="text-gray-500 text-sm">Transcript not available for this lecture.</p>
                    )}
                  </div>
                )}

                {!completedIds.has(activeLecture.id) && (
                  <button
                    onClick={handleComplete}
                    className="mt-4 flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Mark as completed
                  </button>
                )}
                {completedIds.has(activeLecture.id) && (
                  <div className="mt-4 flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle2 className="w-5 h-5" />
                    Completed
                  </div>
                )}

                {/* Star Rating Widget */}
                <div className="mt-5 pt-5 border-t border-gray-700">
                  <p className="text-sm text-gray-300 font-medium mb-2">Rate this lecture</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        disabled={ratingLoading}
                        onClick={() => handleRateLecture(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="transition-transform hover:scale-110 disabled:cursor-not-allowed"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={cn(
                            'w-6 h-6 transition-colors',
                            (hoverRating || myRating) >= star
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600',
                          )}
                        />
                      </button>
                    ))}
                    {myRating > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        You rated this {myRating}/5
                      </span>
                    )}
                    {ratingLoading && <Loader2 className="w-4 h-4 ml-2 text-gray-400 animate-spin" />}
                  </div>
                </div>

                {/* Prev / Next navigation */}
                <div className="mt-6 flex items-center justify-between gap-4">
                  <button
                    onClick={() => prevLecture && selectLecture(prevLecture.id)}
                    disabled={!prevLecture}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={() => nextLecture && selectLecture(nextLecture.id)}
                    disabled={!nextLecture}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Resources / Attachments */}
                {(activeLecture.resources ?? []).length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-300 mb-3">Resources</h3>
                    <ul className="space-y-2">
                      {(activeLecture.resources as LectureResource[]).map((r) => (
                        <li key={r.url}>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary-400 hover:text-primary-300 bg-gray-800 rounded-lg px-4 py-2.5 transition-colors"
                          >
                            {r.type === 'link' ? (
                              <Link2 className="w-4 h-4 shrink-0" />
                            ) : (
                              <Paperclip className="w-4 h-4 shrink-0" />
                            )}
                            <span className="truncate">{r.title}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Curriculum Sidebar */}
        {sidebarOpen && (
          <>
            {/* Mobile overlay backdrop */}
            <div
              className="lg:hidden fixed inset-0 bg-black/60 z-20"
              onClick={() => setSidebarOpen(false)}
            />
            <aside className="flex flex-col w-80 bg-gray-800 border-l border-gray-700 fixed right-0 top-14 bottom-0 overflow-y-auto z-30">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Course Content</h2>
                <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-white lg:hidden">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {course.sections?.map((section) => (
                  <details key={section.id} open className="group">
                    <summary className="flex items-center justify-between px-4 py-3 bg-gray-700/50 cursor-pointer select-none">
                      <span className="text-gray-200 text-xs font-semibold truncate">{section.title}</span>
                      <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform shrink-0" />
                    </summary>
                    <div>
                      {section.lectures.map((lecture) => {
                        const isActive = activeLecture?.id === lecture.id;
                        const isDone = completedIds.has(lecture.id);
                        return (
                          <button
                            key={lecture.id}
                            onClick={() => { selectLecture(lecture.id); if (window.innerWidth < 1024) setSidebarOpen(false); }}
                            className={cn(
                              'w-full text-left flex items-start gap-3 px-4 py-3 text-xs transition-colors border-l-2',
                              isActive
                                ? 'bg-primary-900/50 border-primary-500 text-white'
                                : 'border-transparent text-gray-300 hover:bg-gray-700/50',
                            )}
                          >
                            <div className="mt-0.5 shrink-0">
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-green-400" />
                              ) : (
                                <PlayCircle className={cn('w-4 h-4', isActive ? 'text-primary-400' : 'text-gray-500')} />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="line-clamp-2">{lecture.title}</p>
                              {lecture.duration && (
                                <p className="text-gray-500 mt-0.5">{formatDuration(lecture.duration)}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </details>
                ))}
              </div>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
