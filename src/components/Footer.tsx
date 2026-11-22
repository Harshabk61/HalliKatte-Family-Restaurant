import { ShieldCheck } from 'lucide-react';
import { RestaurantSettings } from '../types';
import { WarliBorderPattern } from './WarliMotifs';

interface FooterProps {
  settings: RestaurantSettings;
  onNavigate: (sectionId: string) => void;
  onOpenAdmin: () => void;
}

export function Footer({ settings, onNavigate, onOpenAdmin }: FooterProps) {
  const instagramUrl =
    settings.instagram_url !== undefined
      ? settings.instagram_url.trim()
      : 'https://share.google/RT42hbaTdWeYelrdO';
  const facebookUrl = settings.facebook_url?.trim();
  const phone =
    settings.phone !== undefined ? settings.phone.trim() : '+91 97318 10145';
  const openingHours =
    settings.opening_hours !== undefined
      ? settings.opening_hours.trim()
      : 'Open Daily: 12:00 PM – 9:30 PM';

  return (
    <footer className="bg-[#542820] text-[#FFF9EF]">
      <WarliBorderPattern color="#FFF9EF" opacity={0.4} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-[#FFF9EF]/15">
          {/* Brand Column */}
          <div className="md:col-span-5">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#FFF9EF]">
              HalliKatte
            </h2>
            <p className="text-xs tracking-[0.2em] uppercase text-[#C49A5A] mt-1">
              Family Restaurant · Nelamangala
            </p>
            <p className="mt-4 text-sm text-[#F5EBDD]/85 leading-relaxed max-w-sm">
              A journey into our village — where tradition meets taste. Rooted
              in warm hospitality and timeless moments shared around the table.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('reservations')}
              className="mt-6 px-5 py-2.5 bg-[#C49A5A] hover:bg-[#d4ac6e] text-[#2B1915] font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
            >
              Reserve Your Table
            </button>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C49A5A]">
              Explore
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F5EBDD]/85">
              {[
                { id: 'home', label: 'Home' },
                { id: 'story', label: 'Our Story' },
                { id: 'menu', label: 'Food Menu' },
                { id: 'gallery', label: 'Photo Gallery' },
                { id: 'reservations', label: 'Reservations' },
                { id: 'reviews', label: 'Happy Customers & Reviews' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <li key={link.id}>
                  <a
                    href={`#${link.id}`}
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate(link.id);
                    }}
                    className="hover:text-[#FFF9EF] transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Kitchen Highlights */}
          <div className="md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C49A5A]">
              Kitchen
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-[#F5EBDD]/85">
              {[
                'Combos & Ragi Meals',
                'Main Course',
                'Tandoori Breads',
                'Rice, Biryani & Starters',
                'Rolls, Soups & Milkshakes',
              ].map((label) => (
                <li key={label}>
                  <a
                    href="#menu"
                    onClick={(e) => {
                      e.preventDefault();
                      onNavigate('menu');
                    }}
                    className="hover:text-[#FFF9EF] transition-colors"
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Location & Contact */}
          <div className="md:col-span-3 space-y-3 text-sm text-[#F5EBDD]/85">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#C49A5A]">
              Visit & Hours
            </p>
            <p className="leading-relaxed">
              BH Road, near Guru Bhavan, Jyothi Nagar, Nelamangala Town,
              Bengaluru, Karnataka 562123
            </p>
            {phone && (
              <p className="font-mono text-xs text-[#FFF9EF] tabular-nums">
                Tel: {phone}
              </p>
            )}
            {openingHours && (
              <p className="text-xs text-[#F5EBDD]/75">{openingHours}</p>
            )}

            {(instagramUrl || facebookUrl) && (
              <div className="pt-2 flex items-center gap-4 text-xs font-semibold">
                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C49A5A] hover:underline"
                  >
                    Instagram
                  </a>
                )}
                {facebookUrl && (
                  <a
                    href={facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#C49A5A] hover:underline"
                  >
                    Facebook
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F5EBDD]/70">
          <p>
            © {new Date().getFullYear()} HalliKatte Family Restaurant,
            Nelamangala. All rights reserved.
          </p>

          <button
            type="button"
            onClick={onOpenAdmin}
            className="inline-flex items-center gap-1.5 text-xs text-[#F5EBDD]/75 hover:text-[#FFF9EF] transition-colors cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-[#C49A5A]" />
            <span>Owner & Staff Portal</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
