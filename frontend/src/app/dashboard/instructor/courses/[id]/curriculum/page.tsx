'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { courseApi, lectureApi } from '@/lib/api';
import { Course, Section, Lecture, LectureResource, LectureQuestion } from '@/types';
import {
  Plus, Trash2, Upload, ChevronDown, Loader2, Check,
  Video, Link2, Paperclip, X, HelpCircle, ImagePlus, Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CurriculumPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [addingSection, setAddingSection] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [addingLectureFor, setAddingLectureFor] = useState<string | null>(null);
  const [newLectureTitle, setNewLectureTitle] = useState('');
  const [uploadingLectureId, setUploadingLectureId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadPhase, setUploadPhase] = useState<'uploading' | 'processing'>('uploading');
  // Resources panel state: key = lectureId
  const [resourcePanelOpen, setResourcePanelOpen] = useState<string | null>(null);
  const [linkTitle, setLinkTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [uploadingAttachmentFor, setUploadingAttachmentFor] = useState<string | null>(null);

  // Questions panel state
  const [questionPanelOpen, setQuestionPanelOpen] = useState<string | null>(null);
  const [qShowAtSecond, setQShowAtSecond] = useState('');
  const [qQuestion, setQQuestion] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrectIndex, setQCorrectIndex] = useState(0);
  const [qExplanation, setQExplanation] = useState('');
  const [addingQuestion, setAddingQuestion] = useState(false);

  // Thumbnail upload state
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement | null>(null);

  // Background-processing lectures: poll until videoProcessing becomes false
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start polling whenever any lecture has videoProcessing: true
  useEffect(() => {
    const hasProcessing = course?.sections?.some((s) =>
      s.lectures.some((l) => l.videoProcessing),
    );
    if (!hasProcessing) {
      if (pollingRef.current) clearInterval(pollingRef.current);
      return;
    }
    // Already polling
    if (pollingRef.current) return;

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await courseApi.getById(id);
        const updated: Course = data.data;
        const stillProcessing = updated.sections?.some((s) =>
          s.lectures.some((l) => l.videoProcessing),
        );
        setCourse(updated);
        if (!stillProcessing) {
          clearInterval(pollingRef.current!);
          pollingRef.current = null;
          toast.success('Video processing complete! 🎉');
        }
      } catch { /* ignore poll errors */ }
    }, 8000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course?.sections]);

  const reload = async () => {
    try {
      const { data } = await courseApi.getById(id);
      setCourse(data.data);
      const allIds = new Set<string>(data.data.sections?.map((s: Section) => s.id) ?? []);
      setExpandedSections(allIds);
    } catch {
      toast.error('Failed to load course');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { reload(); }, [id]);

  const handleAddSection = async () => {
    if (!newSectionTitle.trim()) return;
    try {
      await courseApi.createSection(id, { title: newSectionTitle });
      setNewSectionTitle('');
      setAddingSection(false);
      await reload();
      toast.success('Section added');
    } catch {
      toast.error('Failed to add section');
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('Delete this section and all its lectures?')) return;
    try {
      await courseApi.deleteSection(id, sectionId);
      await reload();
      toast.success('Section deleted');
    } catch {
      toast.error('Failed to delete section');
    }
  };

  const handleAddLecture = async (sectionId: string) => {
    if (!newLectureTitle.trim()) return;
    try {
      await lectureApi.create(id, sectionId, { title: newLectureTitle, isFree: false });
      setNewLectureTitle('');
      setAddingLectureFor(null);
      await reload();
      toast.success('Lecture added');
    } catch {
      toast.error('Failed to add lecture');
    }
  };

  const handleDeleteLecture = async (sectionId: string, lectureId: string) => {
    if (!confirm('Delete this lecture?')) return;
    try {
      await lectureApi.delete(id, sectionId, lectureId);
      await reload();
      toast.success('Lecture deleted');
    } catch {
      toast.error('Failed to delete lecture');
    }
  };

  const handleVideoUpload = async (sectionId: string, lectureId: string, file: File) => {
    setUploadingLectureId(lectureId);
    setUploadProgress(0);
    setUploadPhase('uploading');
    try {
      await lectureApi.uploadVideo(id, sectionId, lectureId, file, (progress) => {
        setUploadProgress(progress);
        if (progress >= 100) setUploadPhase('processing');
      });
      // Backend responds as soon as raw video hits S3 (before ffmpeg).
      // Reload to get the updated lecture state — videoProcessing: true will be set.
      await reload();
      toast.success('Video uploaded! Converting in background…');
    } catch {
      toast.error('Video upload failed');
    } finally {
      setUploadingLectureId(null);
      setUploadProgress(0);
      setUploadPhase('uploading');
    }
  };

  const handleAddLink = async (sectionId: string, lecture: Lecture) => {
    if (!linkTitle.trim() || !linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
    const existing: LectureResource[] = (lecture.resources as LectureResource[]) ?? [];
    try {
      await lectureApi.update(id, sectionId, lecture.id, {
        resources: [...existing, { type: 'link', title: linkTitle.trim(), url }],
      });
      setLinkTitle('');
      setLinkUrl('');
      await reload();
      toast.success('Link added');
    } catch {
      toast.error('Failed to add link');
    }
  };

  const handleUploadAttachment = async (sectionId: string, lectureId: string, file: File) => {
    setUploadingAttachmentFor(lectureId);
    try {
      await lectureApi.uploadAttachment(id, sectionId, lectureId, file);
      await reload();
      toast.success('Attachment uploaded');
    } catch {
      toast.error('Failed to upload attachment');
    } finally {
      setUploadingAttachmentFor(null);
    }
  };

  const handleDeleteResource = async (sectionId: string, lectureId: string, url: string) => {
    try {
      await lectureApi.deleteResource(id, sectionId, lectureId, url);
      await reload();
      toast.success('Resource removed');
    } catch {
      toast.error('Failed to remove resource');
    }
  };

  const resetQuestionForm = () => {
    setQShowAtSecond('');
    setQQuestion('');
    setQOptions(['', '', '', '']);
    setQCorrectIndex(0);
    setQExplanation('');
  };

  const handleAddQuestion = async (sectionId: string, lectureId: string) => {
    if (!qQuestion.trim() || qOptions.filter((o) => o.trim()).length < 2) {
      toast.error('Enter a question and at least 2 options');
      return;
    }
    setAddingQuestion(true);
    try {
      await lectureApi.addQuestion(id, sectionId, lectureId, {
        question: qQuestion.trim(),
        options: qOptions.map((o) => o.trim()).filter(Boolean),
        correctIndex: qCorrectIndex,
        showAtSecond: Number(qShowAtSecond) || 0,
        explanation: qExplanation.trim() || undefined,
      });
      resetQuestionForm();
      await reload();
      toast.success('Question added');
    } catch {
      toast.error('Failed to add question');
    } finally {
      setAddingQuestion(false);
    }
  };

  const handleDeleteQuestion = async (sectionId: string, lectureId: string, questionId: string) => {
    try {
      await lectureApi.deleteQuestion(id, sectionId, lectureId, questionId);
      await reload();
      toast.success('Question removed');
    } catch {
      toast.error('Failed to remove question');
    }
  };

  const handleThumbnailUpload = async (file: File) => {
    setUploadingThumbnail(true);
    try {
      await courseApi.uploadThumbnail(id, file);
      await reload();
      toast.success('Thumbnail updated!');
    } catch {
      toast.error('Failed to upload thumbnail');
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const handleToggleMobileOnly = async () => {
    if (!course) return;
    try {
      await courseApi.update(id, { mobileOnly: !course.mobileOnly });
      await reload();
      toast.success(course.mobileOnly ? 'Course is now accessible on all devices' : 'Course set to mobile-only access');
    } catch {
      toast.error('Failed to update access setting');
    }
  };

  const handlePublishCourse = async () => {
    try {
      await courseApi.publish(id);
      await reload();
      toast.success('Course published!');
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Failed to publish';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
          <p className="text-gray-500 text-sm mt-1">Manage course curriculum</p>
        </div>
        {course.status !== 'PUBLISHED' && (
          <button onClick={handlePublishCourse} className="btn-primary flex items-center gap-2">
            <Check className="w-4 h-4" />
            Publish Course
          </button>
        )}
      </div>

      {/* Thumbnail upload */}
      <div className="card p-4 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-primary-500" />
          Course Thumbnail
        </h2>
        <div className="flex items-center gap-5">
          {course.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={course.thumbnail}
              alt="Course thumbnail"
              className="w-32 h-20 object-cover rounded-lg border border-gray-200"
            />
          ) : (
            <div className="w-32 h-20 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
              <ImagePlus className="w-6 h-6" />
            </div>
          )}
          <div>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleThumbnailUpload(file);
                e.target.value = '';
              }}
            />
            <button
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={uploadingThumbnail}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              {uploadingThumbnail ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploadingThumbnail ? 'Uploading…' : course.thumbnail ? 'Change Thumbnail' : 'Upload Thumbnail'}
            </button>
            <p className="text-xs text-gray-400 mt-1.5">Recommended: 1280×720px, JPG/PNG</p>
          </div>
        </div>
      </div>

      {/* Mobile-only access toggle */}
      <button
        type="button"
        onClick={handleToggleMobileOnly}
        className={cn(
          'w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-colors mb-6',
          course.mobileOnly
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-200 bg-white hover:border-gray-300',
        )}
      >
        <div className={cn(
          'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
          course.mobileOnly ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500',
        )}>
          <Smartphone className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className={cn('text-sm font-semibold', course.mobileOnly ? 'text-primary-700' : 'text-gray-700')}>
            Mobile Device Only
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {course.mobileOnly
              ? 'Only students on mobile devices can access this course'
              : 'This course is accessible on all devices — click to restrict to mobile only'}
          </p>
        </div>
        {/* Toggle pill */}
        <div className={cn(
          'w-11 h-6 rounded-full transition-colors shrink-0 relative',
          course.mobileOnly ? 'bg-primary-600' : 'bg-gray-300',
        )}>
          <div className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            course.mobileOnly ? 'translate-x-5' : 'translate-x-0.5',
          )} />
        </div>
      </button>

      {/* Sections */}
      <div className="space-y-4 mb-6">
        {(course.sections ?? []).map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="card overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100">
                <button onClick={() => {
                  setExpandedSections((prev) => {
                    const next = new Set(prev);
                    if (next.has(section.id)) next.delete(section.id);
                    else next.add(section.id);
                    return next;
                  });
                }}>
                  <ChevronDown className={cn('w-4 h-4 text-gray-500 transition-transform', isExpanded && 'rotate-180')} />
                </button>
                <span className="flex-1 font-medium text-gray-900 text-sm">{section.title}</span>
                <span className="text-xs text-gray-400">{section.lectures.length} lectures</span>
                <button
                  onClick={() => handleDeleteSection(section.id)}
                  className="text-red-400 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {isExpanded && (
                <div>
                  {section.lectures.map((lecture) => (
                    <div key={lecture.id} className="border-b border-gray-50 last:border-0">
                      {/* Lecture row */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <Video className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="flex-1 text-sm text-gray-700">{lecture.title}</span>

                        {lecture.videoUrl ? (
                          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                            <Check className="w-3 h-3" /> Video ready
                          </span>
                        ) : lecture.videoProcessing ? (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Converting…
                          </div>
                        ) : uploadingLectureId === lecture.id ? (
                          <div className="flex flex-col items-end gap-1 min-w-[100px]">
                            {uploadPhase === 'processing' ? (
                              <div className="flex items-center gap-1.5 text-xs text-amber-600">
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Processing video…
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 text-xs text-primary-600">
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Uploading {uploadProgress}%
                                </div>
                                <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-primary-500 rounded-full transition-all"
                                    style={{ width: `${uploadProgress}%` }}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        ) : (
                          <label className="cursor-pointer text-xs text-primary-600 hover:text-primary-700 flex items-center gap-1">
                            <Upload className="w-3.5 h-3.5" />
                            Upload video
                            <input
                              type="file"
                              accept="video/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleVideoUpload(section.id, lecture.id, file);
                              }}
                            />
                          </label>
                        )}

                        <label className="flex items-center gap-1 text-xs text-gray-500">
                          <input
                            type="checkbox"
                            defaultChecked={lecture.isFree}
                            onChange={async (e) => {
                              await lectureApi.update(id, section.id, lecture.id, { isFree: e.target.checked });
                            }}
                            className="rounded"
                          />
                          Free preview
                        </label>

                        {/* Questions toggle */}
                        <button
                          onClick={() => {
                            setQuestionPanelOpen(questionPanelOpen === lecture.id ? null : lecture.id);
                            resetQuestionForm();
                          }}
                          className={cn(
                            'text-xs flex items-center gap-1 px-2 py-0.5 rounded',
                            questionPanelOpen === lecture.id
                              ? 'bg-amber-100 text-amber-700'
                              : 'text-gray-500 hover:text-gray-700',
                          )}
                          title="Manage questions"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          {((lecture.questions as LectureQuestion[] | undefined) ?? []).length > 0 && (
                            <span className="bg-amber-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                              {(lecture.questions as LectureQuestion[]).length}
                            </span>
                          )}
                        </button>

                        {/* Resources toggle */}
                        <button
                          onClick={() => {
                            setResourcePanelOpen(resourcePanelOpen === lecture.id ? null : lecture.id);
                            setQuestionPanelOpen(null);
                            setLinkTitle('');
                            setLinkUrl('');
                          }}
                          className={cn(
                            'text-xs flex items-center gap-1 px-2 py-0.5 rounded',
                            resourcePanelOpen === lecture.id
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-500 hover:text-gray-700',
                          )}
                          title="Manage resources"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                          {(lecture.resources?.length ?? 0) > 0 && (
                            <span className="bg-primary-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                              {lecture.resources!.length}
                            </span>
                          )}
                        </button>

                        {/* Questions toggle */}
                        <button
                          onClick={() => {
                            setQuestionPanelOpen(questionPanelOpen === lecture.id ? null : lecture.id);
                            setResourcePanelOpen(null);
                            resetQuestionForm();
                          }}
                          className={cn(
                            'text-xs flex items-center gap-1 px-2 py-0.5 rounded',
                            questionPanelOpen === lecture.id
                              ? 'bg-amber-100 text-amber-700'
                              : 'text-gray-500 hover:text-gray-700',
                          )}
                          title="Manage questions"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          {((lecture.questions as LectureQuestion[] | undefined)?.length ?? 0) > 0 && (
                            <span className="bg-amber-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                              {(lecture.questions as LectureQuestion[]).length}
                            </span>
                          )}
                        </button>

                        <button
                          onClick={() => handleDeleteLecture(section.id, lecture.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Resources panel */}
                      {resourcePanelOpen === lecture.id && (
                        <div className="mx-4 mb-3 border border-gray-200 rounded-lg bg-gray-50 p-3 space-y-3">
                          {/* Existing resources */}
                          {(lecture.resources ?? []).length > 0 && (
                            <ul className="space-y-1">
                              {(lecture.resources as LectureResource[]).map((r) => (
                                <li key={r.url} className="flex items-center gap-2 text-xs text-gray-700 bg-white border border-gray-100 rounded px-2 py-1.5">
                                  {r.type === 'link' ? (
                                    <Link2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                  ) : (
                                    <Paperclip className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                                  )}
                                  <a href={r.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:text-primary-600">
                                    {r.title}
                                  </a>
                                  <button
                                    onClick={() => handleDeleteResource(section.id, lecture.id, r.url)}
                                    className="text-red-400 hover:text-red-600 shrink-0"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Add link */}
                          <div className="space-y-1.5">
                            <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
                              <Link2 className="w-3.5 h-3.5" /> Add link
                            </p>
                            <input
                              value={linkTitle}
                              onChange={(e) => setLinkTitle(e.target.value)}
                              placeholder="Title (e.g. Official Docs)"
                              className="input-field w-full text-xs py-1.5"
                            />
                            <div className="flex gap-1">
                              <input
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://..."
                                className="input-field flex-1 text-xs py-1.5"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddLink(section.id, lecture)}
                              />
                              <button
                                onClick={() => handleAddLink(section.id, lecture)}
                                disabled={!linkTitle.trim() || !linkUrl.trim()}
                                className="btn-primary text-xs px-3 py-1.5 disabled:opacity-50"
                              >
                                Add
                              </button>
                            </div>
                          </div>

                          {/* Upload attachment */}
                          <div>
                            <p className="text-xs font-medium text-gray-600 flex items-center gap-1 mb-1">
                              <Paperclip className="w-3.5 h-3.5" /> Upload attachment
                            </p>
                            {uploadingAttachmentFor === lecture.id ? (
                              <div className="flex items-center gap-2 text-xs text-primary-600">
                                <Loader2 className="w-3 h-3 animate-spin" /> Uploading…
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 border border-primary-200 rounded px-2 py-1">
                                <Upload className="w-3.5 h-3.5" /> Choose file (PDF, ZIP, DOCX…)
                                <input
                                  type="file"
                                  accept=".pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.png,.jpg"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadAttachment(section.id, lecture.id, file);
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Questions panel */}
                      {questionPanelOpen === lecture.id && (
                        <div className="mx-4 mb-3 border border-amber-200 rounded-lg bg-amber-50 p-3 space-y-3">
                          {/* Existing questions */}
                          {((lecture.questions as LectureQuestion[] | undefined) ?? []).length > 0 && (
                            <ul className="space-y-2">
                              {(lecture.questions as LectureQuestion[]).map((q) => (
                                <li key={q.id} className="bg-white border border-amber-100 rounded-lg p-2.5 text-xs">
                                  <div className="flex items-start gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-gray-800 mb-1">{q.question}</p>
                                      <p className="text-gray-400">At {q.showAtSecond}s · {q.options.length} options · Answer: {q.options[q.correctIndex]}</p>
                                    </div>
                                    <button
                                      onClick={() => handleDeleteQuestion(section.id, lecture.id, q.id)}
                                      className="text-red-400 hover:text-red-600 shrink-0"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}

                          {/* Add question form */}
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                              <HelpCircle className="w-3.5 h-3.5" /> Add timestamp question
                            </p>

                            <div className="flex gap-2">
                              <div className="flex-1">
                                <input
                                  value={qQuestion}
                                  onChange={(e) => setQQuestion(e.target.value)}
                                  placeholder="Question text…"
                                  className="input-field w-full text-xs py-1.5"
                                />
                              </div>
                              <div className="w-20">
                                <input
                                  type="number"
                                  min={0}
                                  value={qShowAtSecond}
                                  onChange={(e) => setQShowAtSecond(e.target.value)}
                                  placeholder="Sec"
                                  title="Show at second"
                                  className="input-field w-full text-xs py-1.5"
                                />
                              </div>
                            </div>

                            {/* 4 option fields */}
                            <div className="grid grid-cols-2 gap-1.5">
                              {qOptions.map((opt, i) => (
                                <div key={i} className="relative">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono text-gray-400">
                                    {String.fromCharCode(65 + i)}.
                                  </span>
                                  <input
                                    value={opt}
                                    onChange={(e) => {
                                      const next = [...qOptions];
                                      next[i] = e.target.value;
                                      setQOptions(next);
                                    }}
                                    placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                    className="input-field w-full text-xs py-1.5 pl-6"
                                  />
                                </div>
                              ))}
                            </div>

                            {/* Correct answer + explanation */}
                            <div className="flex gap-2">
                              <select
                                value={qCorrectIndex}
                                onChange={(e) => setQCorrectIndex(Number(e.target.value))}
                                className="input-field text-xs py-1.5 flex-1"
                              >
                                {qOptions.map((_, i) => (
                                  <option key={i} value={i}>Correct: {String.fromCharCode(65 + i)}</option>
                                ))}
                              </select>
                              <input
                                value={qExplanation}
                                onChange={(e) => setQExplanation(e.target.value)}
                                placeholder="Explanation (optional)"
                                className="input-field flex-[2] text-xs py-1.5"
                              />
                            </div>

                            <button
                              onClick={() => handleAddQuestion(section.id, lecture.id)}
                              disabled={addingQuestion || !qQuestion.trim()}
                              className="btn-primary text-xs px-4 py-1.5 disabled:opacity-50 flex items-center gap-1"
                            >
                              {addingQuestion ? (
                                <><Loader2 className="w-3 h-3 animate-spin" /> Saving…</>
                              ) : (
                                <><Plus className="w-3 h-3" /> Add question</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Add lecture */}
                  {addingLectureFor === section.id ? (
                    <div className="flex gap-2 px-4 py-3 border-t border-gray-100">
                      <input
                        value={newLectureTitle}
                        onChange={(e) => setNewLectureTitle(e.target.value)}
                        placeholder="Lecture title"
                        className="input-field flex-1 text-sm"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddLecture(section.id)}
                        autoFocus
                      />
                      <button onClick={() => handleAddLecture(section.id)} className="btn-primary text-sm px-4">Add</button>
                      <button onClick={() => setAddingLectureFor(null)} className="btn-secondary text-sm px-3">Cancel</button>
                    </div>
                  ) : (
                    <div className="px-4 py-2">
                      <button
                        onClick={() => {
                          setAddingLectureFor(section.id);
                          setNewLectureTitle('');
                        }}
                        className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" /> Add lecture
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add section */}
      {addingSection ? (
        <div className="flex gap-2">
          <input
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="Section title"
            className="input-field flex-1"
            onKeyDown={(e) => e.key === 'Enter' && handleAddSection()}
            autoFocus
          />
          <button onClick={handleAddSection} className="btn-primary px-6">Add</button>
          <button onClick={() => setAddingSection(false)} className="btn-secondary px-4">Cancel</button>
        </div>
      ) : (
        <button
          onClick={() => setAddingSection(true)}
          className="btn-outline w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Section
        </button>
      )}
    </div>
  );
}
