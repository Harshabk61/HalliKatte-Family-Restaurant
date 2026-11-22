import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export function WarliBorderPattern({
  color = '#FFF9EF',
  opacity = 0.45,
  className = '',
}: {
  color?: string;
  opacity?: number;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden select-none pointer-events-none ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className="w-full h-5 sm:h-6"
        style={{ opacity }}
      >
        <defs>
          <pattern
            id={`warli-tri-${color.replace('#', '')}`}
            width="28"
            height="28"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="3"
              x2="28"
              y2="3"
              stroke={color}
              strokeWidth="1.2"
            />
            <polygon
              points="4,22 14,6 24,22"
              fill="none"
              stroke={color}
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
            <circle cx="14" cy="17" r="1.8" fill={color} />
            <circle cx="0" cy="14" r="1.3" fill={color} />
            <circle cx="28" cy="14" r="1.3" fill={color} />
            <line
              x1="0"
              y1="25"
              x2="28"
              y2="25"
              stroke={color}
              strokeWidth="1.2"
            />
          </pattern>
        </defs>
        <rect
          width="1200"
          height="28"
          fill={`url(#warli-tri-${color.replace('#', '')})`}
        />
      </svg>
    </div>
  );
}

export function WarliDishPlaceholder({
  dishName,
  categoryName,
  isVeg,
}: {
  dishName: string;
  categoryName: string;
  isVeg: boolean;
}) {
  const slug = categoryName.toLowerCase();

  return (
    <div className="relative w-full h-full bg-[#713B32] flex flex-col items-center justify-center p-5 overflow-hidden select-none">
      <svg
        viewBox="0 0 240 160"
        className="w-full h-full max-w-[220px] max-h-[140px]"
        aria-hidden="true"
      >
        <rect
          x="8"
          y="8"
          width="224"
          height="144"
          fill="none"
          stroke="#FFF9EF"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <circle cx="16" cy="16" r="2.2" fill="#C49A5A" />
        <circle cx="224" cy="16" r="2.2" fill="#C49A5A" />
        <circle cx="16" cy="144" r="2.2" fill="#C49A5A" />
        <circle cx="224" cy="144" r="2.2" fill="#C49A5A" />

        {slug.includes('biryani') || slug.includes('main') ? (
          <g stroke="#FFF9EF" fill="none" strokeWidth="1.7" strokeLinecap="round">
            <path d="M84,92 C84,116 156,116 156,92 L148,74 L92,74 Z" />
            <ellipse cx="120" cy="74" rx="28" ry="5" />
            <path d="M98,66 Q104,54 100,44" strokeOpacity="0.7" className="animate-warli-smoke" />
            <path d="M120,63 Q126,50 121,38" strokeOpacity="0.85" className="animate-warli-smoke" style={{ animationDelay: '0.8s' }} />
            <path d="M142,66 Q147,54 141,44" strokeOpacity="0.7" className="animate-warli-smoke" style={{ animationDelay: '1.6s' }} />
            <path d="M80,122 L160,122" stroke="#C49A5A" />
          </g>
        ) : slug.includes('beverage') || slug.includes('milkshake') ? (
          <g stroke="#FFF9EF" fill="none" strokeWidth="1.7" strokeLinecap="round">
            <path d="M100,56 L106,116 L134,116 L140,56 Z" />
            <ellipse cx="120" cy="56" rx="20" ry="4" />
            <path d="M126,56 L138,34 L148,32" stroke="#C49A5A" />
            <circle cx="115" cy="78" r="3" />
            <circle cx="126" cy="92" r="2.5" />
          </g>
        ) : slug.includes('soup') ? (
          <g stroke="#FFF9EF" fill="none" strokeWidth="1.7" strokeLinecap="round">
            <path d="M82,82 C82,110 158,110 158,82 Z" />
            <line x1="74" y1="82" x2="166" y2="82" />
            <path d="M104,70 Q108,58 104,48" strokeOpacity="0.8" className="animate-warli-smoke" />
            <path d="M122,68 Q127,54 122,42" strokeOpacity="0.9" className="animate-warli-smoke" style={{ animationDelay: '1s' }} />
            <path d="M138,70 Q142,58 138,48" strokeOpacity="0.8" className="animate-warli-smoke" style={{ animationDelay: '2s' }} />
          </g>
        ) : (
          <g stroke="#FFF9EF" fill="none" strokeWidth="1.7" strokeLinecap="round">
            <ellipse cx="120" cy="86" rx="52" ry="26" />
            <ellipse
              cx="120"
              cy="86"
              rx="42"
              ry="19"
              strokeDasharray="3 3"
              strokeOpacity="0.65"
            />
            <polygon points="104,90 112,76 120,90" fill="#FFF9EF" fillOpacity="0.18" />
            <polygon points="122,90 130,76 138,90" fill="#FFF9EF" fillOpacity="0.18" />
          </g>
        )}

        <path
          d="M42,116 Q52,96 42,76 M42,96 L33,89 M42,102 L51,95"
          stroke="#FFF9EF"
          strokeOpacity="0.45"
          strokeWidth="1.3"
          fill="none"
          className="animate-warli-sway"
        />
        <path
          d="M198,116 Q188,96 198,76 M198,96 L207,89 M198,102 L189,95"
          stroke="#FFF9EF"
          strokeOpacity="0.45"
          strokeWidth="1.3"
          fill="none"
          className="animate-warli-sway"
        />
      </svg>

      <div className="mt-1 text-center">
        <p className="text-[11px] tracking-[0.14em] uppercase text-[#F5EBDD]/80">
          {isVeg ? 'Vegetarian Kitchen' : 'Non-Veg Kitchen'}
        </p>
        <p className="text-[11px] text-[#C49A5A] mt-0.5 truncate max-w-[200px]">
          {dishName} · Photo slot
        </p>
      </div>
    </div>
  );
}

export function WarliLivingSceneOverlay() {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReducedMotion) return;

    const ctx = gsap.context(() => {
      const paths = svg.querySelectorAll<SVGGeometryElement>('.warli-stroke-draw');
      paths.forEach((p, idx) => {
        const len = p.getTotalLength ? p.getTotalLength() : 220;
        gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        gsap.to(p, {
          strokeDashoffset: 0,
          duration: 1.5,
          delay: 0.2 + idx * 0.08,
          ease: 'power2.out',
        });
      });

      const villagers = svg.querySelectorAll('.warli-actor');
      gsap.fromTo(
        villagers,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.9,
          stagger: 0.14,
          delay: 0.7,
          ease: 'power2.out',
        },
      );
    }, svgRef);

    return () => ctx.revert();
  }, []);

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 1440 720"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full pointer-events-none select-none z-10"
      aria-hidden="true"
    >
      {/* 0. Traditional Warli Radiating Sun (Upper Left-Center) */}
      <g transform="translate(275, 138)" opacity="0.72">
        <g className="animate-warli-sun">
          <circle cx="0" cy="0" r="20" fill="none" stroke="#FFF9EF" strokeWidth="1.6" />
          <circle cx="0" cy="0" r="12" fill="#C49A5A" fillOpacity="0.25" stroke="#FFF9EF" strokeWidth="1.2" />
          {Array.from({ length: 12 }).map((_, idx) => {
            const angle = (idx * 30 * Math.PI) / 180;
            const x1 = Math.cos(angle) * 23;
            const y1 = Math.sin(angle) * 23;
            const x2 = Math.cos(angle) * 33;
            const y2 = Math.sin(angle) * 33;
            return (
              <line
                key={idx}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFF9EF"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            );
          })}
        </g>
      </g>

      {/* 1. Flying Warli Birds (Two staggered flocks across the sky) */}
      <g className="animate-warli-bird" opacity="0.9">
        <g stroke="#FFF9EF" strokeWidth="2.1" fill="none" strokeLinecap="round">
          <path d="M80,120 Q92,108 104,120 Q116,108 128,120" />
          <path d="M136,144 Q145,135 154,144 Q163,135 172,144" />
          <path d="M170,112 Q178,104 186,112 Q194,104 202,112" />
        </g>
      </g>
      <g
        className="animate-warli-bird"
        style={{ animationDelay: '-11s', animationDuration: '29s' }}
        opacity="0.75"
      >
        <g stroke="#FFF9EF" strokeWidth="1.8" fill="none" strokeLinecap="round">
          <path d="M40,185 Q50,175 60,185 Q70,175 80,185" />
          <path d="M92,202 Q100,194 108,202 Q116,194 124,202" />
        </g>
      </g>

      {/* 2. Traditional Village Hut with Rising Hearth Smoke & Flickering Fire (Left foreground) */}
      <g transform="translate(46, 424)" className="warli-actor">
        {/* Smoke wisps */}
        <path
          d="M118,22 Q112,8 122,-4 Q130,-16 122,-28"
          stroke="#FFF9EF"
          strokeWidth="1.8"
          fill="none"
          className="animate-warli-smoke"
        />
        <path
          d="M132,24 Q138,10 128,-2 Q120,-14 130,-26"
          stroke="#FFF9EF"
          strokeWidth="1.5"
          fill="none"
          className="animate-warli-smoke"
          style={{ animationDelay: '1.8s' }}
        />
        {/* Thatched Hut */}
        <polygon
          points="20,90 95,28 170,90"
          fill="#542820"
          fillOpacity="0.45"
          stroke="#FFF9EF"
          strokeWidth="2.2"
          strokeLinejoin="round"
          className="warli-stroke-draw"
        />
        <line x1="95" y1="28" x2="62" y2="90" stroke="#FFF9EF" strokeWidth="1.2" opacity="0.6" />
        <line x1="95" y1="28" x2="95" y2="90" stroke="#FFF9EF" strokeWidth="1.2" opacity="0.6" />
        <line x1="95" y1="28" x2="128" y2="90" stroke="#FFF9EF" strokeWidth="1.2" opacity="0.6" />
        <rect
          x="36"
          y="90"
          width="118"
          height="68"
          fill="#542820"
          fillOpacity="0.4"
          stroke="#FFF9EF"
          strokeWidth="2.2"
          className="warli-stroke-draw"
        />
        <rect
          x="82"
          y="114"
          width="26"
          height="44"
          fill="none"
          stroke="#FFF9EF"
          strokeWidth="2"
        />
        {/* Person cooking over glowing earthen chulha */}
        <g transform="translate(182, 112)">
          <circle cx="14" cy="12" r="5" fill="#FFF9EF" />
          <polygon points="14,18 6,34 22,34" fill="#FFF9EF" />
          <polygon points="14,32 5,46 23,46" fill="#FFF9EF" />
          <path d="M20,24 L36,28" stroke="#FFF9EF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="44" cy="34" r="7" fill="none" stroke="#FFF9EF" strokeWidth="2" />
          <path
            d="M40,45 L44,39 L48,45 Z"
            fill="#C49A5A"
            className="animate-warli-flame"
          />
          <path d="M36,46 L52,46" stroke="#C49A5A" strokeWidth="2.5" />
        </g>
      </g>

      {/* 3. Swaying Village Banyan & Palm Trees (Right mid-ground) */}
      <g transform="translate(1210, 275)" className="animate-warli-sway warli-actor">
        <path
          d="M75,275 Q72,185 76,105"
          stroke="#FFF9EF"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
          className="warli-stroke-draw"
        />
        <path d="M76,140 Q42,100 22,72" stroke="#FFF9EF" strokeWidth="2.6" fill="none" className="warli-stroke-draw" />
        <path d="M76,126 Q112,92 134,62" stroke="#FFF9EF" strokeWidth="2.6" fill="none" className="warli-stroke-draw" />
        <path d="M76,110 Q66,68 74,38" stroke="#FFF9EF" strokeWidth="2.2" fill="none" className="warli-stroke-draw" />
        <g stroke="#FFF9EF" strokeWidth="1.5" fill="none" opacity="0.88">
          <path d="M22,72 L10,60 M22,72 L28,56 M22,72 L6,78" />
          <path d="M134,62 L148,50 M134,62 L126,46 M134,62 L150,70" />
          <path d="M74,38 L62,22 M74,38 L86,22 M74,38 L74,16" />
        </g>
      </g>

      {/* Secondary Swaying Palm Left */}
      <g transform="translate(15, 220)" className="animate-warli-sway warli-actor" style={{ animationDelay: '-2.5s' }}>
        <path d="M40,210 Q48,140 36,70" stroke="#FFF9EF" strokeWidth="3" fill="none" className="warli-stroke-draw" />
        <path d="M36,70 Q15,55 4,66 M36,70 Q20,42 10,36 M36,70 Q52,44 64,42 M36,70 Q62,62 68,78" stroke="#FFF9EF" strokeWidth="1.8" fill="none" />
      </g>

      {/* 4. Village Women Carrying Baskets/Pots Walking Naturally */}
      <g transform="translate(300, 520)" className="animate-warli-stroll warli-actor">
        <g className="animate-warli-walk">
          {[0, 44].map((offsetX, idx) => (
            <g key={idx} transform={`translate(${offsetX}, 0)`}>
              <ellipse
                cx="16"
                cy="6"
                rx="8"
                ry="5"
                fill="none"
                stroke="#FFF9EF"
                strokeWidth="2"
              />
              <circle cx="16" cy="18" r="5" fill="#FFF9EF" />
              <polygon points="16,24 8,40 24,40" fill="#FFF9EF" />
              <polygon points="16,38 7,56 25,56" fill="#FFF9EF" />
              <path
                d="M11,26 L4,14 L10,7 M21,26 L28,14 L22,7"
                stroke="#FFF9EF"
                strokeWidth="1.8"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M13,56 L9,74 M19,56 L24,74"
                stroke="#FFF9EF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      </g>

      {/* 5. Slow-Moving Traditional Bullock Cart with Spinning Wheel */}
      <g transform="translate(615, 534)" className="animate-warli-cart warli-actor">
        <g className="animate-warli-wheel">
          <circle cx="34" cy="48" r="16" fill="none" stroke="#FFF9EF" strokeWidth="2.2" />
          <line x1="18" y1="48" x2="50" y2="48" stroke="#FFF9EF" strokeWidth="1.3" />
          <line x1="34" y1="32" x2="34" y2="64" stroke="#FFF9EF" strokeWidth="1.3" />
          <line x1="23" y1="37" x2="45" y2="59" stroke="#FFF9EF" strokeWidth="1.3" />
          <line x1="45" y1="37" x2="23" y2="59" stroke="#FFF9EF" strokeWidth="1.3" />
        </g>
        <path
          d="M6,38 L64,38 L58,18 L12,18 Z"
          fill="#542820"
          fillOpacity="0.5"
          stroke="#FFF9EF"
          strokeWidth="2"
        />
        <line x1="64" y1="38" x2="114" y2="34" stroke="#FFF9EF" strokeWidth="2.2" />
        <circle cx="48" cy="8" r="4.5" fill="#FFF9EF" />
        <polygon points="48,13 42,24 54,24" fill="#FFF9EF" />
        <g transform="translate(105, 14)">
          <polygon points="0,18 32,14 36,30 4,32" fill="#FFF9EF" fillOpacity="0.9" />
          <circle cx="38" cy="14" r="5" fill="#FFF9EF" />
          <path d="M40,10 Q46,2 42,-2 M37,9 Q38,2 34,0" stroke="#FFF9EF" strokeWidth="1.8" fill="none" />
          <path d="M8,32 L6,48 M16,32 L18,48 M28,30 L26,48 M34,30 L37,48" stroke="#FFF9EF" strokeWidth="2" />
        </g>
      </g>

      {/* 6. Traditional Tarpa Dancers & Horn Musician (Bottom right) */}
      <g transform="translate(995, 514)" className="warli-actor">
        {/* Tarpa Player */}
        <g className="animate-warli-sway" style={{ animationDuration: '3s' }}>
          <circle cx="14" cy="14" r="5" fill="#C49A5A" />
          <polygon points="14,20 6,36 22,36" fill="#FFF9EF" />
          <polygon points="14,34 6,52 22,52" fill="#FFF9EF" />
          <path d="M18,22 L42,10 L46,16 L22,26" fill="none" stroke="#C49A5A" strokeWidth="2" />
        </g>

        {/* Hand-linked Circle Dancers */}
        <g transform="translate(52, 4)" className="animate-warli-dance">
          {[0, 34, 68, 102].map((dx, i) => (
            <g key={i} transform={`translate(${dx}, ${i % 2 === 0 ? 0 : 4})`}>
              <circle cx="14" cy="12" r="4.8" fill="#FFF9EF" />
              <polygon points="14,18 6,34 22,34" fill="#FFF9EF" />
              <polygon points="14,32 6,48 22,48" fill="#FFF9EF" />
              <path
                d="M-3,24 L14,21 L31,24"
                stroke="#FFF9EF"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d="M10,48 L7,64 M18,48 L22,64"
                stroke="#FFF9EF"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>
      </g>
    </svg>
  );
}
