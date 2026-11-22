import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Camera, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { GalleryImageRecord } from '../types';

const GALLERY_SECTIONS = [
  'All',
  'Our Food',
  'Restaurant Ambience',
  'Family Dining',
  'Special Moments',
  'Kitchen & Preparation',
];

export function GallerySection() {
  const [images, setImages] = useState<GalleryImageRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('All');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetch('/api/gallery')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setImages(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredImages = useMemo(() => {
    if (activeSection === 'All') return images;
    return images.filter((img) => img.section === activeSection);
  }, [images, activeSection]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLightboxIndex(null);
      } else if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) =>
          prev === null ? null : (prev + 1) % filteredImages.length,
        );
      } else if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + filteredImages.length) % filteredImages.length,
        );
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex, filteredImages.length]);

  const activeLightboxItem =
    lightboxIndex !== null ? filteredImages[lightboxIndex] : null;

  return (
    <section
      id="gallery"
      className="relative bg-[#F5EBDD] text-[#2B1915] py-20 sm:py-28"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#713B32]/20"
        >
          <div>
            <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#713B32]">
              Visual Chronicles
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#2B1915] text-balance">
              Moments &amp; Spaces at HalliKatte
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#2B1915]/75 max-w-2xl">
              Explore our Warli-painted dining halls, bullock-cart courtyard
              seating, family celebrations, and joyful gatherings in Nelamangala.
            </p>
          </div>
        </motion.div>

        {/* Section Filter Tabs with Spring Pill */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto pb-2">
          {GALLERY_SECTIONS.map((sec) => {
            const active = activeSection === sec;
            return (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setActiveSection(sec);
                  setLightboxIndex(null);
                }}
                className={`relative px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border ${
                  active
                    ? 'text-[#FFF9EF] border-[#713B32]'
                    : 'bg-[#FFF9EF] text-[#2B1915] border-[#713B32]/20 hover:border-[#713B32]'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="gallery-cat-active"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    className="absolute inset-0 bg-[#713B32] rounded-[7px]"
                  />
                )}
                <span className="relative z-10">{sec}</span>
              </button>
            );
          })}
        </div>

        {/* Masonry-style Responsive Grid */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl bg-[#713B32]/15 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="mt-10 columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
            {filteredImages.map((img, index) => (
              <motion.figure
                key={img.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.38, delay: (index % 3) * 0.06 }}
                whileHover={{ y: -3 }}
                onClick={() => setLightboxIndex(index)}
                className="break-inside-avoid rounded-xl overflow-hidden bg-[#FFF9EF] border border-[#713B32]/20 shadow-sm hover:shadow-xl transition-shadow duration-300 cursor-pointer group"
              >
                {img.imageUrl ? (
                  <div className="relative overflow-hidden bg-[#542820]">
                    <img
                      src={img.imageUrl}
                      alt={img.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div
                    className={`relative w-full ${
                      index % 2 === 0 ? 'h-64' : 'h-52'
                    } bg-[#713B32] flex flex-col items-center justify-center p-6 text-center text-[#FFF9EF] overflow-hidden`}
                  >
                    <div className="w-12 h-12 rounded-full border border-[#C49A5A]/60 flex items-center justify-center mb-3 transition-transform duration-300 group-hover:scale-110">
                      <Camera className="w-5 h-5 text-[#C49A5A]" />
                    </div>
                    <p className="text-[11px] tracking-[0.16em] uppercase text-[#C49A5A] font-semibold">
                      {img.section}
                    </p>
                    <p className="mt-1 font-display text-xl text-[#FFF9EF]">
                      {img.title}
                    </p>
                    <p className="mt-1.5 text-xs text-[#F5EBDD]/75 max-w-[230px]">
                      Replaceable photo placeholder — awaiting owner upload
                    </p>
                  </div>
                )}

                <figcaption className="p-4 border-t border-[#713B32]/10">
                  <p className="text-[11px] uppercase tracking-wider text-[#8B493B] font-semibold">
                    {img.section}
                  </p>
                  <p className="mt-0.5 font-display text-xl font-semibold text-[#2B1915]">
                    {img.title}
                  </p>
                  <p className="mt-1 text-xs text-[#2B1915]/70 leading-relaxed">
                    {img.caption}
                  </p>
                </figcaption>
              </motion.figure>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox with AnimatePresence */}
      <AnimatePresence>
        {activeLightboxItem && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 z-50 bg-[#2B1915]/92 flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={activeLightboxItem.title}
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxIndex(null)}
              aria-label="Close Lightbox"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-[#542820] text-[#FFF9EF] flex items-center justify-center hover:bg-[#713B32] cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {filteredImages.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(
                      (lightboxIndex - 1 + filteredImages.length) %
                        filteredImages.length,
                    );
                  }}
                  className="absolute left-3 sm:left-6 w-11 h-11 rounded-full bg-[#542820] text-[#FFF9EF] flex items-center justify-center hover:bg-[#713B32] cursor-pointer transition-colors z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex((lightboxIndex + 1) % filteredImages.length);
                  }}
                  className="absolute right-3 sm:right-6 w-11 h-11 rounded-full bg-[#542820] text-[#FFF9EF] flex items-center justify-center hover:bg-[#713B32] cursor-pointer transition-colors z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <motion.div
              key={activeLightboxItem.id}
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              className="max-w-3xl w-full bg-[#F5EBDD] text-[#2B1915] rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {activeLightboxItem.imageUrl ? (
                <img
                  src={activeLightboxItem.imageUrl}
                  alt={activeLightboxItem.title}
                  referrerPolicy="no-referrer"
                  className="w-full max-h-[70vh] object-contain bg-[#2B1915]"
                />
              ) : (
                <div className="h-72 sm:h-96 bg-[#713B32] flex flex-col items-center justify-center text-center p-8 text-[#FFF9EF]">
                  <Camera className="w-10 h-10 text-[#C49A5A] mb-3" />
                  <p className="font-display text-3xl">{activeLightboxItem.title}</p>
                  <p className="mt-2 text-sm text-[#F5EBDD]/80 max-w-md">
                    This gallery slot is ready for a real photograph of{' '}
                    {activeLightboxItem.section} uploaded by the restaurant owner.
                  </p>
                </div>
              )}
              <div className="p-5 sm:p-6">
                <p className="text-xs uppercase tracking-wider text-[#713B32] font-semibold">
                  {activeLightboxItem.section}
                </p>
                <h3 className="mt-1 font-display text-2xl font-semibold">
                  {activeLightboxItem.title}
                </h3>
                <p className="mt-1 text-sm text-[#2B1915]/75">
                  {activeLightboxItem.caption}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
