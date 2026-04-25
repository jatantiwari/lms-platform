'use client';

import dynamic from 'next/dynamic';
import Image from 'next/image';

const VideoPlayer = dynamic(() => import('@/components/video/VideoPlayer'), { ssr: false });

interface Props {
  previewVideo?: string;
  thumbnail?: string;
  title: string;
}

export default function CoursePreviewPlayer({ previewVideo, thumbnail, title }: Props) {
  if (previewVideo) {
    return (
      <div className="aspect-video bg-black">
        <VideoPlayer src={previewVideo} title={title} />
      </div>
    );
  }
  if (thumbnail) {
    return (
      <div className="relative aspect-video bg-gray-100">
        <Image src={thumbnail} alt={title} fill className="object-cover" />
      </div>
    );
  }
  return null;
}
