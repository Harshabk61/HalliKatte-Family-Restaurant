import React, { useCallback, useEffect, useState } from 'react';
import {
  Calendar,
  Check,
  Image as ImageIcon,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  ContactMessageRecord,
  CustomerRecord,
  GalleryImageRecord,
  MenuCategory,
  MenuItem,
  ReservationRecord,
  RestaurantSettings,
  RestaurantTableRecord,
} from '../types';

interface AdminDashboardProps {
  onClose: () => void;
  onSettingsUpdated: (next: RestaurantSettings) => void;
}

function getTodayIst(): string {
  const nowIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return nowIst.toISOString().slice(0, 10);
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > 2.5 * 1024 * 1024) {
      reject(new Error('Image file must be under 2.5 MB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function AdminDashboard({
  onClose,
  onSettingsUpdated,
}: AdminDashboardProps) {
  const { user, loading, adminProfile, adminError, signInWithGoogle, logout, getToken } =
    useAuth();

  const [tab, setTab] = useState<
    'reservations' | 'menu' | 'gallery' | 'settings'
  >('reservations');

  const todayStr = getTodayIst();
  const [resDateFilter, setResDateFilter] = useState('');
  const [resStatusFilter, setResStatusFilter] = useState('All');
  const [resSearch, setResSearch] = useState('');

  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryImageRecord[]>([]);
  const [tables, setTables] = useState<RestaurantTableRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [settingsForm, setSettingsForm] = useState<RestaurantSettings>({});
  const [slotsInput, setSlotsInput] = useState('');

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add Menu Item state
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState<number>(0);
  const [newDishPrice, setNewDishPrice] = useState('');
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishVeg, setNewDishVeg] = useState(true);
  const [newDishImage, setNewDishImage] = useState('');

  // Add Gallery state
  const [newGallerySection, setNewGallerySection] = useState('Our Food');
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const authFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      const token = await getToken();
      if (!token) throw new Error('Authentication required.');
      const res = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || 'Request failed.');
      }
      return data;
    },
    [getToken],
  );

  const loadReservations = useCallback(async () => {
    const params = new URLSearchParams();
    if (resDateFilter) params.set('date', resDateFilter);
    if (resStatusFilter !== 'All') params.set('status', resStatusFilter);
    if (resSearch.trim()) params.set('search', resSearch.trim());
    const data = await authFetch(
      `/api/admin/reservations?${params.toString()}`,
    );
    setReservations(data.reservations || []);
  }, [authFetch, resDateFilter, resStatusFilter, resSearch]);

  const loadAllAdminData = useCallback(async () => {
    if (!adminProfile) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const [resData, custData, menuData, galData, tblData, msgData, setRes] =
        await Promise.all([
          authFetch('/api/admin/reservations'),
          authFetch('/api/admin/customers'),
          authFetch('/api/admin/menu'),
          authFetch('/api/admin/gallery'),
          authFetch('/api/admin/tables'),
          authFetch('/api/admin/messages'),
          fetch('/api/settings').then((r) => r.json()),
        ]);

      setReservations(resData.reservations || []);
      setCustomers(custData.customers || []);
      setCategories(menuData.categories || []);
      setMenuItems(menuData.items || []);
      if (menuData.categories?.length && newDishCategory === 0) {
        setNewDishCategory(menuData.categories[0].id);
      }
      setGalleryItems(galData.items || []);
      setTables(tblData.tables || []);
      setMessages(msgData.messages || []);
      setSettingsForm(setRes || {});
      try {
        const parsedSlots = JSON.parse(setRes.booking_slots || '[]');
        if (Array.isArray(parsedSlots)) {
          setSlotsInput(parsedSlots.join(', '));
        }
      } catch {
        setSlotsInput('12:00, 12:45, 13:30, 14:15, 19:00, 19:45, 20:30, 21:15, 22:00');
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Unable to load admin data.',
      );
    } finally {
      setBusy(false);
    }
  }, [adminProfile, authFetch, newDishCategory]);

  useEffect(() => {
    if (adminProfile) {
      void loadAllAdminData();
    }
  }, [adminProfile, loadAllAdminData]);

  const handleUpdateResStatus = async (id: number, status: string) => {
    setErrorMsg(null);
    setNotice(null);
    try {
      await authFetch(`/api/admin/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadReservations();
      setNotice(`Reservation updated to ${status}.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleUpdateMenuItem = async (
    id: number,
    patch: Partial<MenuItem>,
  ) => {
    setErrorMsg(null);
    setNotice(null);
    try {
      const data = await authFetch(`/api/admin/menu/items/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setMenuItems((prev) =>
        prev.map((m) => (m.id === id ? data.item : m)),
      );
      setNotice('Menu item updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleCreateMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);
    try {
      const data = await authFetch('/api/admin/menu/items', {
        method: 'POST',
        body: JSON.stringify({
          categoryId: newDishCategory,
          name: newDishName,
          description: newDishDesc,
          priceInr: newDishPrice.trim() ? Number(newDishPrice) : null,
          isVeg: newDishVeg,
          imageUrl: newDishImage.trim() || null,
        }),
      });
      setMenuItems((prev) => [...prev, data.item]);
      setNewDishName('');
      setNewDishDesc('');
      setNewDishPrice('');
      setNewDishImage('');
      setNotice(`Added "${data.item.name}" to the menu.`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not add dish.');
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    setErrorMsg(null);
    try {
      await authFetch(`/api/admin/menu/items/${id}`, { method: 'DELETE' });
      setMenuItems((prev) => prev.filter((m) => m.id !== id));
      setNotice('Menu item removed.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleAddGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      const data = await authFetch('/api/admin/gallery', {
        method: 'POST',
        body: JSON.stringify({
          section: newGallerySection,
          title: newGalleryTitle,
          caption: newGalleryCaption,
          imageUrl: newGalleryUrl.trim() || null,
        }),
      });
      setGalleryItems((prev) => [...prev, data.item]);
      setNewGalleryTitle('');
      setNewGalleryCaption('');
      setNewGalleryUrl('');
      setNotice('Gallery entry added.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Add failed.');
    }
  };

  const handleUpdateGalleryImage = async (id: number, imageUrl: string) => {
    setErrorMsg(null);
    try {
      const data = await authFetch(`/api/admin/gallery/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ imageUrl }),
      });
      setGalleryItems((prev) =>
        prev.map((g) => (g.id === id ? data.item : g)),
      );
      setNotice('Gallery photo updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed.');
    }
  };

  const handleDeleteGallery = async (id: number) => {
    setErrorMsg(null);
    try {
      await authFetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
      setGalleryItems((prev) => prev.filter((g) => g.id !== id));
      setNotice('Gallery entry removed.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Delete failed.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setNotice(null);
    try {
      const parsedSlots = slotsInput
        .split(',')
        .map((s) => s.trim())
        .filter((s) => /^\d{2}:\d{2}$/.test(s));

      const data = await authFetch('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ...settingsForm,
          booking_slots: parsedSlots,
        }),
      });
      setSettingsForm(data.settings);
      onSettingsUpdated(data.settings);
      setNotice('Restaurant settings saved.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Save failed.');
    }
  };

  const handleToggleTable = async (t: RestaurantTableRecord) => {
    try {
      const data = await authFetch(`/api/admin/tables/${t.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !t.isActive }),
      });
      setTables((prev) =>
        prev.map((row) => (row.id === t.id ? data.table : row)),
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Table update failed.');
    }
  };

  const todaysReservationsCount = reservations.filter(
    (r) =>
      r.reservationDate === todayStr &&
      (r.status === 'Confirmed' || r.status === 'Pending'),
  ).length;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#2B1915]/80 flex items-center justify-center p-2 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="HalliKatte Restaurant Admin Dashboard"
    >
      <div className="w-full max-w-6xl bg-[#F5EBDD] text-[#2B1915] rounded-2xl shadow-2xl border border-[#C49A5A]/40 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Bar */}
        <div className="px-6 py-4 bg-[#542820] text-[#FFF9EF] flex items-center justify-between gap-4 border-b border-[#C49A5A]/30 shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-[#C49A5A]" />
            <div>
              <h2 className="font-display text-2xl font-semibold">
                HalliKatte Owner & Staff Dashboard
              </h2>
              {adminProfile && (
                <p className="text-xs text-[#F5EBDD]/75">
                  Signed in as {adminProfile.email} ({adminProfile.role})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {user && (
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#713B32] hover:bg-[#8B493B] text-[#FFF9EF] rounded-lg cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Admin Portal"
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-[#FFF9EF]/10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Auth Gate */}
        {loading ? (
          <div className="p-16 text-center text-sm text-[#542820]">
            Verifying administrator session...
          </div>
        ) : !adminProfile ? (
          <div className="p-10 sm:p-16 text-center max-w-md mx-auto">
            <Shield className="w-12 h-12 text-[#713B32] mx-auto" />
            <h3 className="mt-4 font-display text-3xl font-semibold text-[#2B1915]">
              Restaurant Admin Access
            </h3>
            <p className="mt-2 text-sm text-[#2B1915]/75 leading-relaxed">
              Sign in with an authorized HalliKatte Google account to manage
              reservations, verified dish pricing, gallery photography, and
              opening hours.
            </p>
            {adminError && (
              <div
                role="alert"
                className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900"
              >
                {adminError}
              </div>
            )}
            <button
              type="button"
              onClick={() => void signInWithGoogle()}
              className="mt-6 w-full py-3 px-5 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] font-semibold text-sm rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Sign in with Google
            </button>
          </div>
        ) : (
          <>
            {/* Navigation Tabs */}
            <div className="px-6 py-3 bg-[#FFF9EF] border-b border-[#713B32]/15 flex items-center justify-between gap-4 overflow-x-auto shrink-0">
              <div className="flex items-center gap-2">
                {(
                  [
                    {
                      id: 'reservations',
                      label: 'Reservations',
                      icon: Calendar,
                    },
                    {
                      id: 'menu',
                      label: 'Menu & Prices',
                      icon: UtensilsCrossed,
                    },
                    {
                      id: 'gallery',
                      label: 'Gallery Photos',
                      icon: ImageIcon,
                    },
                    {
                      id: 'settings',
                      label: 'Hours, Tables & Inbox',
                      icon: Settings,
                    },
                  ] as const
                ).map((item) => {
                  const Icon = item.icon;
                  const active = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTab(item.id)}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#713B32] text-[#FFF9EF]'
                          : 'text-[#542820] hover:bg-[#F5EBDD]'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => void loadAllAdminData()}
                disabled={busy}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-[#713B32] hover:text-[#2B1915] whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${busy ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>

            {/* Feedback Banner */}
            {(notice || errorMsg) && (
              <div className="px-6 pt-3 shrink-0">
                {notice && (
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                    {notice}
                  </div>
                )}
                {errorMsg && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-900">
                    {errorMsg}
                  </div>
                )}
              </div>
            )}

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* TAB 1: RESERVATIONS */}
              {tab === 'reservations' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-xl bg-[#FFF9EF] border border-[#713B32]/15">
                      <p className="text-xs text-[#542820]/70 uppercase tracking-wider">
                        Today&apos;s Active Bookings
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-[#713B32] tabular-nums">
                        {todaysReservationsCount}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FFF9EF] border border-[#713B32]/15">
                      <p className="text-xs text-[#542820]/70 uppercase tracking-wider">
                        Total Bookings Listed
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-[#2B1915] tabular-nums">
                        {reservations.length}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-[#FFF9EF] border border-[#713B32]/15">
                      <p className="text-xs text-[#542820]/70 uppercase tracking-wider">
                        Registered Customers
                      </p>
                      <p className="mt-1 font-mono text-2xl font-bold text-[#2B1915] tabular-nums">
                        {customers.length}
                      </p>
                    </div>
                  </div>

                  {/* Filter Bar */}
                  <div className="flex flex-wrap items-end gap-3 p-4 rounded-xl bg-[#FFF9EF] border border-[#713B32]/15">
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Search Name / Phone / Ref
                      </label>
                      <div className="relative mt-1">
                        <Search className="w-3.5 h-3.5 text-[#542820]/60 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={resSearch}
                          onChange={(e) => setResSearch(e.target.value)}
                          placeholder="HK-... or guest name"
                          className="w-full pl-8 pr-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Filter Date
                      </label>
                      <input
                        type="date"
                        value={resDateFilter}
                        onChange={(e) => setResDateFilter(e.target.value)}
                        className="mt-1 px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Status
                      </label>
                      <select
                        value={resStatusFilter}
                        onChange={(e) => setResStatusFilter(e.target.value)}
                        className="mt-1 px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      >
                        <option value="All">All Statuses</option>
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Completed">Completed</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => void loadReservations()}
                      className="px-4 py-2 bg-[#713B32] text-[#FFF9EF] text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Apply Filters
                    </button>
                    <button
                      type="button"
                      onClick={() => setResDateFilter(todayStr)}
                      className="px-3 py-2 border border-[#713B32]/30 text-[#713B32] text-xs font-semibold rounded-lg cursor-pointer"
                    >
                      Today
                    </button>
                  </div>

                  {/* Reservations Table */}
                  <div className="overflow-x-auto rounded-xl border border-[#713B32]/15 bg-[#FFF9EF]">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#542820] text-[#FFF9EF]">
                        <tr>
                          <th className="p-3 font-semibold">Ref</th>
                          <th className="p-3 font-semibold">Guest & Phone</th>
                          <th className="p-3 font-semibold">Date & Time</th>
                          <th className="p-3 font-semibold">Party</th>
                          <th className="p-3 font-semibold">Status</th>
                          <th className="p-3 font-semibold text-right">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#713B32]/10">
                        {reservations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="p-8 text-center text-[#542820]/70"
                            >
                              No reservations match the current filter.
                            </td>
                          </tr>
                        ) : (
                          reservations.map((r) => (
                            <tr key={r.id} className="hover:bg-[#F5EBDD]/40">
                              <td className="p-3 font-mono font-bold text-[#713B32] tabular-nums">
                                {r.bookingRef}
                              </td>
                              <td className="p-3">
                                <p className="font-semibold text-[#2B1915]">
                                  {r.customerName}
                                </p>
                                <p className="font-mono text-[11px] text-[#542820]/80 tabular-nums">
                                  {r.phone}
                                  {r.email ? ` · ${r.email}` : ''}
                                </p>
                                {r.specialRequests && (
                                  <p className="text-[11px] text-[#713B32] mt-0.5">
                                    Note: {r.specialRequests}
                                  </p>
                                )}
                              </td>
                              <td className="p-3 font-mono tabular-nums">
                                <p>{r.reservationDate}</p>
                                <p className="text-[#542820]">
                                  {r.reservationTime}
                                </p>
                              </td>
                              <td className="p-3 font-mono tabular-nums">
                                {r.guests} · {r.tableLabel}
                              </td>
                              <td className="p-3 font-semibold">{r.status}</td>
                              <td className="p-3 text-right space-x-1.5 whitespace-nowrap">
                                {r.status !== 'Confirmed' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleUpdateResStatus(
                                        r.id,
                                        'Confirmed',
                                      )
                                    }
                                    className="px-2.5 py-1 bg-emerald-800 text-white rounded text-[11px] cursor-pointer"
                                  >
                                    Confirm
                                  </button>
                                )}
                                {r.status !== 'Completed' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleUpdateResStatus(
                                        r.id,
                                        'Completed',
                                      )
                                    }
                                    className="px-2.5 py-1 bg-[#713B32] text-[#FFF9EF] rounded text-[11px] cursor-pointer"
                                  >
                                    Complete
                                  </button>
                                )}
                                {r.status !== 'Cancelled' && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      void handleUpdateResStatus(
                                        r.id,
                                        'Cancelled',
                                      )
                                    }
                                    className="px-2.5 py-1 border border-red-800 text-red-800 rounded text-[11px] cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 2: MENU MANAGEMENT */}
              {tab === 'menu' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleCreateMenuItem}
                    className="p-5 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20 grid grid-cols-1 sm:grid-cols-6 gap-3 items-end"
                  >
                    <div className="sm:col-span-6">
                      <h3 className="font-display text-xl font-semibold text-[#542820]">
                        Add Dish to Menu
                      </h3>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Category
                      </label>
                      <select
                        value={newDishCategory}
                        onChange={(e) =>
                          setNewDishCategory(Number(e.target.value))
                        }
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Dish Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={newDishName}
                        onChange={(e) => setNewDishName(e.target.value)}
                        placeholder="e.g., Ghee Roast"
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Price (₹ INR)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={newDishPrice}
                        onChange={(e) => setNewDishPrice(e.target.value)}
                        placeholder="Optional"
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Dietary
                      </label>
                      <select
                        value={newDishVeg ? 'veg' : 'nonveg'}
                        onChange={(e) =>
                          setNewDishVeg(e.target.value === 'veg')
                        }
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      >
                        <option value="veg">Veg</option>
                        <option value="nonveg">Non-Veg</option>
                      </select>
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newDishDesc}
                        onChange={(e) => setNewDishDesc(e.target.value)}
                        placeholder="Short dish description..."
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Photo URL or Upload
                      </label>
                      <div className="mt-1 flex gap-2">
                        <input
                          type="text"
                          value={newDishImage}
                          onChange={(e) => setNewDishImage(e.target.value)}
                          placeholder="https://... or upload"
                          className="w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                        />
                        <label className="px-2.5 py-2 bg-[#F5EBDD] border border-[#713B32]/25 rounded-lg text-[11px] font-semibold cursor-pointer shrink-0">
                          File
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                const url = await readFileAsDataUrl(f);
                                setNewDishImage(url);
                              } catch (err) {
                                setErrorMsg(
                                  err instanceof Error
                                    ? err.message
                                    : 'Invalid file',
                                );
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                    <div>
                      <button
                        type="submit"
                        className="w-full py-2 px-3 bg-[#713B32] text-[#FFF9EF] text-xs font-semibold rounded-lg inline-flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Dish</span>
                      </button>
                    </div>
                  </form>

                  {/* Menu Items List */}
                  <div className="space-y-2.5">
                    {menuItems.map((item) => {
                      const cat =
                        categories.find((c) => c.id === item.categoryId)?.name ||
                        '';
                      return (
                        <div
                          key={item.id}
                          className="p-4 rounded-xl bg-[#FFF9EF] border border-[#713B32]/15 flex flex-wrap items-center justify-between gap-4"
                        >
                          <div className="min-w-[200px] flex-1">
                            <p className="text-[11px] uppercase tracking-wider text-[#8B493B] font-semibold">
                              {cat} · {item.isVeg ? 'Veg' : 'Non-Veg'}
                            </p>
                            <p className="font-display text-lg font-semibold text-[#2B1915]">
                              {item.name}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-[#542820]">₹</span>
                              <input
                                type="number"
                                min={0}
                                defaultValue={item.priceInr ?? ''}
                                placeholder="Set ₹"
                                onBlur={(e) => {
                                  const raw = e.target.value.trim();
                                  const nextPrice = raw ? Number(raw) : null;
                                  if (nextPrice !== item.priceInr) {
                                    void handleUpdateMenuItem(item.id, {
                                      priceInr: nextPrice,
                                    });
                                  }
                                }}
                                className="w-24 px-2.5 py-1.5 bg-white border border-[#713B32]/25 rounded-lg text-xs font-mono tabular-nums"
                              />
                            </div>

                            <label className="px-3 py-1.5 bg-[#F5EBDD] border border-[#713B32]/25 rounded-lg text-xs font-medium cursor-pointer">
                              Upload Photo
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="hidden"
                                onChange={async (e) => {
                                  const f = e.target.files?.[0];
                                  if (!f) return;
                                  try {
                                    const url = await readFileAsDataUrl(f);
                                    await handleUpdateMenuItem(item.id, {
                                      imageUrl: url,
                                    });
                                  } catch (err) {
                                    setErrorMsg(
                                      err instanceof Error
                                        ? err.message
                                        : 'Upload failed',
                                    );
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() =>
                                void handleUpdateMenuItem(item.id, {
                                  isAvailable: !item.isAvailable,
                                })
                              }
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                                item.isAvailable
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-amber-900/20 text-[#542820]'
                              }`}
                            >
                              {item.isAvailable ? 'Available' : 'Unavailable'}
                            </button>

                            <button
                              type="button"
                              aria-label={`Delete ${item.name}`}
                              onClick={() => void handleDeleteMenuItem(item.id)}
                              className="p-2 text-red-800 hover:bg-red-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: GALLERY MANAGER */}
              {tab === 'gallery' && (
                <div className="space-y-6">
                  <form
                    onSubmit={handleAddGallery}
                    className="p-5 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
                  >
                    <div className="sm:col-span-4">
                      <h3 className="font-display text-xl font-semibold text-[#542820]">
                        Upload HalliKatte Photo to Gallery
                      </h3>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Section
                      </label>
                      <select
                        value={newGallerySection}
                        onChange={(e) => setNewGallerySection(e.target.value)}
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      >
                        <option>Our Food</option>
                        <option>Restaurant Ambience</option>
                        <option>Family Dining</option>
                        <option>Special Moments</option>
                        <option>Kitchen & Preparation</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Title *
                      </label>
                      <input
                        type="text"
                        required
                        value={newGalleryTitle}
                        onChange={(e) => setNewGalleryTitle(e.target.value)}
                        placeholder="Evening Courtyard"
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-[#542820]">
                        Caption
                      </label>
                      <input
                        type="text"
                        value={newGalleryCaption}
                        onChange={(e) => setNewGalleryCaption(e.target.value)}
                        placeholder="Short caption..."
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="flex-1 py-2 px-3 bg-[#F5EBDD] border border-[#713B32]/25 rounded-lg text-xs font-semibold text-center cursor-pointer">
                        {newGalleryUrl ? 'Photo Ready' : 'Choose File'}
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            try {
                              const url = await readFileAsDataUrl(f);
                              setNewGalleryUrl(url);
                            } catch (err) {
                              setErrorMsg(
                                err instanceof Error
                                  ? err.message
                                  : 'Invalid image',
                              );
                            }
                          }}
                        />
                      </label>
                      <button
                        type="submit"
                        className="py-2 px-4 bg-[#713B32] text-[#FFF9EF] text-xs font-semibold rounded-lg cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  </form>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {galleryItems.map((g) => (
                      <div
                        key={g.id}
                        className="p-4 rounded-xl bg-[#FFF9EF] border border-[#713B32]/15 flex flex-col justify-between gap-3"
                      >
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-[#8B493B] font-semibold">
                            {g.section}
                          </p>
                          <p className="font-display text-lg font-semibold text-[#2B1915]">
                            {g.title}
                          </p>
                          <p className="text-xs text-[#2B1915]/70 mt-1">
                            {g.imageUrl
                              ? 'Real photograph uploaded'
                              : 'Placeholder (no photo uploaded yet)'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#713B32]/10">
                          <label className="px-3 py-1.5 bg-[#713B32] text-[#FFF9EF] text-xs font-semibold rounded-lg cursor-pointer">
                            {g.imageUrl ? 'Replace Photo' : 'Upload Photo'}
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/webp"
                              className="hidden"
                              onChange={async (e) => {
                                const f = e.target.files?.[0];
                                if (!f) return;
                                try {
                                  const url = await readFileAsDataUrl(f);
                                  await handleUpdateGalleryImage(g.id, url);
                                } catch (err) {
                                  setErrorMsg(
                                    err instanceof Error
                                      ? err.message
                                      : 'Upload failed',
                                  );
                                }
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => void handleDeleteGallery(g.id)}
                            className="p-2 text-red-800 hover:bg-red-50 rounded-lg cursor-pointer"
                            aria-label={`Delete ${g.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: TABLES, SETTINGS & INBOX */}
              {tab === 'settings' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form
                    onSubmit={handleSaveSettings}
                    className="lg:col-span-7 p-6 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20 space-y-4"
                  >
                    <h3 className="font-display text-2xl font-semibold text-[#542820]">
                      Restaurant Contact, Hours & Booking Slots
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#542820]">
                          Verified Phone Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.phone || ''}
                          onChange={(e) =>
                            setSettingsForm((p) => ({
                              ...p,
                              phone: e.target.value,
                            }))
                          }
                          placeholder="+91 ..."
                          className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#542820]">
                          WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={settingsForm.whatsapp || ''}
                          onChange={(e) =>
                            setSettingsForm((p) => ({
                              ...p,
                              whatsapp: e.target.value,
                            }))
                          }
                          placeholder="91XXXXXXXXXX"
                          className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#542820]">
                        Opening Hours
                      </label>
                      <input
                        type="text"
                        value={settingsForm.opening_hours || ''}
                        onChange={(e) =>
                          setSettingsForm((p) => ({
                            ...p,
                            opening_hours: e.target.value,
                          }))
                        }
                        placeholder="e.g., Daily: 11:30 AM – 10:30 PM"
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#542820]">
                        Reservation Time Slots (24h HH:MM, comma-separated)
                      </label>
                      <input
                        type="text"
                        value={slotsInput}
                        onChange={(e) => setSlotsInput(e.target.value)}
                        className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#542820]">
                          Instagram URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={settingsForm.instagram_url || ''}
                          onChange={(e) =>
                            setSettingsForm((p) => ({
                              ...p,
                              instagram_url: e.target.value,
                            }))
                          }
                          placeholder="https://instagram.com/..."
                          className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#542820]">
                          Facebook URL (Optional)
                        </label>
                        <input
                          type="url"
                          value={settingsForm.facebook_url || ''}
                          onChange={(e) =>
                            setSettingsForm((p) => ({
                              ...p,
                              facebook_url: e.target.value,
                            }))
                          }
                          placeholder="https://facebook.com/..."
                          className="mt-1 w-full px-3 py-2 bg-white border border-[#713B32]/20 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] text-xs font-semibold rounded-lg inline-flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Save Settings</span>
                    </button>
                  </form>

                  <div className="lg:col-span-5 space-y-6">
                    {/* Dining Tables */}
                    <div className="p-5 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20 space-y-3">
                      <h3 className="font-display text-xl font-semibold text-[#542820]">
                        Configured Dining Tables
                      </h3>
                      <div className="space-y-2">
                        {tables.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between text-xs py-1.5 border-b border-[#713B32]/10 last:border-0"
                          >
                            <div>
                              <p className="font-semibold text-[#2B1915]">
                                {t.label} ({t.capacity} seats)
                              </p>
                              <p className="text-[#542820]/70">{t.area}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => void handleToggleTable(t)}
                              className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                                t.isActive
                                  ? 'bg-emerald-800 text-white'
                                  : 'bg-stone-300 text-stone-700'
                              }`}
                            >
                              {t.isActive ? 'Active' : 'Disabled'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Customer Contact Messages */}
                    <div className="p-5 rounded-xl bg-[#FFF9EF] border border-[#713B32]/20 space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-[#713B32]" />
                        <h3 className="font-display text-xl font-semibold text-[#542820]">
                          Guest Inquiries ({messages.length})
                        </h3>
                      </div>
                      {messages.length === 0 ? (
                        <p className="text-xs text-[#542820]/70">
                          No messages submitted yet.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-60 overflow-y-auto">
                          {messages.map((m) => (
                            <div
                              key={m.id}
                              className="p-3 rounded-lg bg-[#F5EBDD]/60 border border-[#713B32]/15 text-xs"
                            >
                              <div className="flex justify-between font-semibold text-[#2B1915]">
                                <span>{m.name}</span>
                                <span className="font-mono tabular-nums">
                                  {m.phone}
                                </span>
                              </div>
                              <p className="mt-1 text-[#2B1915]/85">
                                {m.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
