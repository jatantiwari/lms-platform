"use client";
import Image from 'next/image';

const aboutImages = [
  '/about-gallery-1.jpg',
  '/about-gallery-2.jpg',
  '/about-gallery-5.jpg',
  '/about-gallery-6.jpg',
  '/about-gallery-7.jpg',
  '/about-gallery-8.jpg',
  '/about-gallery-9.jpg',
  '/about-gallery-10.jpg',
  '/about-gallery-11.jpg',
];

export function AnimatedAboutGallery() {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full max-w-4xl mx-auto p-4"
      style={{ margin: '0 auto' }}
    >
      {aboutImages.map((src, i) => (
        <div
          key={i}
          className="relative w-full rounded-xl overflow-hidden border border-border bg-black flex items-center justify-center"
          style={{ minHeight: 120 }}
        >
          <Image
            src={src}
            alt={`About Gallery ${i + 1}`}
            layout="intrinsic"
            width={600}
            height={400}
            className="object-contain w-full h-auto"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={i < 3}
          />
        </div>
      ))}
    </div>
  );
}
