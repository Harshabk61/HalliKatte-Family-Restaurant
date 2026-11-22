import { useCallback, useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { StorySection } from './components/StorySection';
import { MenuSection } from './components/MenuSection';
import { ReservationSection } from './components/ReservationSection';
import { GallerySection } from './components/GallerySection';
import { LocationContactSection } from './components/LocationContactSection';
import { HappyCustomersSection } from './components/HappyCustomersSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { RestaurantSettings } from './types';

function HalliKatteApp() {
  const [activeSection, setActiveSection] = useState('home');
  const [settings, setSettings] = useState<RestaurantSettings>({});
  const [adminOpen, setAdminOpen] = useState(false);
  const [prefilledResNotes, setPrefilledResNotes] = useState('');
  const [mapsQuotaExceeded, setMapsQuotaExceeded] = useState(false);

  // Listen for Google Maps Platform Demo Key quota limit events
  useEffect(() => {
    const onQuota = () => setMapsQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  // Load restaurant settings from PostgreSQL
  useEffect(() => {
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => {
        if (data && typeof data === 'object') {
          setSettings(data as RestaurantSettings);
        }
      })
      .catch(() => {});
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const sectionIds = [
      'home',
      'story',
      'menu',
      'gallery',
      'reservations',
      'contact',
      'reviews',
    ];
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0.05 },
    );

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const navigateTo = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleReserveWithOrderNotes = useCallback(
    (notes: string) => {
      setPrefilledResNotes(notes);
      navigateTo('reservations');
    },
    [navigateTo],
  );

  const onlineOrderingEnabled =
    settings.online_ordering_enabled !== 'false';

  return (
    <div className="min-h-screen bg-[#713B32] text-[#2B1915]">
      {mapsQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      <Navbar activeSection={activeSection} onNavigate={navigateTo} />

      <main>
        <HeroSection
          onExploreMenu={() => navigateTo('menu')}
          onReserveTable={() => navigateTo('reservations')}
        />

        <StorySection />

        <MenuSection
          onlineOrderingEnabled={onlineOrderingEnabled}
          onReserveWithOrderNotes={handleReserveWithOrderNotes}
        />

        <GallerySection />

        <ReservationSection prefilledNotes={prefilledResNotes} />

        <LocationContactSection settings={settings} />

        <HappyCustomersSection />
      </main>

      <Footer
        settings={settings}
        onNavigate={navigateTo}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      {adminOpen && (
        <AdminDashboard
          onClose={() => setAdminOpen(false)}
          onSettingsUpdated={(next) => setSettings(next)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <HalliKatteApp />
    </AuthProvider>
  );
}
