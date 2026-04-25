'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, ChevronDown, X } from 'lucide-react';
import { formatDuration } from '@/lib/utils';
import { Section } from '@/types';

const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), { ssr: false });

interface Props {
  sections: Section[];
  totalLectures: number;
  totalDuration: number;
}

export default function CourseCurriculum({ sections, totalLectures, totalDuration }: Props) {
  const [previewLecture, setPreviewLecture] = useState<{ title: string; videoUrl: string } | null>(null);

  return (
    <>
      <section className="bg-white rounded-xl p-6 border border-gray-100">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Course Content</h2>
        <p className="text-sm text-gray-500 mb-4">
          {sections.length} sections &bull; {totalLectures} lectures &bull;{' '}
          {formatDuration(totalDuration)} total
        </p>
        <div className="space-y-3">
          {sections.map((section) => (
            <details key={section.id} className="group border border-gray-200 rounded-lg overflow-hidden">
              <summary className="flex items-center justify-between px-4 py-3 bg-gray-50 cursor-pointer select-none font-medium text-gray-900 text-sm">
                <span>{section.title}</span>
                <div className="flex items-center gap-3 text-gray-500">
                  <span className="text-xs">{section.lectures.length} lectures</span>
                  <ChevronDown className="w-4 h-4 group-open:rotate-180 transition-transform" />
                </div>
              </summary>
              <ul className="divide-y divide-gray-100">
                {section.lectures.map((lecture) => (
                  <li key={lecture.id} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700">
                    <Play className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="flex-1">{lecture.title}</span>
                    {lecture.isFree && lecture.videoUrl ? (
                      <button
                        onClick={() => setPreviewLecture({ title: lecture.title, videoUrl: lecture.videoUrl! })}
                        className="text-xs text-primary-600 font-medium hover:text-primary-700 underline underline-offset-2"
                      >
                        Preview
                      </button>
                    ) : lecture.isFree ? (
                      <span className="text-xs text-primary-600 font-medium">Preview</span>
                    ) : null}
                    {lecture.duration && (
                      <span className="text-xs text-gray-400">{formatDuration(lecture.duration)}</span>
                    )}
                  </li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      {/* Free lecture preview modal */}
      {previewLecture && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewLecture(null)}
        >
          <div
            className="w-full max-w-3xl bg-black rounded-xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-3 bg-gray-900">
              <span className="text-white text-sm font-medium truncate">{previewLecture.title}</span>
              <button onClick={() => setPreviewLecture(null)} className="text-gray-400 hover:text-white ml-4 shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>
            <VideoPlayer src={previewLecture.videoUrl} title={previewLecture.title} />
          </div>
        </div>
      )}
    </>
  );
}
