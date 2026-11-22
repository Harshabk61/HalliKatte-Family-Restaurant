import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowDown } from 'lucide-react';
import { WarliBorderPattern, WarliLivingSceneOverlay } from './WarliMotifs';
import { WarliThreeCanvas } from './WarliThreeCanvas';

interface HeroSectionProps {
  onExploreMenu: () => void;
  onReserveTable: () => void;
}

export function HeroSection({
  onExploreMenu,
  onReserveTable,
}: HeroSectionProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement | null>(null);
  const copyWrapRef = useRef<HTMLDivElement | null>(null);
  const eyebrowRef = useRef<HTMLParagraphElement | null>(null);
  const headingRef = useRef<HTMLHeadingElement | null>(null);
  const copyRef = useRef<HTMLParagraphElement | null>(null);
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const scrollHintRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(
        bgRef.current,
        { opacity: 0.16, scale: 1.06 },
        { opacity: 1, scale: 1, duration: 1.35 },
      )
        .fromTo(
          eyebrowRef.current,
          { opacity: 0, y: 14, letterSpacing: '0.32em' },
          { opacity: 1, y: 0, letterSpacing: '0.22em', duration: 0.65 },
          '-=0.85',
        )
        .fromTo(
          headingRef.current,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.75 },
          '-=0.45',
        )
        .fromTo(
          copyRef.current,
          { opacity: 0, y: 16 },
          { opacity: 1, y: 0, duration: 0.65 },
          '-=0.45',
        )
        .fromTo(
          ctaRef.current,
          { opacity: 0, y: 14 },
          { opacity: 1, y: 0, duration: 0.55 },
          '-=0.4',
        )
        .fromTo(
          scrollHintRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.55 },
          '-=0.25',
        );
    }, sectionRef);

    let rafId = 0;
    const updateParallax = () => {
      rafId = 0;
      const y = window.scrollY;
      const vh = Math.max(window.innerHeight, 1);
      if (y > vh * 1.15) return;

      if (bgRef.current) {
        bgRef.current.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
      }
      if (copyWrapRef.current) {
        copyWrapRef.current.style.transform = `translate3d(0, ${y * 0.08}px, 0)`;
        copyWrapRef.current.style.opacity = `${Math.max(1 - y / (vh * 0.75), 0)}`;
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(updateParallax);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      ctx.revert();
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleScrollToStory = () => {
    const story = document.getElementById('story');
    if (story) {
      story.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="home"
      ref={sectionRef}
      className="relative min-h-[100svh] w-full bg-[#713B32] flex flex-col justify-between overflow-hidden"
    >
      {/* Layer 1: Authentic Warli Mural Background */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 will-change-transform"
      >
        <img
          src="/src/assets/images/warli_hero_village_1795328273037.jpg"
          alt="Traditional Warli tribal mural depicting village life, thatched huts, banyan tree, Tarpa circle dance, and bullock cart on terracotta wall"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        {/* Measured translucent terracotta scrim keeping artwork visible while guaranteeing WCAG AA text legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#2B1915]/60 via-[#542820]/42 to-[#2B1915]/82"
          aria-hidden="true"
        />
      </div>

      {/* Layer 2: Animated Living Warli Village SVG Overlay */}
      <WarliLivingSceneOverlay />

      {/* Layer 3: Three.js 3D Depth & Warm Ember Atmosphere */}
      <WarliThreeCanvas />

      {/* Top Spacer for Fixed Header */}
      <div className="relative z-20 pt-20 sm:pt-24">
        <WarliBorderPattern color="#FFF9EF" opacity={0.38} />
      </div>

      {/* Layer 4: Editorial Centerpiece Copy */}
      <div
        ref={copyWrapRef}
        className="relative z-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 text-center flex flex-col items-center will-change-transform"
      >
        <p
          ref={eyebrowRef}
          className="text-xs sm:text-sm tracking-[0.22em] font-semibold text-[#F5EBDD] uppercase mb-4 drop-shadow-sm"
        >
          AN EXPERIENCE ROOTED IN TRADITION
        </p>

        <h1
          ref={headingRef}
          className="font-display text-5xl sm:text-6xl md:text-7xl font-semibold text-[#FFF9EF] leading-[1.06] tracking-tight text-balance drop-shadow-md max-w-3xl"
        >
          Where Every Meal
          <br />
          Tells a Story.
        </h1>

        <p
          ref={copyRef}
          className="mt-6 text-base sm:text-lg text-[#F5EBDD]/95 max-w-xl leading-relaxed font-normal drop-shadow-sm"
        >
          Discover the warmth of traditional hospitality, delicious flavours and
          unforgettable moments with family.
        </p>

        <div
          ref={ctaRef}
          className="mt-9 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={onReserveTable}
            className="btn-warli-sheen px-7 py-3.5 bg-[#C49A5A] hover:bg-[#d3aa6c] text-[#2B1915] font-semibold text-sm sm:text-base rounded-lg shadow-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9EF]"
          >
            Reserve Your Table
          </button>

          <button
            type="button"
            onClick={onExploreMenu}
            className="px-7 py-3.5 bg-[#542820]/85 hover:bg-[#542820] text-[#FFF9EF] border border-[#FFF9EF]/45 font-semibold text-sm sm:text-base rounded-lg shadow-md transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A5A]"
          >
            Explore Our Menu
          </button>
        </div>
      </div>

      {/* Bottom Scroll Cue + Warli Border */}
      <div className="relative z-20 pb-5 flex flex-col items-center gap-3">
        <button
          ref={scrollHintRef}
          type="button"
          onClick={handleScrollToStory}
          aria-label="Scroll to Our Story section"
          className="flex flex-col items-center gap-1.5 text-[#F5EBDD]/90 hover:text-[#FFF9EF] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A5A] rounded px-3 py-1"
        >
          <span className="text-[11px] tracking-[0.22em] font-medium uppercase">
            SCROLL TO EXPLORE
          </span>
          <ArrowDown className="w-4 h-4 text-[#C49A5A] animate-bounce" />
        </button>
        <WarliBorderPattern color="#FFF9EF" opacity={0.42} />
      </div>
    </section>
  );
}
