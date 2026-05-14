'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface CarouselSlide {
  id: number;
  image: string;
  alt: string;
  badge: string;
  title: string;
  subtitle: string;
}

interface HeroCarouselProps {
  slides: CarouselSlide[];
  hideSlideText?: boolean;
  autoPlayInterval?: number;
  showCounter?: boolean;
  titleTag?: 'h1' | 'h2';
}

export function HeroCarousel({ 
  slides, 
  hideSlideText = false, 
  autoPlayInterval = 5000,
  showCounter = true,
  titleTag: TitleTag = 'h1'
}: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const totalSlides = slides.length;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlay, nextSlide, autoPlayInterval]);

  if (!slides.length) return null;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-black"
      onMouseEnter={() => setIsAutoPlay(false)}
      onMouseLeave={() => setIsAutoPlay(true)}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
            index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.alt}
            fill
            className={`object-cover transition-transform duration-[8000ms] ease-linear ${
              index === currentSlide ? 'scale-110' : 'scale-100'
            }`}
            priority={index === 0}
            sizes="100vw"
            // quality={90}
          />

          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Slide text */}
          {!hideSlideText && (
            <div
              className={`absolute bottom-24 left-8 right-8 md:left-14 z-20 transition-all duration-700 ${
                index === currentSlide
                  ? 'opacity-100 translate-y-0'
                  : 'opacity-0 translate-y-4'
              }`}
            >
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary bg-primary/15 border border-primary/30 backdrop-blur-sm px-3 py-1 rounded-full mb-3">
                {slide.badge}
              </span>
              <TitleTag className="text-white text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight drop-shadow-lg mb-3 max-w-2xl">
                {slide.title}
              </TitleTag>
              <p className="text-white/80 text-base md:text-lg max-w-md leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Navigation Buttons */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary border border-white/20 hover:border-primary text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary border border-white/20 hover:border-primary text-white backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full cursor-pointer ${
              index === currentSlide
                ? 'bg-primary w-8 h-2.5'
                : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide Counter */}
      {showCounter && (
        <div className="absolute top-5 right-5 z-30 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
          <span className="text-white/80 text-xs font-mono">
            {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
          </span>
        </div>
      )}
    </div>
  );
}