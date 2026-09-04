"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, Sparkles, MapPin } from "lucide-react";

// India destinations configuration
const DESTINATIONS = [
  {
    name: "Srinagar",
    region: "Jammu & Kashmir",
    description: "Serene Dal Lake shikaras framed by majestic snow-clad Himalayan peaks.",
    image: "https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?auto=format&fit=crop&w=1200&q=80",
    alt: "Traditional Kashmiri shikara boats floating on Dal Lake, Srinagar"
  },
  {
    name: "Manali",
    region: "Himachal Pradesh",
    description: "Himalayan alpine forests, roaring rivers, and snow-capped mountain valleys.",
    image: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=1200&q=80",
    alt: "Pine forest and mountains in Solang Valley, Manali"
  },
  {
    name: "Jaipur",
    region: "Rajasthan",
    description: "The historical Pink City showcasing grand forts and iconic terracotta palaces.",
    image: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80",
    alt: "Hawa Mahal, the Palace of Winds, Jaipur"
  },
  {
    name: "Udaipur",
    region: "Rajasthan",
    description: "The royal Venice of the East, adorned with shimmering lakes and marble palaces.",
    image: "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=1200&q=80",
    alt: "Taj Lake Palace reflecting on Lake Pichola, Udaipur"
  },
  {
    name: "Mumbai",
    region: "Maharashtra",
    description: "Vibrant coastal marine drive and a modern skyline overlooking the Arabian Sea.",
    image: "https://images.unsplash.com/photo-1562979314-bee7453e911c?auto=format&fit=crop&w=1200&q=80",
    alt: "Marine Drive skyline and ocean waves, Mumbai"
  },
  {
    name: "Hyderabad",
    region: "Telangana",
    description: "Historic Charminar arches paired with the rich heritage of the Deccan plateau.",
    image: "https://images.unsplash.com/photo-1608958416715-4baab941eb99?auto=format&fit=crop&w=1200&q=80",
    alt: "The illuminated Charminar monument, Hyderabad"
  },
  {
    name: "Goa",
    region: "Coastal India",
    description: "Sun-drenched golden beaches, swaying palms, and a relaxed tropical coast.",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
    alt: "Sunset over a tropical palm-fringed beach, Goa"
  },
  {
    name: "Kerala",
    region: "Southern Tropics",
    description: "Tranquil emerald backwaters, houseboats, and rich coastal palm groves.",
    image: "https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=1200&q=80",
    alt: "Traditional houseboat cruising through Kerala backwaters"
  }
];

export const DiscoverIndiaSlideshow: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Touch coordinates for swipe navigation
  const touchStartX = useRef<number | null>(null);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);

  // Detect accessibility motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleQueryChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleQueryChange);
    return () => mediaQuery.removeEventListener("change", handleQueryChange);
  }, []);

  // Autoplay handler
  const startAutoplay = () => {
    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    if (isPaused || prefersReducedMotion) return;

    autoplayTimer.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % DESTINATIONS.length);
    }, 5000);
  };

  useEffect(() => {
    startAutoplay();
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [isPaused, activeIndex, prefersReducedMotion]);

  // Navigation handlers
  const handleNext = () => {
    setIsPaused(true);
    setActiveIndex((prev) => (prev + 1) % DESTINATIONS.length);
  };

  const handlePrev = () => {
    setIsPaused(true);
    setActiveIndex((prev) => (prev - 1 + DESTINATIONS.length) % DESTINATIONS.length);
  };

  const handleDotClick = (idx: number) => {
    setIsPaused(true);
    setActiveIndex(idx);
  };

  // Keyboard navigation listener
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      handleNext();
    } else if (e.key === "ArrowLeft") {
      handlePrev();
    }
  };

  // Touch handlers for mobile swiping
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    // Minimum distance threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }
    touchStartX.current = null;
  };

  return (
    <section 
      className="flex flex-col gap-8 select-none focus:outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      aria-label="Discover India slideshow"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-accent text-xs font-bold tracking-widest uppercase flex items-center gap-1.5 animate-fade-in">
            <Sparkles size={12} className="text-accent animate-pulse" />
            Curated Local Journeys
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark tracking-tight">
            Discover the beauty of India
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-xl font-light">
            From Himalayan landscapes to royal cities, vibrant metros, and tropical coastlines.
          </p>
        </div>

        {/* Desktop Controls with Progress Indicator */}
        <div className="hidden sm:flex items-center gap-5">
          <div className="text-xs font-semibold text-muted tracking-widest">
            <span className="text-brand font-bold">{String(activeIndex + 1).padStart(2, "0")}</span>
            <span className="mx-1.5 text-border-gray">/</span>
            <span>{String(DESTINATIONS.length).padStart(2, "0")}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-3 rounded-xl border border-border-gray/40 bg-white hover:border-brand active-press text-dark hover:text-brand shadow-xs transition-all cursor-pointer"
              aria-label="Previous slide"
            >
              <ChevronLeft size={16} className="stroke-[2.2]" />
            </button>
            <button
              onClick={handleNext}
              className="p-3 rounded-xl border border-border-gray/40 bg-white hover:border-brand active-press text-dark hover:text-brand shadow-xs transition-all cursor-pointer"
              aria-label="Next slide"
            >
              <ChevronRight size={16} className="stroke-[2.2]" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Slideshow viewport */}
      <div 
        className="relative rounded-3xl overflow-hidden bg-zinc-100 shadow-card aspect-[4/3] sm:aspect-[21/9]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {DESTINATIONS.map((dest, idx) => {
          const isActive = idx === activeIndex;
          
          return (
            <div
              key={dest.name}
              className={`absolute inset-0 w-full h-full flex flex-col justify-end p-6 sm:p-12 transition-opacity ${
                prefersReducedMotion ? "duration-0" : "duration-500"
              } ${isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"}`}
            >
              {/* Image backdrop */}
              <img
                src={dest.image}
                alt={dest.alt}
                className={`absolute inset-0 w-full h-full object-cover transition-transform ${
                  prefersReducedMotion ? "duration-0" : "duration-[10000ms] ease-out scale-100"
                } ${isActive && !prefersReducedMotion ? "scale-105" : "scale-100"}`}
              />

              {/* Gradient overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/40 to-transparent z-1" />

              {/* Text Card overlay */}
              <div className="relative z-10 max-w-lg flex flex-col gap-2.5 text-[#FAF9F6] animate-success-reveal">
                <div className="flex items-center gap-1 text-accent text-[10px] font-bold uppercase tracking-widest">
                  <MapPin size={10} className="fill-accent stroke-accent" />
                  <span>{dest.region}</span>
                </div>
                <h3 className="font-serif text-2xl sm:text-4xl font-extrabold text-[#FAF9F6] tracking-tight">
                  {dest.name}
                </h3>
                <p className="text-xs sm:text-sm text-[#FAF9F6]/85 font-light leading-relaxed">
                  {dest.description}
                </p>
              </div>
            </div>
          );
        })}

        {/* Mobile controls overlay */}
        <div className="absolute inset-x-0 bottom-4 z-20 flex sm:hidden justify-between px-4 items-center">
          <button
            onClick={handlePrev}
            className="p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-dark active-press shadow-xs border border-border-gray/30"
            aria-label="Previous slide"
          >
            <ChevronLeft size={16} />
          </button>
          
          <div className="flex items-center gap-1.5">
            {DESTINATIONS.map((_, idx) => (
              <button
                key={idx}
                onClick={() => handleDotClick(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex ? "w-6 bg-accent" : "w-1.5 bg-[#FAF9F6]/50"
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="p-2.5 rounded-full bg-white/90 backdrop-blur-xs text-dark active-press shadow-xs border border-border-gray/30"
            aria-label="Next slide"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Desktop Dots Navigation */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {DESTINATIONS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => handleDotClick(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === activeIndex ? "w-8 bg-brand" : "w-2 bg-border-gray hover:bg-brand/50"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
