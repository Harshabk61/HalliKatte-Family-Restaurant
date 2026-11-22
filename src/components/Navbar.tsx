import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Menu, X } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'story', label: 'Our Story' },
  { id: 'menu', label: 'Menu' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'reservations', label: 'Reservations' },
  { id: 'contact', label: 'Contact' },
  { id: 'reviews', label: 'Reviews' },
];

export function Navbar({ activeSection, onNavigate }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 48);
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(
        docHeight > 0 ? Math.min(Math.max(y / docHeight, 0), 1) : 0,
      );
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLinkClick = (id: string) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-[#542820]/95 shadow-lg border-b border-[#C49A5A]/25 py-3'
          : 'bg-gradient-to-b from-[#2B1915]/70 to-transparent py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="font-display text-2xl sm:text-3xl font-semibold tracking-wide text-[#FFF9EF] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A5A] rounded"
        >
          HalliKatte
        </a>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <a
                key={item.id}
                href={`#${item.id}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.id);
                }}
                className={`relative text-sm font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors duration-200 py-1 ${
                  isActive
                    ? 'text-[#FFF9EF]'
                    : 'text-[#F5EBDD]/80 hover:text-[#FFF9EF]'
                }`}
              >
                {item.label}
                {isActive && (
                  <motion.span
                    layoutId="nav-active-underline"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#C49A5A]"
                  />
                )}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary CTA + mobile menu toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('reservations')}
            className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 text-sm font-semibold tracking-wide bg-[#C49A5A] text-[#2B1915] hover:bg-[#d4ac6e] rounded-lg transition-all duration-150 hover:-translate-y-0.5 active:translate-y-0 whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9EF] cursor-pointer"
          >
            Book a Table
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-lg text-[#FFF9EF] hover:bg-[#FFF9EF]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A5A] cursor-pointer"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Razor-thin muted-gold scroll progress bar */}
      <div
        aria-hidden="true"
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#C49A5A] origin-left pointer-events-none transition-opacity duration-200"
        style={{
          transform: `scaleX(${scrollProgress})`,
          opacity: scrolled ? 0.9 : 0,
        }}
      />

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="lg:hidden overflow-hidden bg-[#542820] border-t border-[#C49A5A]/25 shadow-xl"
          >
            <nav aria-label="Mobile Navigation" className="flex flex-col gap-1 px-4 py-4">
              {NAV_ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleLinkClick(item.id);
                    }}
                    className={`px-3 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'bg-[#713B32] text-[#FFF9EF]'
                        : 'text-[#F5EBDD]/90 hover:bg-[#713B32]/50 hover:text-[#FFF9EF]'
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
              <button
                type="button"
                onClick={() => handleLinkClick('reservations')}
                className="mt-3 w-full py-3 px-4 bg-[#C49A5A] text-[#2B1915] font-semibold rounded-lg text-center hover:bg-[#d4ac6e] transition-colors cursor-pointer"
              >
                Book a Table
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
