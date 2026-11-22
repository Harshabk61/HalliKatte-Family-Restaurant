import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { WarliBorderPattern } from './WarliMotifs';

interface StoryChapter {
  id: string;
  numeral: string;
  title: string;
  subtitle: string;
  detail: string;
}

const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: 'hearth',
    numeral: '01',
    title: 'The Village Hearth',
    subtitle: 'Slow-cooked warmth & earthen aromas',
    detail:
      'In traditional village courtyards, the clay stove is where mornings begin — roasting whole spices, simmering broths, and welcoming neighbours with the aroma of a fresh meal.',
  },
  {
    id: 'banyan',
    numeral: '02',
    title: 'Beneath the Banyan',
    subtitle: 'Gathering under open shade',
    detail:
      'Inspired by the village katte — the stone and clay platform beneath a spreading tree where families pause to converse, share stories, and celebrate everyday milestones.',
  },
  {
    id: 'sharing',
    numeral: '03',
    title: 'Meals Shared Together',
    subtitle: 'Crafted for families of every generation',
    detail:
      'Every dish on our table is meant to be passed around, savoured slowly, and remembered fondly long after the evening winds down in Nelamangala.',
  },
  {
    id: 'art',
    numeral: '04',
    title: 'Handcrafted Folk Heritage',
    subtitle: 'White rice-paste geometry on warm terracotta',
    detail:
      'The circles, triangles, and dancing figures across our walls honour timeless Warli storytelling — celebrating nature, harvest, rhythm, and community.',
  },
];

const INTERIOR_SPACES = [
  {
    src: '/assets/aistudio/image_584b81b8.png',
    title: 'Warli Wall & Cart-Wheel Seating',
    caption: 'Hand-painted tribal wall art paired with rustic bullock-cart wheel decor.',
  },
  {
    src: '/assets/aistudio/image_8390f7cc.png',
    title: 'HK Village Courtyard',
    caption: 'Elevated green courtyard seating beneath our signature cart-wheel chandelier.',
  },
  {
    src: '/assets/aistudio/image_58df15b8.png',
    title: 'Main Dining Hall',
    caption: 'Warm timber tones, vertical garden wall, and handcrafted family tables.',
  },
  {
    src: '/assets/aistudio/image_24c7ef2f.png',
    title: 'Sacred Banyan Alcove',
    caption: 'Serene golden Buddha relief under the spreading banyan tree.',
  },
];

export function StorySection() {
  const [activeChapter, setActiveChapter] = useState<string>('hearth');
  const current =
    STORY_CHAPTERS.find((c) => c.id === activeChapter) || STORY_CHAPTERS[0];

  return (
    <section
      id="story"
      className="relative bg-[#F5EBDD] text-[#2B1915] py-20 sm:py-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
          {/* Left Column: Illustrated Warli Storybook Canvas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col"
          >
            <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] rounded-xl overflow-hidden bg-[#713B32] shadow-xl border border-[#542820]/20">
              <img
                src="/src/assets/images/warli_story_mural_1795328272823.jpg"
                alt="Traditional Warli mural depicting women cooking over earthen stoves, villagers sharing meals, and musicians beneath a sacred tree"
                loading="lazy"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover object-center transition-transform duration-700 hover:scale-[1.03]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-[#2B1915]/88 via-[#2B1915]/20 to-[#2B1915]/20"
                aria-hidden="true"
              />

              {/* Interactive Storybook Caption Overlay with Page-Turn Transition */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-[#FFF9EF]">
                <WarliBorderPattern
                  color="#FFF9EF"
                  opacity={0.5}
                  className="mb-4"
                />
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                  >
                    <p className="text-xs tracking-[0.18em] uppercase text-[#C49A5A] font-semibold">
                      Chapter {current.numeral} · {current.subtitle}
                    </p>
                    <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#FFF9EF] mt-1">
                      {current.title}
                    </h3>
                    <p className="mt-2 text-sm sm:text-base text-[#F5EBDD]/90 leading-relaxed max-w-lg">
                      {current.detail}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Editorial Brand Narrative + Storybook Chapter Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            className="lg:col-span-6 flex flex-col justify-between py-2"
          >
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#713B32]">
                Our Story · Nelamangala, Bengaluru
              </p>

              <h2 className="mt-3 font-display text-4xl sm:text-5xl font-semibold text-[#2B1915] leading-[1.1] text-balance">
                Rooted in Tradition. Made for Togetherness.
              </h2>

              <div className="mt-6 space-y-4 text-base sm:text-lg text-[#2B1915]/85 leading-relaxed max-w-xl">
                <p className="font-display text-2xl italic text-[#542820]">
                  Some places serve food. Some places create memories.
                </p>
                <p>
                  At HalliKatte, we celebrate the warmth of coming together, the
                  joy of sharing a meal and the traditions that make every
                  gathering special.
                </p>
                <p>
                  Inspired by the beauty of village life, we bring people
                  together through flavour, hospitality and memorable dining
                  experiences.
                </p>
              </div>
            </div>

            {/* Interactive Storybook Chapters */}
            <div className="mt-10 pt-8 border-t border-[#713B32]/20">
              <div className="flex items-center gap-2.5 mb-4">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 text-[#8B493B] animate-warli-flame shrink-0"
                  aria-hidden="true"
                >
                  <polygon
                    points="12,3 5,18 19,18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                  />
                  <circle cx="12" cy="13" r="2" fill="currentColor" />
                </svg>
                <p className="text-xs tracking-[0.16em] uppercase font-semibold text-[#542820]">
                  Turn the Pages of Our Village
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {STORY_CHAPTERS.map((chapter, idx) => {
                  const isSelected = chapter.id === activeChapter;
                  return (
                    <motion.button
                      key={chapter.id}
                      type="button"
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, amount: 0.2 }}
                      transition={{ duration: 0.35, delay: idx * 0.06 }}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setActiveChapter(chapter.id)}
                      className={`text-left p-4 rounded-lg border transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#713B32] ${
                        isSelected
                          ? 'bg-[#713B32] text-[#FFF9EF] border-[#713B32] shadow-md'
                          : 'bg-[#FFF9EF]/70 text-[#2B1915] border-[#713B32]/20 hover:border-[#713B32]/50 hover:bg-[#FFF9EF]'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span
                          className={`font-mono text-xs tabular-nums ${
                            isSelected ? 'text-[#C49A5A]' : 'text-[#8B493B]'
                          }`}
                        >
                          {chapter.numeral}
                        </span>
                        <span
                          className={`text-[11px] ${
                            isSelected ? 'text-[#F5EBDD]/80' : 'text-[#2B1915]/60'
                          }`}
                        >
                          {isSelected ? 'Reading' : 'Select'}
                        </span>
                      </div>
                      <p className="mt-1 font-display text-lg font-semibold">
                        {chapter.title}
                      </p>
                      <p
                        className={`mt-0.5 text-xs leading-snug ${
                          isSelected ? 'text-[#F5EBDD]/85' : 'text-[#2B1915]/70'
                        }`}
                      >
                        {chapter.subtitle}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Authentic Restaurant Interior Showcase on Home Screen */}
        <div className="mt-20 pt-14 border-t border-[#713B32]/20">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#713B32]">
                Step Inside HalliKatte
              </p>
              <h3 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#2B1915]">
                Our Village Dining Spaces
              </h3>
            </div>
            <p className="text-sm text-[#2B1915]/75 max-w-md">
              Hand-painted Warli murals, bullock-cart wheel tables, and warm
              courtyard alcoves welcoming families in Nelamangala.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {INTERIOR_SPACES.map((space, idx) => (
              <motion.figure
                key={space.src}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="rounded-xl overflow-hidden bg-[#FFF9EF] border border-[#713B32]/20 shadow-sm hover:shadow-lg transition-shadow group"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#542820]">
                  <img
                    src={space.src}
                    alt={space.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <figcaption className="p-4">
                  <p className="font-display text-xl font-semibold text-[#2B1915]">
                    {space.title}
                  </p>
                  <p className="mt-1 text-xs text-[#2B1915]/75 leading-relaxed">
                    {space.caption}
                  </p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
