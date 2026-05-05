'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselSlide {
  id: number;
  image: string;
  alt: string;
  badge: string;
  title: string;
  subtitle: string;
}

const slides: CarouselSlide[] = [
  {
    id: 1,
    image: 'c1.png',
    alt: 'Course Overview',
    badge: '🚀 Start Your Journey',
    title: 'Learn, Invest, Grow',
    subtitle: 'Master stock market trading with India\'s top mentors and proven strategies.',
  },
  {
    id: 2,
    image: 'c2.png',
    alt: 'Expert Mentors',
    badge: '👨‍🏫 World-Class Faculty',
    title: '50+ Expert Mentors',
    subtitle: 'Learn directly from professionals with decades of real market experience.',
  },
  {
    id: 3,
    image: 'c3.png',
    alt: 'Student Success',
    badge: '🏆 Proven Results',
    title: '5000+ Successful Students',
    subtitle: 'Join a thriving community of traders who have transformed their financial lives.',
  },
  {
    id: 4,
    image: 'c4.png',
    alt: 'Market Mastery',
    badge: '📈 Advanced Strategies',
    title: 'Ride the Bull, Rule the Bear',
    subtitle: 'Gain the edge to profit in any market condition with our battle-tested playbooks.',
  },
  {
    id: 5,
    image: 'c5.png',
    alt: 'Financial Freedom',
    badge: '💰 Your Future Awaits',
    title: 'Achieve Financial Freedom',
    subtitle: 'Build sustainable wealth and take control of your financial destiny today.',
  },
];

interface HeroCarouselProps {
  /** When true, slide text/badge are hidden (useful when parent renders its own overlay text) */
  hideSlideText?: boolean;
}

export function HeroCarousel({ hideSlideText = false }: HeroCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [prevSlideIndex, setPrevSlideIndex] = useState<number | null>(null);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  useEffect(() => {
    if (!isAutoPlay) return;
    const interval = setInterval(() => {
      setPrevSlideIndex(currentSlide);
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlay, currentSlide]);

  const goToSlide = (index: number) => {
    setPrevSlideIndex(currentSlide);
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  const handleNext = () => {
    setPrevSlideIndex(currentSlide);
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
  };

  const handlePrev = () => {
    setPrevSlideIndex(currentSlide);
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-gray-900"
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
          />

          {/* Multi-layer gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Per-slide text */}
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
              <h2 className="text-white text-2xl md:text-4xl font-extrabold leading-tight drop-shadow-lg mb-2">
                {slide.title}
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-md leading-relaxed">
                {slide.subtitle}
              </p>
            </div>
          )}
        </div>
      ))}

      {/* Prev Button */}
      <button
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary border border-white/20 hover:border-primary text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next Button */}
      <button
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-primary border border-white/20 hover:border-primary text-white backdrop-blur-sm transition-all duration-300 hover:scale-110"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide
                ? 'bg-primary w-7 h-2.5'
                : 'bg-white/40 hover:bg-white/70 w-2.5 h-2.5'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Slide counter */}
      <div className="absolute top-5 right-5 z-30 text-white/60 text-xs font-mono tracking-widest">
        {String(currentSlide + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
      </div>
    </div>
  );
}
