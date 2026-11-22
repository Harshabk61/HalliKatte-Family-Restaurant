import React, { useEffect, useState } from 'react';
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useAdvancedMarkerRef,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import {
  Clock,
  ExternalLink,
  Instagram,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from 'lucide-react';
import { RestaurantSettings } from '../types';

const GOOGLE_MAPS_DIRECTIONS_URL = 'https://maps.app.goo.gl/RMeeYGb8hESbLoJN7';

interface ResolvedPlace {
  lat: number;
  lng: number;
  displayName?: string;
  formattedAddress?: string;
  businessStatus?: string;
}

function HalliKatteMapContent() {
  const placesLib = useMapsLibrary('places');
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [infoOpen, setInfoOpen] = useState(true);
  const [placeData, setPlaceData] = useState<ResolvedPlace | null>(null);

  // Initial viewport center for Nelamangala Town, Bengaluru until Places API resolves
  const [center, setCenter] = useState<{ lat: number; lng: number }>({
    lat: 13.0996,
    lng: 77.3932,
  });

  useEffect(() => {
    if (!placesLib) return;
    let active = true;

    async function locateRestaurant() {
      try {
        const { places } = await placesLib!.Place.searchByText({
          textQuery:
            'HalliKatte Family Restaurant BH Road near Guru Bhavan Jyothi Nagar Nelamangala Bengaluru 562123',
          fields: [
            'displayName',
            'location',
            'formattedAddress',
            'businessStatus',
          ],
          maxResultCount: 1,
          region: 'in',
        });

        if (!active || !places || places.length === 0) return;
        const match = places[0];
        if (match.location) {
          const lat = match.location.lat();
          const lng = match.location.lng();
          setCenter({ lat, lng });
          setPlaceData({
            lat,
            lng,
            displayName: match.displayName ?? undefined,
            formattedAddress: match.formattedAddress ?? undefined,
            businessStatus: match.businessStatus ?? undefined,
          });
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('Quota') ||
          msg.includes('429')
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
      }
    }

    locateRestaurant();
    return () => {
      active = false;
    };
  }, [placesLib]);

  return (
    <GoogleMap
      mapId="DEMO_MAP_ID"
      center={center}
      defaultZoom={16}
      gestureHandling="cooperative"
      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
      className="w-full h-full"
    >
      <AdvancedMarker
        ref={markerRef}
        position={center}
        onClick={() => setInfoOpen((v) => !v)}
        title={placeData?.displayName || 'HalliKatte Family Restaurant'}
      >
        <Pin
          background="#713B32"
          borderColor="#FFF9EF"
          glyphColor="#C49A5A"
          scale={1.25}
        />
      </AdvancedMarker>

      {infoOpen && marker && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => setInfoOpen(false)}
          maxWidth={260}
        >
          <div className="p-1 text-[#2B1915]">
            <p className="font-semibold text-sm">
              {placeData?.displayName || 'HalliKatte Family Restaurant'}
            </p>
            <p className="text-xs text-[#542820] mt-1 leading-snug">
              {placeData?.formattedAddress ||
                'BH Road, near Guru Bhavan, Jyothi Nagar, Nelamangala Town, Bengaluru 562123'}
            </p>
            <a
              href={GOOGLE_MAPS_DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs font-semibold text-[#713B32] underline"
            >
              Open in Google Maps
            </a>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}

interface LocationContactSectionProps {
  settings: RestaurantSettings;
}

export function LocationContactSection({
  settings,
}: LocationContactSectionProps) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sentSuccess, setSentSuccess] = useState(false);

  const verifiedPhone =
    settings.phone !== undefined ? settings.phone.trim() : '+91 97318 10145';
  const verifiedWhatsapp =
    settings.whatsapp !== undefined
      ? settings.whatsapp.trim() || verifiedPhone
      : '919731810145';
  const instagramUrl =
    settings.instagram_url !== undefined
      ? settings.instagram_url.trim()
      : 'https://share.google/RT42hbaTdWeYelrdO';
  const openingHours =
    settings.opening_hours !== undefined
      ? settings.opening_hours.trim()
      : 'Open Daily: 12:00 PM – 9:30 PM';

  const cleanDial = verifiedPhone.replace(/[^+\d]/g, '');
  const cleanWa = verifiedWhatsapp.replace(/\D/g, '');

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    setSendError(null);
    setSentSuccess(false);

    setSending(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: email.trim() || null,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not send message.');
      }
      setSentSuccess(true);
      setName('');
      setPhone('');
      setEmail('');
      setMessage('');
    } catch (err) {
      setSendError(
        err instanceof Error ? err.message : 'Unable to send message.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative bg-[#F5EBDD] text-[#2B1915] py-20 sm:py-28 border-t border-[#713B32]/15"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#713B32]">
            Visit Us in Nelamangala
          </p>
          <h2 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#2B1915] text-balance">
            Come, Be Part of Our Story.
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
          {/* Left Column: Address, Hours, Actions & Contact Form */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-8">
            <div className="p-6 sm:p-8 rounded-2xl bg-[#FFF9EF] border border-[#713B32]/20 shadow-sm space-y-6">
              <div>
                <h3 className="font-display text-2xl font-semibold text-[#542820]">
                  HalliKatte Family Restaurant
                </h3>
                <div className="mt-3 flex items-start gap-3 text-sm text-[#2B1915]/85 leading-relaxed">
                  <MapPin className="w-4 h-4 text-[#713B32] shrink-0 mt-1" />
                  <p>
                    BH Road, near Guru Bhavan,
                    <br />
                    Jyothi Nagar, Nelamangala Town,
                    <br />
                    Bengaluru, Karnataka 562123, India.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#713B32]/15 flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-[#713B32] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#542820]">Opening Hours</p>
                  <p className="text-[#2B1915]/80 mt-0.5">{openingHours}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-[#713B32]/15 flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-[#713B32] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#542820]">Phone</p>
                  <p className="text-[#2B1915]/80 mt-0.5 font-mono tabular-nums">
                    {verifiedPhone ||
                      'Contact number pending owner confirmation'}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap gap-3">
                <a
                  href={GOOGLE_MAPS_DIRECTIONS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Get Directions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                {cleanDial ? (
                  <a
                    href={`tel:${cleanDial}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#713B32] text-[#713B32] hover:bg-[#713B32] hover:text-[#FFF9EF] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call Now</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Owner has not yet confirmed the restaurant phone number"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#713B32]/25 text-[#2B1915]/45 text-xs font-semibold rounded-lg cursor-not-allowed whitespace-nowrap shrink-0"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call (Pending Number)</span>
                  </button>
                )}

                {cleanWa ? (
                  <a
                    href={`https://wa.me/${cleanWa}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-emerald-800 text-emerald-900 hover:bg-emerald-800 hover:text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Owner has not yet confirmed a WhatsApp number"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#713B32]/25 text-[#2B1915]/45 text-xs font-semibold rounded-lg cursor-not-allowed whitespace-nowrap shrink-0"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp (Pending)</span>
                  </button>
                )}

                {instagramUrl && (
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#713B32]/40 text-[#542820] hover:bg-[#542820] hover:text-[#FFF9EF] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    <span>Instagram</span>
                  </a>
                )}
              </div>
            </div>

            {/* Contact Message Form */}
            <form
              onSubmit={handleContactSubmit}
              className="p-6 sm:p-8 rounded-2xl bg-[#FFF9EF] border border-[#713B32]/20 shadow-sm space-y-4"
            >
              <h3 className="font-display text-2xl font-semibold text-[#542820]">
                Send Us a Message
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name *"
                  aria-label="Your Name"
                  className="w-full px-3.5 py-2.5 bg-[#F5EBDD]/60 border border-[#713B32]/20 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone Number *"
                  aria-label="Phone Number"
                  className="w-full px-3.5 py-2.5 bg-[#F5EBDD]/60 border border-[#713B32]/20 rounded-lg text-sm font-mono tabular-nums text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email (Optional)"
                aria-label="Email Address"
                className="w-full px-3.5 py-2.5 bg-[#F5EBDD]/60 border border-[#713B32]/20 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
              />

              <textarea
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Questions about family dining, group events, or catering..."
                aria-label="Message"
                className="w-full px-3.5 py-2.5 bg-[#F5EBDD]/60 border border-[#713B32]/20 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
              />

              {sendError && (
                <p role="alert" className="text-xs text-red-800">
                  {sendError}
                </p>
              )}
              {sentSuccess && (
                <p className="text-xs text-emerald-800 font-medium">
                  Thank you — your message has been received by the HalliKatte
                  team.
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full py-3 px-4 bg-[#713B32] hover:bg-[#542820] disabled:opacity-50 text-[#FFF9EF] text-sm font-semibold rounded-lg inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{sending ? 'Sending...' : 'Send Message'}</span>
              </button>
            </form>
          </div>

          {/* Right Column: Interactive Google Map */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative flex-1 min-h-[420px] lg:min-h-[600px] w-full rounded-2xl overflow-hidden border border-[#713B32]/25 shadow-md bg-[#713B32]/10">
              {apiKey ? (
                <APIProvider
                  apiKey={apiKey}
                  libraries={['places', 'marker']}
                  language="en"
                  region="IN"
                >
                  <HalliKatteMapContent />
                </APIProvider>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-[#713B32] text-[#FFF9EF]">
                  <MapPin className="w-10 h-10 text-[#C49A5A] mb-3" />
                  <p className="font-display text-2xl">
                    HalliKatte Family Restaurant
                  </p>
                  <p className="mt-2 text-sm text-[#F5EBDD]/85 max-w-md">
                    BH Road, near Guru Bhavan, Jyothi Nagar, Nelamangala Town,
                    Bengaluru, Karnataka 562123, India.
                  </p>
                  <a
                    href={GOOGLE_MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 px-5 py-2.5 bg-[#C49A5A] text-[#2B1915] font-semibold text-sm rounded-lg"
                  >
                    Open in Google Maps
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
