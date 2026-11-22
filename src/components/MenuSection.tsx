import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import { CartItem, MenuCategory, MenuItem } from '../types';
import { WarliBorderPattern } from './WarliMotifs';

function DishThumbnail({
  item,
  sizeClass = 'w-16 h-16 sm:w-20 sm:h-20',
  onClick,
}: {
  item: MenuItem;
  sizeClass?: string;
  onClick?: () => void;
}) {
  const [failed, setFailed] = useState(false);

  const inner =
    item.imageUrl && !failed ? (
      <img
        src={item.imageUrl}
        alt={item.name}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className="w-full h-full object-cover transition-transform duration-300 group-hover/thumb:scale-105"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-[#542820] text-[#C49A5A]">
        <UtensilsCrossed className="w-5 h-5 opacity-80" />
      </div>
    );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={`View photo of ${item.name}`}
        className={`${sizeClass} shrink-0 rounded-xl overflow-hidden border border-[#C49A5A]/50 bg-[#542820] shadow-sm cursor-pointer group/thumb focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#713B32]`}
      >
        {inner}
      </button>
    );
  }

  return (
    <div
      className={`${sizeClass} shrink-0 rounded-xl overflow-hidden border border-[#C49A5A]/45 bg-[#542820] shadow-sm`}
    >
      {inner}
    </div>
  );
}

interface MenuSectionProps {
  onlineOrderingEnabled: boolean;
  onReserveWithOrderNotes: (notes: string) => void;
}

const CATEGORY_SUBTITLES: Record<string, string> = {
  combos: 'Wholesome village meals, ragi ball platters & biryani combos',
  'main-course': 'Traditional Nati curries, North Indian gravies & veg classics',
  breads: 'Clay-tandoor rotis, butter naans, stuffed kulchas & parottas',
  rice: 'Fragrant biryanis, ghee rice, jeera rice & comforting curd rice',
  'fried-rice-noodles': 'Wok-tossed Indo-Chinese fried rice & Hakka noodles',
  starters: 'Smoky tandoor kebabs, Mangalorean ghee roast & crispy starters',
  rolls: 'Freshly rolled wraps stuffed with spiced fillings & crunchy veggies',
  snacks: 'Evening crunchers, fries, nuggets & freshly made egg specials',
  soups: 'Hot comforting broths & signature HalliKatte house soups',
  milkshakes: 'Chilled cold coffee & creamy classic milkshakes',
  breakfast: 'Hot steamed Karnataka-style Tatte Idli',
};

const CATEGORY_IMAGES: Record<string, string> = {
  combos: '/assets/aistudio/image_b07bb77a.png',
  'main-course': '/assets/aistudio/image_d4bd41d6.png',
  breads: '/assets/aistudio/image_9f3059bb.png',
  rice: '/assets/aistudio/image_63410db0.png',
  'fried-rice-noodles': '/assets/aistudio/image_489deb20.png',
  starters: '/assets/aistudio/image_00dd2999.png',
  rolls: '/assets/aistudio/image_47ce28dd.png',
  snacks: '/assets/aistudio/image_f6c08a49.png',
  soups: '/assets/aistudio/image_91b13137.png',
  milkshakes: '/assets/aistudio/image_65c99655.png',
  breakfast: '/assets/aistudio/image_77fc4405.png',
};

function CategoryArtwork({
  slug,
  name,
  size = 'md',
}: {
  slug: string;
  name?: string;
  size?: 'sm' | 'md';
}) {
  const [failed, setFailed] = useState(false);
  const src = CATEGORY_IMAGES[slug];
  const isGraphicBanner = slug === 'combos';
  const dim =
    size === 'sm'
      ? 'w-20 h-20 sm:w-24 sm:h-20 shrink-0'
      : 'w-24 h-20 sm:w-28 sm:h-24 shrink-0';

  if (src && !failed) {
    return (
      <div
        className={`${dim} rounded-xl overflow-hidden border border-[#C49A5A]/60 shadow-sm ${
          isGraphicBanner ? 'bg-[#FFF9EF]' : 'bg-[#542820]'
        }`}
      >
        <img
          src={src}
          alt={name || slug}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
            isGraphicBanner ? 'object-contain p-1' : 'object-cover'
          }`}
        />
      </div>
    );
  }

  return (
    <div
      className={`${dim} rounded-xl border border-[#C49A5A]/55 bg-[#542820] text-[#C49A5A] flex items-center justify-center`}
      aria-hidden="true"
    >
      <UtensilsCrossed className="w-6 h-6 opacity-80" />
    </div>
  );
}

export function MenuSection({
  onlineOrderingEnabled,
  onReserveWithOrderNotes,
}: MenuSectionProps) {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected category opens the dedicated Category Menu Interface
  const [activeCategorySlug, setActiveCategorySlug] = useState<string | null>(null);
  const [dietFilter, setDietFilter] = useState<'all' | 'veg' | 'nonveg'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSearchQuery, setModalSearchQuery] = useState('');

  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch('/api/menu')
      .then(async (res) => {
        if (!res.ok) throw new Error('Unable to load menu right now.');
        return res.json();
      })
      .then((data) => {
        if (!active) return;
        setCategories(data.categories || []);
        setItems(data.items || []);
        setError(null);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Unable to load menu.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Close Preview Lightbox or Category Menu Interface on Escape
  useEffect(() => {
    if (!activeCategorySlug && !previewItem) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (previewItem) {
          setPreviewItem(null);
        } else {
          setActiveCategorySlug(null);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeCategorySlug, previewItem]);

  const categoryStats = useMemo(() => {
    const map = new Map<
      number,
      { count: number; minPrice: number | null; maxPrice: number | null; vegCount: number; nonVegCount: number }
    >();
    for (const item of items) {
      const prev = map.get(item.categoryId) ?? {
        count: 0,
        minPrice: null,
        maxPrice: null,
        vegCount: 0,
        nonVegCount: 0,
      };
      prev.count += 1;
      if (item.isVeg) prev.vegCount += 1;
      else prev.nonVegCount += 1;

      if (typeof item.priceInr === 'number') {
        prev.minPrice =
          prev.minPrice === null ? item.priceInr : Math.min(prev.minPrice, item.priceInr);
        prev.maxPrice =
          prev.maxPrice === null ? item.priceInr : Math.max(prev.maxPrice, item.priceInr);
      }
      map.set(item.categoryId, prev);
    }
    return map;
  }, [items]);

  const categoryNameById = useMemo(() => {
    const map: Record<number, string> = {};
    for (const c of categories) {
      map[c.id] = c.name;
    }
    return map;
  }, [categories]);

  // Global search results shown ONLY when user searches on main screen
  const globalSearchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return items.filter((item) => {
      if (dietFilter === 'veg' && !item.isVeg) return false;
      if (dietFilter === 'nonveg' && item.isVeg) return false;
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [items, searchQuery, dietFilter]);

  const activeCategory = useMemo(
    () => categories.find((c) => c.slug === activeCategorySlug) ?? null,
    [categories, activeCategorySlug],
  );

  const activeCategoryItems = useMemo(() => {
    if (!activeCategory) return [];
    const q = modalSearchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (item.categoryId !== activeCategory.id) return false;
      if (dietFilter === 'veg' && !item.isVeg) return false;
      if (dietFilter === 'nonveg' && item.isVeg) return false;
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [activeCategory, items, dietFilter, modalSearchQuery]);

  const getCartQty = (itemId: number) =>
    cart.find((c) => c.item.id === itemId)?.quantity ?? 0;

  const addToCart = (item: MenuItem) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c,
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateCartQty = (itemId: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) =>
          c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c,
        )
        .filter((c) => c.quantity > 0),
    );
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const totalCount = useMemo(
    () => cart.reduce((sum, c) => sum + c.quantity, 0),
    [cart],
  );

  const { pricedSubtotal, unpricedCount } = useMemo(() => {
    let subtotal = 0;
    let missing = 0;
    for (const c of cart) {
      if (typeof c.item.priceInr === 'number') {
        subtotal += c.item.priceInr * c.quantity;
      } else {
        missing += c.quantity;
      }
    }
    return { pricedSubtotal: subtotal, unpricedCount: missing };
  }, [cart]);

  const handleAttachOrderToReservation = () => {
    const summary = cart
      .map((c) => `${c.quantity}x ${c.item.name}`)
      .join(', ');
    setDrawerOpen(false);
    setActiveCategorySlug(null);
    onReserveWithOrderNotes(`Pre-selected dishes: ${summary}`);
  };

  const openCategoryInterface = (slug: string) => {
    setModalSearchQuery('');
    setActiveCategorySlug(slug);
  };

  return (
    <section
      id="menu"
      className="relative bg-[#713B32] text-[#FFF9EF] py-20 sm:py-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-[#FFF9EF]/15"
        >
          <div>
            <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C49A5A]">
              HalliKatte Kitchen · Veg &amp; Non-Veg
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#FFF9EF] text-balance">
              Explore Our Menu
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#F5EBDD]/85 max-w-2xl leading-relaxed">
              Select any menu section below — Combos, Main Course, Breads, Rice
              &amp; Biryani, Starters, and more — to open its dedicated dishes
              and add items to your Order Tray.
            </p>
          </div>

          {onlineOrderingEnabled && (
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setDrawerOpen(true)}
              className="inline-flex items-center gap-3 px-5 py-3 bg-[#F5EBDD] text-[#2B1915] hover:bg-[#FFF9EF] rounded-lg font-semibold text-sm transition-colors whitespace-nowrap shrink-0 shadow-md cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A5A]"
            >
              <ShoppingBag className="w-4 h-4 text-[#713B32]" />
              <span>Order Tray</span>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#713B32] text-[#FFF9EF] rounded tabular-nums">
                {totalCount}
              </span>
            </motion.button>
          )}
        </motion.div>

        {/* Search & Dietary Controls */}
        <div className="mt-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="relative w-full lg:max-w-sm">
            <Search className="w-4 h-4 text-[#F5EBDD]/60 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Quick search any dish (e.g., Paneer, Biryani, Naan)..."
              aria-label="Search menu dishes"
              className="w-full pl-10 pr-4 py-2.5 bg-[#542820] border border-[#FFF9EF]/20 rounded-lg text-sm text-[#FFF9EF] placeholder:text-[#F5EBDD]/50 focus:outline-none focus:ring-2 focus:ring-[#C49A5A]"
            />
          </div>

          <div
            role="group"
            aria-label="Dietary Preference"
            className="inline-flex items-center gap-1 p-1 bg-[#542820] rounded-lg border border-[#FFF9EF]/15 self-start lg:self-auto"
          >
            {(
              [
                { key: 'all', label: 'All Dishes' },
                { key: 'veg', label: 'Pure Veg' },
                { key: 'nonveg', label: 'Non-Veg' },
              ] as const
            ).map((opt) => {
              const active = dietFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setDietFilter(opt.key)}
                  className={`relative px-3.5 py-2 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    active
                      ? 'text-[#2B1915]'
                      : 'text-[#F5EBDD]/80 hover:text-[#FFF9EF]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="diet-filter-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 bg-[#C49A5A] rounded-md"
                    />
                  )}
                  <span className="relative z-10">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Either Search Results (if typing) OR Compact Category Selector Cards */}
        {loading ? (
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-36 rounded-2xl bg-[#542820]/60 border border-[#FFF9EF]/10 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="mt-10 p-6 rounded-xl bg-[#542820] border border-[#C49A5A]/40 text-center">
            <p className="text-sm text-[#F5EBDD]">{error}</p>
          </div>
        ) : searchQuery.trim().length > 0 ? (
          <div className="mt-10 rounded-2xl overflow-hidden bg-[#F5EBDD] text-[#2B1915] shadow-xl border border-[#C49A5A]/40">
            <div className="bg-[#542820] text-[#FFF9EF] px-6 py-4 flex items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-semibold">
                  Search Results for “{searchQuery.trim()}”
                </h3>
                <p className="text-xs text-[#C49A5A] mt-0.5 tabular-nums">
                  {globalSearchResults.length}{' '}
                  {globalSearchResults.length === 1 ? 'dish' : 'dishes'} found
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-3.5 py-1.5 rounded-lg border border-[#FFF9EF]/30 text-xs font-semibold text-[#FFF9EF] hover:bg-[#FFF9EF]/10 cursor-pointer"
              >
                Clear Search
              </button>
            </div>

            {globalSearchResults.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#542820]">
                No matching dishes found. Clear search to browse all menu categories.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <tbody className="divide-y divide-[#713B32]/12">
                    {globalSearchResults.map((item) => {
                      const qty = getCartQty(item.id);
                      const catName = categoryNameById[item.categoryId] || 'Kitchen';
                      return (
                        <tr key={item.id} className="hover:bg-[#FFF9EF]/75 transition-colors">
                          <td className="py-3.5 pl-5 pr-3 align-top">
                            <div className="flex items-start gap-3.5">
                              <DishThumbnail
                                item={item}
                                sizeClass="w-16 h-16 sm:w-20 sm:h-20"
                                onClick={() => setPreviewItem(item)}
                              />
                              <div className="flex items-start gap-2.5 min-w-0 pt-0.5">
                                <span
                                  className={`mt-1.5 inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 border ${
                                    item.isVeg ? 'border-emerald-800' : 'border-red-800'
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      item.isVeg ? 'bg-emerald-800' : 'bg-red-800'
                                    }`}
                                  />
                                </span>
                                <div className="min-w-0">
                                  <p className="text-[11px] uppercase tracking-wider text-[#8B493B] font-semibold">
                                    {catName}
                                  </p>
                                  <p className="font-display text-xl font-semibold text-[#2B1915]">
                                    {item.name}
                                  </p>
                                  <p className="mt-0.5 text-xs text-[#2B1915]/75 max-w-xl">
                                    {item.description}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-3 text-right align-middle whitespace-nowrap">
                            {typeof item.priceInr === 'number' && (
                              <span className="font-mono text-base font-bold text-[#542820] tabular-nums">
                                ₹{item.priceInr.toFixed(2)}
                              </span>
                            )}
                          </td>
                          {onlineOrderingEnabled && (
                            <td className="py-3.5 pl-3 pr-5 text-right align-middle whitespace-nowrap">
                              {qty === 0 ? (
                                <button
                                  type="button"
                                  onClick={() => addToCart(item)}
                                  className="px-4 py-2 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] text-xs font-semibold rounded-lg cursor-pointer"
                                >
                                  Add to Tray
                                </button>
                              ) : (
                                <div className="inline-flex items-center gap-2 bg-[#713B32] text-[#FFF9EF] rounded-lg px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => updateCartQty(item.id, -1)}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#542820] cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="font-mono text-xs font-semibold w-5 text-center tabular-nums">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQty(item.id, 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#542820] cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Compact Category Cards Grid on Main Page */
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, idx) => {
              const stats = categoryStats.get(cat.id);
              const visibleCount =
                dietFilter === 'veg'
                  ? stats?.vegCount ?? 0
                  : dietFilter === 'nonveg'
                    ? stats?.nonVegCount ?? 0
                    : stats?.count ?? 0;

              if (!stats || visibleCount === 0) return null;

              const priceLabel =
                stats.minPrice !== null && stats.maxPrice !== null
                  ? stats.minPrice === stats.maxPrice
                    ? `₹${stats.minPrice}`
                    : `₹${stats.minPrice} – ₹${stats.maxPrice}`
                  : '';

              return (
                <motion.button
                  key={cat.id}
                  type="button"
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.35, delay: (idx % 3) * 0.05 }}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => openCategoryInterface(cat.slug)}
                  className="text-left rounded-2xl bg-[#F5EBDD] text-[#2B1915] p-5 border border-[#C49A5A]/45 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between gap-4 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C49A5A]"
                >
                  <div className="flex items-start gap-4">
                    <CategoryArtwork slug={cat.slug} name={cat.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1915] leading-tight">
                          {cat.name}
                        </h3>
                      </div>
                      <p className="mt-1 text-xs text-[#2B1915]/75 leading-relaxed line-clamp-2">
                        {CATEGORY_SUBTITLES[cat.slug] ||
                          'Freshly prepared to order in our kitchen'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#713B32]/15 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-mono font-semibold text-[#713B32] tabular-nums">
                        {visibleCount} {visibleCount === 1 ? 'item' : 'items'}
                      </span>
                      {priceLabel && (
                        <span className="font-mono text-[#542820]/80 tabular-nums">
                          · {priceLabel}
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#713B32] group-hover:text-[#542820]">
                      <span>Open {cat.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Quick Order Tray Bar when dishes are selected */}
      <AnimatePresence>
        {onlineOrderingEnabled && totalCount > 0 && !drawerOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            className="fixed bottom-5 right-5 z-40"
          >
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="flex items-center gap-3 px-5 py-3.5 bg-[#C49A5A] hover:bg-[#d4ac6e] text-[#2B1915] font-semibold text-sm rounded-xl shadow-2xl border border-[#FFF9EF]/40 cursor-pointer transition-transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Order Tray ({totalCount})</span>
              <span className="font-mono font-bold tabular-nums">
                · ₹{pricedSubtotal}
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <WarliBorderPattern color="#FFF9EF" opacity={0.28} className="mt-16" />

      {/* Dedicated Category Menu Interface Modal */}
      <AnimatePresence>
        {activeCategory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setActiveCategorySlug(null)}
            className="fixed inset-0 z-50 bg-[#2B1915]/80 flex items-center justify-center p-3 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label={`${activeCategory.name} Menu`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 14 }}
              transition={{ duration: 0.24, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-5xl max-h-[90vh] bg-[#F5EBDD] text-[#2B1915] rounded-2xl shadow-2xl border border-[#C49A5A]/50 flex flex-col overflow-hidden"
            >
              {/* Modal Category Header */}
              <div className="bg-[#542820] text-[#FFF9EF] p-5 sm:p-6 border-b border-[#C49A5A]/30">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <CategoryArtwork
                      key={activeCategory.slug}
                      slug={activeCategory.slug}
                      name={activeCategory.name}
                    />
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#C49A5A] font-semibold">
                        HalliKatte Menu
                      </p>
                      <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[#FFF9EF]">
                        {activeCategory.name}
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-[#F5EBDD]/85">
                        {CATEGORY_SUBTITLES[activeCategory.slug] ||
                          'Freshly prepared to order in our kitchen'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onlineOrderingEnabled && totalCount > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCategorySlug(null);
                          setDrawerOpen(true);
                        }}
                        className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 bg-[#C49A5A] text-[#2B1915] rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Tray ({totalCount})</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveCategorySlug(null)}
                      aria-label="Close menu category"
                      className="w-10 h-10 rounded-lg bg-[#713B32] text-[#FFF9EF] hover:bg-[#8B493B] flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Quick Category Switcher Tabs inside Interface */}
                <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
                  {categories.map((cat) => {
                    const isCurrent = cat.slug === activeCategory.slug;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => openCategoryInterface(cat.slug)}
                        className={`px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-[#C49A5A] text-[#2B1915]'
                            : 'bg-[#713B32]/70 text-[#F5EBDD] hover:bg-[#713B32]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Filter Bar Inside Category Interface */}
              <div className="px-5 py-3 bg-[#EADBC8] border-b border-[#713B32]/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                  <Search className="w-3.5 h-3.5 text-[#542820]/60 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="search"
                    value={modalSearchQuery}
                    onChange={(e) => setModalSearchQuery(e.target.value)}
                    placeholder={`Search inside ${activeCategory.name}...`}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-xs text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                  />
                </div>

                <div className="inline-flex items-center gap-1 p-1 bg-[#713B32]/15 rounded-lg self-start sm:self-auto">
                  {(
                    [
                      { key: 'all', label: 'All' },
                      { key: 'veg', label: 'Pure Veg' },
                      { key: 'nonveg', label: 'Non-Veg' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setDietFilter(opt.key)}
                      className={`px-3 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors ${
                        dietFilter === opt.key
                          ? 'bg-[#713B32] text-[#FFF9EF]'
                          : 'text-[#542820] hover:bg-[#FFF9EF]/60'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Category Table */}
              <div className="flex-1 overflow-y-auto">
                {activeCategoryItems.length === 0 ? (
                  <div className="p-10 text-center text-sm text-[#542820]">
                    No dishes match your filter in {activeCategory.name}.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#EADBC8] text-[#542820] text-[11px] uppercase tracking-wider border-b border-[#713B32]/15 z-10">
                      <tr>
                        <th scope="col" className="py-3 pl-5 pr-3 font-semibold">
                          Dish &amp; Description
                        </th>
                        <th
                          scope="col"
                          className="py-3 px-3 font-semibold text-right whitespace-nowrap w-28"
                        >
                          Price
                        </th>
                        {onlineOrderingEnabled && (
                          <th
                            scope="col"
                            className="py-3 pl-3 pr-5 font-semibold text-right whitespace-nowrap w-36"
                          >
                            Order Tray
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#713B32]/12">
                      {activeCategoryItems.map((item) => {
                        const qty = getCartQty(item.id);
                        return (
                          <tr
                            key={item.id}
                            className="hover:bg-[#FFF9EF]/80 transition-colors"
                          >
                            <td className="py-4 pl-5 pr-3 align-top">
                              <div className="flex items-start gap-3.5">
                                <DishThumbnail
                                  item={item}
                                  sizeClass="w-16 h-16 sm:w-20 sm:h-20"
                                  onClick={() => setPreviewItem(item)}
                                />
                                <div className="flex items-start gap-2.5 min-w-0 pt-0.5">
                                  <span
                                    className={`mt-1.5 inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 border ${
                                      item.isVeg
                                        ? 'border-emerald-800'
                                        : 'border-red-800'
                                    }`}
                                    title={
                                      item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'
                                    }
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        item.isVeg ? 'bg-emerald-800' : 'bg-red-800'
                                      }`}
                                    />
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-display text-xl font-semibold text-[#2B1915] leading-snug">
                                      {item.name}
                                    </p>
                                    <p className="mt-1 text-xs sm:text-sm text-[#2B1915]/75 leading-relaxed max-w-2xl">
                                      {item.description}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-3 text-right align-middle whitespace-nowrap">
                              {typeof item.priceInr === 'number' ? (
                                <span className="font-mono text-base font-bold text-[#542820] tabular-nums">
                                  ₹{item.priceInr.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-xs text-[#713B32]">
                                  At restaurant
                                </span>
                              )}
                            </td>

                            {onlineOrderingEnabled && (
                              <td className="py-4 pl-3 pr-5 text-right align-middle whitespace-nowrap">
                                {!item.isAvailable ? (
                                  <span className="text-xs font-medium text-[#2B1915]/50">
                                    Unavailable
                                  </span>
                                ) : qty === 0 ? (
                                  <motion.button
                                    type="button"
                                    whileTap={{ scale: 0.96 }}
                                    onClick={() => addToCart(item)}
                                    className="px-4 py-2 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-sm"
                                  >
                                    Add to Tray
                                  </motion.button>
                                ) : (
                                  <div className="inline-flex items-center gap-2 bg-[#713B32] text-[#FFF9EF] rounded-lg px-2 py-1">
                                    <button
                                      type="button"
                                      aria-label={`Decrease quantity of ${item.name}`}
                                      onClick={() => updateCartQty(item.id, -1)}
                                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#542820] cursor-pointer"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="font-mono text-xs font-semibold w-5 text-center tabular-nums">
                                      {qty}
                                    </span>
                                    <button
                                      type="button"
                                      aria-label={`Increase quantity of ${item.name}`}
                                      onClick={() => updateCartQty(item.id, 1)}
                                      className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#542820] cursor-pointer"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Footer inside Category Interface */}
              <div className="px-5 py-3.5 bg-[#FFF9EF] border-t border-[#713B32]/20 flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setActiveCategorySlug(null)}
                  className="text-xs font-semibold text-[#713B32] hover:underline cursor-pointer"
                >
                  ← Back to All Menu Categories
                </button>

                {onlineOrderingEnabled && totalCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCategorySlug(null);
                      setDrawerOpen(true);
                    }}
                    className="px-4 py-2 bg-[#C49A5A] hover:bg-[#d4ac6e] text-[#2B1915] text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    View Order Tray ({totalCount} · ₹{pricedSubtotal})
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Over Cart / Order Tray Drawer */}
      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setDrawerOpen(false)}
            className="fixed inset-0 z-50 flex justify-end bg-[#2B1915]/60"
            role="dialog"
            aria-modal="true"
            aria-label="Order Tray"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 360, damping: 36 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#F5EBDD] text-[#2B1915] h-full flex flex-col shadow-2xl"
            >
              <div className="p-5 bg-[#542820] text-[#FFF9EF] flex items-center justify-between border-b border-[#C49A5A]/30">
                <div>
                  <h3 className="font-display text-2xl font-semibold">
                    Your Dining Tray
                  </h3>
                  <p className="text-xs text-[#F5EBDD]/80 mt-0.5 tabular-nums">
                    {totalCount} {totalCount === 1 ? 'dish' : 'dishes'} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close Order Tray"
                  className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#FFF9EF]/10 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {cart.length === 0 ? (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-10 h-10 text-[#713B32]/40 mx-auto" />
                    <p className="mt-3 font-display text-xl text-[#2B1915]">
                      Your tray is empty
                    </p>
                    <p className="mt-1 text-sm text-[#2B1915]/70">
                      Open any category — Combos, Main Course, Breads, or
                      Starters — to add dishes to your dining tray.
                    </p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {cart.map(({ item, quantity }) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: 24 }}
                        transition={{ duration: 0.2 }}
                        className="p-3.5 rounded-lg bg-[#FFF9EF] border border-[#713B32]/15 flex items-start justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <DishThumbnail
                            item={item}
                            sizeClass="w-14 h-14"
                          />
                          <div className="min-w-0">
                            <p className="font-display text-lg font-semibold text-[#2B1915] truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[#542820] mt-0.5">
                              {typeof item.priceInr === 'number'
                                ? `₹${item.priceInr} each`
                                : 'Price confirmed at restaurant'}
                            </p>
                            <div className="mt-2.5 inline-flex items-center gap-2 border border-[#713B32]/25 rounded-md px-1.5 py-0.5">
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.id, -1)}
                                aria-label={`Remove one ${item.name}`}
                                className="p-1 text-[#713B32] hover:text-[#2B1915] cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="font-mono text-xs font-semibold w-5 text-center tabular-nums">
                                {quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(item.id, 1)}
                                aria-label={`Add one ${item.name}`}
                                className="p-1 text-[#713B32] hover:text-[#2B1915] cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.id)}
                            aria-label={`Remove ${item.name}`}
                            className="text-[#713B32]/70 hover:text-red-700 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <span className="font-mono text-sm font-semibold text-[#2B1915] tabular-nums">
                            {typeof item.priceInr === 'number'
                              ? `₹${item.priceInr * quantity}`
                              : 'Pending'}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 bg-[#FFF9EF] border-t border-[#713B32]/20 space-y-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-medium text-[#2B1915]/80">
                      Order Tray Subtotal
                    </span>
                    <span className="font-mono text-lg font-bold text-[#542820] tabular-nums">
                      {pricedSubtotal > 0 ? `₹${pricedSubtotal}` : '₹0'}
                    </span>
                  </div>
                  {unpricedCount > 0 && (
                    <p className="text-xs text-[#713B32]">
                      {unpricedCount}{' '}
                      {unpricedCount === 1 ? 'dish has' : 'dishes have'} editable
                      pricing — final total follows restaurant rates.
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleAttachOrderToReservation}
                    className="w-full py-3 px-4 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] font-semibold text-sm rounded-lg transition-colors cursor-pointer"
                  >
                    Reserve Table With Selected Dishes
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enlarged Dish Photo Preview Lightbox */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => setPreviewItem(null)}
            className="fixed inset-0 z-[60] bg-[#2B1915]/85 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-label={previewItem.name}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[#F5EBDD] text-[#2B1915] rounded-2xl overflow-hidden shadow-2xl border border-[#C49A5A]/50"
            >
              <div className="relative aspect-[4/3] bg-[#542820]">
                {previewItem.imageUrl ? (
                  <img
                    src={previewItem.imageUrl}
                    alt={previewItem.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#C49A5A]">
                    <UtensilsCrossed className="w-12 h-12 opacity-75" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  aria-label="Close dish preview"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-[#2B1915]/80 text-[#FFF9EF] hover:bg-[#542820] flex items-center justify-center cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span
                      className={`mt-1.5 inline-flex items-center justify-center w-3.5 h-3.5 shrink-0 border ${
                        previewItem.isVeg ? 'border-emerald-800' : 'border-red-800'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          previewItem.isVeg ? 'bg-emerald-800' : 'bg-red-800'
                        }`}
                      />
                    </span>
                    <div>
                      <h4 className="font-display text-2xl font-semibold text-[#2B1915] leading-snug">
                        {previewItem.name}
                      </h4>
                      <p className="text-xs uppercase tracking-wider text-[#8B493B] font-semibold mt-0.5">
                        {categoryNameById[previewItem.categoryId] || 'Kitchen'}
                      </p>
                    </div>
                  </div>
                  {typeof previewItem.priceInr === 'number' && (
                    <span className="font-mono text-lg font-bold text-[#542820] tabular-nums shrink-0">
                      ₹{previewItem.priceInr.toFixed(2)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-sm text-[#2B1915]/80 leading-relaxed">
                  {previewItem.description}
                </p>

                {onlineOrderingEnabled && previewItem.isAvailable && (
                  <div className="mt-5 pt-4 border-t border-[#713B32]/15 flex items-center justify-between gap-3">
                    {getCartQty(previewItem.id) === 0 ? (
                      <button
                        type="button"
                        onClick={() => addToCart(previewItem)}
                        className="w-full py-2.5 px-4 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        Add to Tray
                      </button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-[#713B32] text-[#FFF9EF] rounded-lg px-3 py-1.5">
                        <span className="text-xs font-semibold">Added in Tray</span>
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateCartQty(previewItem.id, -1)}
                            aria-label={`Remove one ${previewItem.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#542820] cursor-pointer"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-mono text-sm font-semibold w-5 text-center tabular-nums">
                            {getCartQty(previewItem.id)}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(previewItem.id, 1)}
                            aria-label={`Add one ${previewItem.name}`}
                            className="w-7 h-7 flex items-center justify-center rounded hover:bg-[#542820] cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
