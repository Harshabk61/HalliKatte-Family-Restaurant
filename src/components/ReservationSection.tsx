import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, CheckCircle2, Clock, Search, Users } from 'lucide-react';
import { AvailabilitySlot, ReservationRecord } from '../types';

interface ReservationSectionProps {
  prefilledNotes?: string;
}

function getTodayIstDate(): string {
  const nowIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return nowIst.toISOString().slice(0, 10);
}

export function ReservationSection({
  prefilledNotes = '',
}: ReservationSectionProps) {
  const [activeTab, setActiveTab] = useState<'book' | 'manage'>('book');
  const todayStr = getTodayIstDate();

  // Booking form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [reservationDate, setReservationDate] = useState(todayStr);
  const [guests, setGuests] = useState(4);
  const [reservationTime, setReservationTime] = useState('');
  const [occasion, setOccasion] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');

  // Availability state
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] =
    useState<ReservationRecord | null>(null);

  // Lookup / Manage booking state
  const [lookupRef, setLookupRef] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [foundBooking, setFoundBooking] = useState<ReservationRecord | null>(
    null,
  );
  const [isEditingBooking, setIsEditingBooking] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editGuests, setEditGuests] = useState(4);
  const [editRequests, setEditRequests] = useState('');
  const [manageFeedback, setManageFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledNotes) {
      setActiveTab('book');
      setSpecialRequests((prev) =>
        prev.includes(prefilledNotes)
          ? prev
          : prev
            ? `${prev}\n${prefilledNotes}`
            : prefilledNotes,
      );
    }
  }, [prefilledNotes]);

  useEffect(() => {
    if (!reservationDate) return;
    let active = true;
    setLoadingSlots(true);
    setSlotsError(null);
    fetch(
      `/api/reservations/availability?date=${encodeURIComponent(
        reservationDate,
      )}&guests=${guests}`,
    )
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not check slots.');
        return data;
      })
      .then((data) => {
        if (!active) return;
        const list: AvailabilitySlot[] = data.slots || [];
        setSlots(list);
        setReservationTime((prev) => {
          const stillAvailable = list.find(
            (s) => s.time === prev && s.available,
          );
          if (stillAvailable) return prev;
          return list.find((s) => s.available)?.time || '';
        });
      })
      .catch((err) => {
        if (!active) return;
        setSlotsError(
          err instanceof Error
            ? err.message
            : 'Unable to check table availability.',
        );
        setSlots([]);
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });

    return () => {
      active = false;
    };
  }, [reservationDate, guests]);

  const resetBookingForm = () => {
    setCustomerName('');
    setPhone('');
    setEmail('');
    setReservationDate(todayStr);
    setGuests(4);
    setOccasion('');
    setSpecialRequests('');
    setSubmitError(null);
    setConfirmedBooking(null);
  };

  const handleBookSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);

    if (customerName.trim().length < 2) {
      setSubmitError('Please enter your full name.');
      return;
    }
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setSubmitError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!reservationDate || reservationDate < todayStr) {
      setSubmitError('Please choose today or an upcoming date.');
      return;
    }
    if (!reservationTime) {
      setSubmitError('Please select an available dining time slot.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customerName.trim(),
          phone: cleanPhone.slice(-10),
          email: email.trim() || null,
          reservationDate,
          reservationTime,
          guests,
          occasion: occasion || null,
          specialRequests: specialRequests.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not save reservation.');
      }
      setConfirmedBooking(data.reservation);
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : 'Failed to save reservation. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setManageFeedback(null);
    setFoundBooking(null);

    const cleanPhone = lookupPhone.replace(/\D/g, '');
    if (!lookupRef.trim() || cleanPhone.length < 10) {
      setLookupError(
        'Enter both your booking reference (e.g. HK-XXXXXX) and 10-digit phone number.',
      );
      return;
    }

    setLookupLoading(true);
    try {
      const res = await fetch(
        `/api/reservations/lookup?bookingRef=${encodeURIComponent(
          lookupRef.trim().toUpperCase(),
        )}&phone=${encodeURIComponent(cleanPhone.slice(-10))}`,
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Reservation not found.');
      }
      setFoundBooking(data.reservation);
      setEditDate(data.reservation.reservationDate);
      setEditTime(data.reservation.reservationTime);
      setEditGuests(data.reservation.guests);
      setEditRequests(data.reservation.specialRequests || '');
      setIsEditingBooking(false);
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : 'Unable to find booking.',
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundBooking) return;
    setLookupError(null);
    setManageFeedback(null);
    setLookupLoading(true);

    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(foundBooking.bookingRef)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: foundBooking.phone,
            reservationDate: editDate,
            reservationTime: editTime,
            guests: editGuests,
            specialRequests: editRequests,
          }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to update reservation.');
      }
      setFoundBooking({ ...foundBooking, ...data.reservation });
      setIsEditingBooking(false);
      setManageFeedback('Your reservation details have been updated.');
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : 'Unable to update reservation.',
      );
    } finally {
      setLookupLoading(false);
    }
  };

  const handleCancelFoundBooking = async () => {
    if (!foundBooking) return;
    setLookupError(null);
    setManageFeedback(null);
    setLookupLoading(true);

    try {
      const res = await fetch(
        `/api/reservations/${encodeURIComponent(
          foundBooking.bookingRef,
        )}/cancel`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: foundBooking.phone }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Unable to cancel reservation.');
      }
      setFoundBooking({ ...foundBooking, ...data.reservation });
      setManageFeedback('Your reservation has been cancelled.');
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : 'Unable to cancel reservation.',
      );
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <section
      id="reservations"
      className="relative bg-[#713B32] text-[#FFF9EF] py-20 sm:py-28"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Mode Switcher */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#FFF9EF]/15"
        >
          <div>
            <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C49A5A]">
              Table Reservations
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#FFF9EF] text-balance">
              Reserve Your Family Table
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#F5EBDD]/85 max-w-xl">
              Live table availability checked directly against our dining hall
              in Nelamangala. Instant booking reference upon confirmation.
            </p>
          </div>

          <div className="inline-flex items-center gap-1 p-1 bg-[#542820] rounded-lg border border-[#FFF9EF]/20 self-start md:self-auto">
            {(
              [
                { id: 'book', label: 'New Reservation' },
                { id: 'manage', label: 'Check / Manage Booking' },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#2B1915]'
                      : 'text-[#F5EBDD]/85 hover:text-[#FFF9EF]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="reservation-tab-pill"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      className="absolute inset-0 bg-[#C49A5A] rounded-md"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.55 }}
          className="mt-10 bg-[#F5EBDD] text-[#2B1915] rounded-2xl shadow-xl border border-[#C49A5A]/35 overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'book' ? (
              confirmedBooking ? (
                <motion.div
                  key="booking-confirmed"
                  initial={{ opacity: 0, scale: 0.97, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.97, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="p-8 sm:p-12 text-center max-w-2xl mx-auto"
                >
                  <motion.div
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 20 }}
                  >
                    <CheckCircle2 className="w-12 h-12 text-emerald-800 mx-auto" />
                  </motion.div>
                  <p className="mt-4 text-xs tracking-[0.18em] uppercase font-semibold text-[#713B32]">
                    Reservation Saved · Status: {confirmedBooking.status}
                  </p>
                  <h3 className="mt-2 font-display text-3xl sm:text-4xl font-semibold text-[#2B1915]">
                    We Look Forward to Welcoming You
                  </h3>

                  <div className="mt-6 p-6 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20 text-left grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#542820]/70">
                        Reference
                      </p>
                      <p className="mt-1 font-mono text-base font-bold text-[#713B32] tabular-nums">
                        {confirmedBooking.bookingRef}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#542820]/70">
                        Date
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#2B1915] tabular-nums">
                        {confirmedBooking.reservationDate}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#542820]/70">
                        Time
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#2B1915] tabular-nums">
                        {confirmedBooking.reservationTime}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#542820]/70">
                        Guests
                      </p>
                      <p className="mt-1 font-mono text-sm font-semibold text-[#2B1915] tabular-nums">
                        {confirmedBooking.guests} Guests
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm text-[#2B1915]/80">
                    Dining Area:{' '}
                    <strong className="text-[#542820]">
                      {confirmedBooking.tableLabel} ({confirmedBooking.tableArea})
                    </strong>
                    . Keep your booking reference and phone number handy if you
                    need to modify or cancel later.
                  </p>

                  <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setLookupRef(confirmedBooking.bookingRef);
                        setLookupPhone(confirmedBooking.phone);
                        setFoundBooking(confirmedBooking);
                        setEditDate(confirmedBooking.reservationDate);
                        setEditTime(confirmedBooking.reservationTime);
                        setEditGuests(confirmedBooking.guests);
                        setEditRequests(confirmedBooking.specialRequests || '');
                        setActiveTab('manage');
                      }}
                      className="px-5 py-2.5 border border-[#713B32] text-[#713B32] hover:bg-[#713B32] hover:text-[#FFF9EF] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Manage This Booking
                    </button>
                    <button
                      type="button"
                      onClick={resetBookingForm}
                      className="px-5 py-2.5 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] rounded-lg text-sm font-semibold transition-colors cursor-pointer"
                    >
                      Make Another Booking
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.form
                  key="booking-form"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.24 }}
                  onSubmit={handleBookSubmit}
                  className="p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8"
                >
                  {/* Left: Date, Party Size & Live Slots */}
                  <div className="lg:col-span-5 space-y-6 lg:pr-6 lg:border-r lg:border-[#713B32]/15">
                    <div>
                      <label
                        htmlFor="res-date"
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#542820]"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>1. Select Date</span>
                      </label>
                      <input
                        id="res-date"
                        type="date"
                        min={todayStr}
                        value={reservationDate}
                        onChange={(e) => setReservationDate(e.target.value)}
                        required
                        className="mt-2 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="res-guests"
                        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#542820]"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>2. Number of Guests</span>
                      </label>
                      <select
                        id="res-guests"
                        value={guests}
                        onChange={(e) => setGuests(Number(e.target.value))}
                        className="mt-2 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 16, 20].map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'Guest' : 'Guests'}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#542820]">
                        <Clock className="w-3.5 h-3.5" />
                        <span>3. Available Time Slots</span>
                      </div>

                      {loadingSlots ? (
                        <p className="mt-3 text-xs text-[#542820]/70">
                          Checking live table availability...
                        </p>
                      ) : slotsError ? (
                        <p className="mt-3 text-xs text-red-700">{slotsError}</p>
                      ) : (
                        <div className="mt-3 grid grid-cols-3 gap-2">
                          {slots.map((slot) => {
                            const selected = reservationTime === slot.time;
                            return (
                              <motion.button
                                key={slot.time}
                                type="button"
                                disabled={!slot.available}
                                whileTap={slot.available ? { scale: 0.96 } : undefined}
                                onClick={() => setReservationTime(slot.time)}
                                className={`py-2 px-2 rounded-lg text-xs font-mono font-medium tabular-nums border transition-colors ${
                                  !slot.available
                                    ? 'bg-[#2B1915]/5 text-[#2B1915]/35 border-[#2B1915]/10 cursor-not-allowed line-through'
                                    : selected
                                      ? 'bg-[#713B32] text-[#FFF9EF] border-[#713B32] cursor-pointer shadow-sm'
                                      : 'bg-[#FFF9EF] text-[#2B1915] border-[#713B32]/25 hover:border-[#713B32] cursor-pointer'
                                }`}
                              >
                                {slot.time}
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                      {!loadingSlots &&
                        slots.length > 0 &&
                        slots.every((s) => !s.available) && (
                          <p className="mt-2 text-xs text-[#713B32]">
                            No slots remaining for this date and party size. Try
                            selecting another date.
                          </p>
                        )}
                    </div>
                  </div>

                  {/* Right: Guest Details */}
                  <div className="lg:col-span-7 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="res-name"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                        >
                          Full Name *
                        </label>
                        <input
                          id="res-name"
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g., Ramesh Gowda"
                          className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="res-phone"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                        >
                          Phone Number *
                        </label>
                        <input
                          id="res-phone"
                          type="tel"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="10-digit mobile number"
                          className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label
                          htmlFor="res-email"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                        >
                          Email Address (Optional)
                        </label>
                        <input
                          id="res-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="res-occasion"
                          className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                        >
                          Occasion (Optional)
                        </label>
                        <select
                          id="res-occasion"
                          value={occasion}
                          onChange={(e) => setOccasion(e.target.value)}
                          className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                        >
                          <option value="">Regular Family Dining</option>
                          <option value="Birthday Celebration">
                            Birthday Celebration
                          </option>
                          <option value="Anniversary">Anniversary</option>
                          <option value="Family Gathering">
                            Family Gathering
                          </option>
                          <option value="Business Meal">Business Meal</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="res-requests"
                        className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                      >
                        Special Requests / Dietary Notes
                      </label>
                      <textarea
                        id="res-requests"
                        rows={3}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="High chair, wheelchair access, spice preferences, or pre-selected dishes..."
                        className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                      />
                    </div>

                    {submitError && (
                      <div
                        role="alert"
                        className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900"
                      >
                        {submitError}
                      </div>
                    )}

                    <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={resetBookingForm}
                        className="px-5 py-3 text-sm font-medium text-[#542820] hover:text-[#2B1915] border border-[#713B32]/25 rounded-lg transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={submitting || !reservationTime}
                        className="px-7 py-3 bg-[#713B32] hover:bg-[#542820] disabled:opacity-50 text-[#FFF9EF] font-semibold text-sm rounded-lg transition-colors shadow-sm cursor-pointer disabled:cursor-not-allowed"
                      >
                        {submitting
                          ? 'Confirming Availability...'
                          : 'Confirm Reservation'}
                      </motion.button>
                    </div>
                  </div>
                </motion.form>
              )
            ) : (
              /* Manage / Lookup Existing Booking */
              <motion.div
                key="manage-booking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.24 }}
                className="p-6 sm:p-10"
              >
                <form
                  onSubmit={handleLookupSubmit}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end pb-8 border-b border-[#713B32]/15"
                >
                  <div className="md:col-span-5">
                    <label
                      htmlFor="lookup-ref"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                    >
                      Booking Reference
                    </label>
                    <input
                      id="lookup-ref"
                      type="text"
                      required
                      value={lookupRef}
                      onChange={(e) => setLookupRef(e.target.value.toUpperCase())}
                      placeholder="e.g., HK-A1B2C3"
                      className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm font-mono uppercase text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                    />
                  </div>
                  <div className="md:col-span-5">
                    <label
                      htmlFor="lookup-phone"
                      className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                    >
                      Verified Phone Number
                    </label>
                    <input
                      id="lookup-phone"
                      type="tel"
                      required
                      value={lookupPhone}
                      onChange={(e) => setLookupPhone(e.target.value)}
                      placeholder="10-digit phone used at booking"
                      className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm font-mono tabular-nums text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="submit"
                      disabled={lookupLoading}
                      className="w-full py-2.5 px-4 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] font-semibold text-sm rounded-lg inline-flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>Find</span>
                    </button>
                  </div>
                </form>

                {lookupError && (
                  <div
                    role="alert"
                    className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900"
                  >
                    {lookupError}
                  </div>
                )}

                {manageFeedback && (
                  <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-900">
                    {manageFeedback}
                  </div>
                )}

                <AnimatePresence>
                  {foundBooking && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.25 }}
                      className="mt-8 p-6 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-[#713B32]/15">
                        <div>
                          <p className="text-xs uppercase tracking-wider text-[#542820]/70">
                            Booking Reference
                          </p>
                          <p className="font-mono text-xl font-bold text-[#713B32] tabular-nums">
                            {foundBooking.bookingRef}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs uppercase tracking-wider text-[#542820]/70">
                            Current Status
                          </p>
                          <p className="font-semibold text-sm text-[#2B1915] mt-0.5">
                            {foundBooking.status}
                          </p>
                        </div>
                      </div>

                      {!isEditingBooking ? (
                        <>
                          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-[#542820]/70">Guest</p>
                              <p className="font-medium text-[#2B1915]">
                                {foundBooking.customerName}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#542820]/70">Date</p>
                              <p className="font-mono font-medium tabular-nums">
                                {foundBooking.reservationDate}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#542820]/70">Time</p>
                              <p className="font-mono font-medium tabular-nums">
                                {foundBooking.reservationTime}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-[#542820]/70">Party Size</p>
                              <p className="font-mono font-medium tabular-nums">
                                {foundBooking.guests} Guests
                              </p>
                            </div>
                          </div>

                          {foundBooking.specialRequests && (
                            <p className="mt-4 text-xs text-[#542820]">
                              Notes: {foundBooking.specialRequests}
                            </p>
                          )}

                          {foundBooking.status !== 'Cancelled' &&
                            foundBooking.status !== 'Completed' && (
                              <div className="mt-6 pt-5 border-t border-[#713B32]/15 flex flex-wrap gap-3 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setIsEditingBooking(true)}
                                  className="px-4 py-2 border border-[#713B32] text-[#713B32] hover:bg-[#713B32] hover:text-[#FFF9EF] rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Edit Reservation
                                </button>
                                <button
                                  type="button"
                                  disabled={lookupLoading}
                                  onClick={handleCancelFoundBooking}
                                  className="px-4 py-2 bg-red-800 hover:bg-red-900 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                >
                                  Cancel Booking
                                </button>
                              </div>
                            )}
                        </>
                      ) : (
                        <form
                          onSubmit={handleSaveEdit}
                          className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4"
                        >
                          <div>
                            <label className="block text-xs font-semibold text-[#542820]">
                              New Date
                            </label>
                            <input
                              type="date"
                              min={todayStr}
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              required
                              className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/25 rounded-lg text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#542820]">
                              New Time (HH:MM)
                            </label>
                            <input
                              type="time"
                              value={editTime}
                              onChange={(e) => setEditTime(e.target.value)}
                              required
                              className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/25 rounded-lg text-sm font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-[#542820]">
                              Guests
                            </label>
                            <input
                              type="number"
                              min={1}
                              max={24}
                              value={editGuests}
                              onChange={(e) =>
                                setEditGuests(Number(e.target.value))
                              }
                              required
                              className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/25 rounded-lg text-sm font-mono"
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-[#542820]">
                              Special Requests
                            </label>
                            <input
                              type="text"
                              value={editRequests}
                              onChange={(e) => setEditRequests(e.target.value)}
                              className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/25 rounded-lg text-sm"
                            />
                          </div>
                          <div className="sm:col-span-3 flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setIsEditingBooking(false)}
                              className="px-4 py-2 text-xs font-medium text-[#542820] border border-[#713B32]/25 rounded-lg cursor-pointer"
                            >
                              Cancel Edit
                            </button>
                            <button
                              type="submit"
                              disabled={lookupLoading}
                              className="px-5 py-2 bg-[#713B32] text-[#FFF9EF] text-xs font-semibold rounded-lg cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </form>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
