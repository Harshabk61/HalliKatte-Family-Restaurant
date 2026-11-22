import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera,
  CheckCircle2,
  Heart,
  ImagePlus,
  MessageSquarePlus,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { ReviewRecord } from '../types';
import { WarliBorderPattern } from './WarliMotifs';

interface CustomerPhotoShowcaseItem {
  id: string;
  src: string;
  title: string;
  caption: string;
  meta: string;
  rating?: number;
  isVisitorUpload?: boolean;
}

const HAPPY_CUSTOMER_PHOTOS: CustomerPhotoShowcaseItem[] = [
  {
    id: 'featured-1',
    src: '/assets/aistudio/image_22761386.png',
    title: 'Joint Family Feast',
    caption: 'Generations sharing starters and curries at our long cart-wheel table.',
    meta: 'Family Dinner · HalliKatte Dining Hall',
  },
  {
    id: 'featured-2',
    src: '/assets/aistudio/image_729b19d3.png',
    title: 'Evening Smiles',
    caption: 'Families enjoying unhurried dining and warm hospitality.',
    meta: 'Evening Dining · HalliKatte',
  },
  {
    id: 'featured-3',
    src: '/assets/aistudio/image_395a4a66.png',
    title: 'Friends Gathering',
    caption: 'Laughter and biryanis shared beneath our Banyan alcove.',
    meta: 'Friends Gathering · Banyan Alcove',
  },
  {
    id: 'featured-4',
    src: '/assets/aistudio/image_fe0ad879.png',
    title: 'Group Celebration',
    caption: 'Memorable group lunches and afternoon feasts in Nelamangala.',
    meta: 'Group Celebration · Main Courtyard',
  },
  {
    id: 'featured-5',
    src: '/assets/aistudio/image_f6c795c1.png',
    title: 'Memorable Evenings',
    caption: 'Warm conversations over aromatic plates at HalliKatte.',
    meta: 'Family Meal · Nelamangala',
  },
];

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB raw file accepted before client resize

function compressVisitorPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      reject(new Error('Please choose a PNG, JPG, or WEBP image file.'));
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error('Image file must be under 10 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('Selected file could not be loaded as an image.'));
      img.onload = () => {
        const maxSide = 1200;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (!width || !height) {
          reject(new Error('Invalid image dimensions.'));
          return;
        }

        if (width > maxSide || height > maxSide) {
          if (width >= height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.82);
        if (compressed.length > 2_600_000) {
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        } else {
          resolve(compressed);
        }
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

function ShowcaseImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#2B1915] text-[#F5EBDD]/70 p-4 text-center">
        <Camera className="w-7 h-7 text-[#C49A5A] mb-2" />
        <span className="text-xs font-medium">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

export function HappyCustomersSection() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'with-photos'>('all');
  const [selectedPhoto, setSelectedPhoto] =
    useState<CustomerPhotoShowcaseItem | null>(null);

  // Review submission form state (bottom of the page)
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [visitType, setVisitType] = useState('Family Dinner');
  const [favoriteDish, setFavoriteDish] = useState('');
  const [comment, setComment] = useState('');
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoProcessing, setPhotoProcessing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadReviews = () => {
    setLoading(true);
    fetch('/api/reviews')
      .then((res) =>
        res.ok ? res.json() : { reviews: [], averageRating: 0, totalReviews: 0 },
      )
      .then((data) => {
        setReviews(Array.isArray(data.reviews) ? data.reviews : []);
        setAverageRating(Number(data.averageRating || 0));
        setTotalReviews(Number(data.totalReviews || 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  useEffect(() => {
    if (!selectedPhoto) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedPhoto(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedPhoto]);

  const visitorPhotoCards = useMemo<CustomerPhotoShowcaseItem[]>(() => {
    return reviews
      .filter((r) => Boolean(r.photoUrl))
      .map((r) => ({
        id: `visitor-${r.id}`,
        src: r.photoUrl as string,
        title: r.reviewerName,
        caption: r.comment,
        meta: [
          r.visitType || 'Dining Guest',
          r.favoriteDish ? `Favourite: ${r.favoriteDish}` : null,
          new Date(r.createdAt).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }),
        ]
          .filter(Boolean)
          .join(' · '),
        rating: r.rating,
        isVisitorUpload: true,
      }));
  }, [reviews]);

  const combinedCustomerPhotos = useMemo(() => {
    return [...visitorPhotoCards, ...HAPPY_CUSTOMER_PHOTOS];
  }, [visitorPhotoCards]);

  const filteredReviews = useMemo(() => {
    if (reviewFilter === 'with-photos') {
      return reviews.filter((r) => Boolean(r.photoUrl));
    }
    return reviews;
  }, [reviews, reviewFilter]);

  const visitorPhotoCount = visitorPhotoCards.length;

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSubmitError(null);
    setPhotoProcessing(true);
    try {
      const compressed = await compressVisitorPhoto(file);
      setPhotoPreviewUrl(compressed);
      setPhotoFileName(file.name);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to process selected photo.',
      );
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setPhotoProcessing(false);
    }
  };

  const clearSelectedPhoto = () => {
    setPhotoPreviewUrl(null);
    setPhotoFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || photoProcessing) return;
    setSubmitError(null);
    setSubmitSuccess(false);

    if (reviewerName.trim().length < 2) {
      setSubmitError('Please enter your name (at least 2 characters).');
      return;
    }
    if (comment.trim().length < 5) {
      setSubmitError('Please write a brief review about your visit.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: reviewerName.trim(),
          rating,
          visitType,
          favoriteDish: favoriteDish.trim() || null,
          comment: comment.trim(),
          photoUrl: photoPreviewUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not submit your review.');
      }

      const created = data.review as ReviewRecord;
      setReviews((prev) => {
        const next = [created, ...prev];
        const avg = Number(
          (
            next.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
            next.length
          ).toFixed(1),
        );
        setAverageRating(avg);
        setTotalReviews(next.length);
        return next;
      });
      setReviewerName('');
      setRating(5);
      setVisitType('Family Dinner');
      setFavoriteDish('');
      setComment('');
      clearSelectedPhoto();
      setSubmitSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Unable to save review right now.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const scrollToForm = () => {
    const el = document.getElementById('write-review');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section
      id="reviews"
      className="relative bg-[#713B32] text-[#FFF9EF] py-20 sm:py-28 overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Part 1: Our Happy Customers Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#FFF9EF]/15"
        >
          <div>
            <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C49A5A] inline-flex items-center gap-2">
              <Heart className="w-3.5 h-3.5" />
              <span>Moments Shared Around Our Tables</span>
            </p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl font-semibold text-[#FFF9EF] text-balance">
              Our Happy Customers
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#F5EBDD]/85 max-w-2xl">
              Families, friends, and neighbours sharing memories, dining photos,
              and honest reviews from HalliKatte Family Restaurant in
              Nelamangala.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-5 shrink-0">
            {totalReviews > 0 && (
              <div className="flex items-center gap-2.5 text-sm text-[#F5EBDD]">
                <Star className="w-5 h-5 text-[#C49A5A] fill-[#C49A5A]" />
                <span className="font-mono text-xl font-bold text-[#FFF9EF] tabular-nums">
                  {averageRating}
                </span>
                <span className="text-[#F5EBDD]/75 tabular-nums">
                  / 5 · {totalReviews}{' '}
                  {totalReviews === 1 ? 'review' : 'reviews'}
                </span>
              </div>
            )}

            <button
              type="button"
              onClick={scrollToForm}
              className="px-5 py-2.5 bg-[#C49A5A] hover:bg-[#d4ac6e] text-[#2B1915] font-semibold text-sm rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFF9EF]"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Write a Review</span>
            </button>
          </div>
        </motion.div>

        {/* Visitor-Uploaded & Community Dining Photo Gallery */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {combinedCustomerPhotos.map((photo, idx) => (
            <motion.figure
              key={photo.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.12 }}
              transition={{ duration: 0.35, delay: Math.min(idx, 4) * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => setSelectedPhoto(photo)}
              className="rounded-xl overflow-hidden bg-[#542820] border border-[#C49A5A]/30 shadow-lg cursor-pointer group flex flex-col"
            >
              <div className="aspect-[4/3] sm:aspect-[3/4] overflow-hidden bg-[#2B1915]">
                <ShowcaseImage
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <figcaption className="p-3.5 bg-[#542820] flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-display text-lg font-semibold text-[#FFF9EF] truncate">
                      {photo.title}
                    </p>
                    {photo.rating && (
                      <span className="inline-flex items-center gap-1 font-mono text-xs text-[#C49A5A] tabular-nums shrink-0">
                        <Star className="w-3.5 h-3.5 fill-[#C49A5A]" />
                        {photo.rating}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#F5EBDD]/80 leading-relaxed line-clamp-2">
                    {photo.caption}
                  </p>
                </div>
                <p className="mt-2 pt-2 border-t border-[#FFF9EF]/10 text-[11px] text-[#C49A5A]/90 truncate">
                  {photo.isVisitorUpload
                    ? `Visitor Photo · ${photo.meta}`
                    : photo.meta}
                </p>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        {/* Part 2: Guest Reviews Display */}
        <div className="mt-14">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#FFF9EF]/15">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-semibold text-[#C49A5A]">
                Guestbook Feedback
              </p>
              <h3 className="mt-1 font-display text-3xl sm:text-4xl font-semibold text-[#FFF9EF]">
                Verified Guest Reviews
              </h3>
            </div>

            {visitorPhotoCount > 0 && (
              <div className="flex items-center gap-1 p-1 bg-[#542820] rounded-lg border border-[#C49A5A]/25">
                <button
                  type="button"
                  onClick={() => setReviewFilter('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    reviewFilter === 'all'
                      ? 'bg-[#FFF9EF] text-[#2B1915]'
                      : 'text-[#F5EBDD]/80 hover:text-[#FFF9EF]'
                  }`}
                >
                  All Reviews ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewFilter('with-photos')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    reviewFilter === 'with-photos'
                      ? 'bg-[#FFF9EF] text-[#2B1915]'
                      : 'text-[#F5EBDD]/80 hover:text-[#FFF9EF]'
                  }`}
                >
                  With Photos ({visitorPhotoCount})
                </button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-xl bg-[#542820]/60 border border-[#FFF9EF]/10 animate-pulse"
                />
              ))}
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="mt-6 p-8 sm:p-10 rounded-2xl bg-[#542820]/80 border border-[#FFF9EF]/15 text-center">
              <Star className="w-8 h-8 text-[#C49A5A] mx-auto" />
              <p className="mt-3 font-display text-2xl sm:text-3xl text-[#FFF9EF]">
                Be the First Guest to Share Your Feedback
              </p>
              <p className="mt-2 text-sm text-[#F5EBDD]/80 max-w-lg mx-auto">
                Dined with us recently? Post your review and upload a photo from
                your table using the feedback form right below.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <AnimatePresence>
                {filteredReviews.map((rev) => (
                  <motion.article
                    key={rev.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="p-5 sm:p-6 rounded-xl bg-[#542820] border border-[#C49A5A]/25 shadow-md flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-display text-2xl font-semibold text-[#FFF9EF] truncate">
                            {rev.reviewerName}
                          </p>
                          <p className="text-xs text-[#C49A5A] mt-0.5">
                            {[
                              rev.visitType || 'Dining Guest',
                              rev.favoriteDish
                                ? `Favourite: ${rev.favoriteDish}`
                                : null,
                              new Date(rev.createdAt).toLocaleDateString(
                                'en-IN',
                                {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                },
                              ),
                            ]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        </div>

                        <div
                          className="flex items-center gap-1 shrink-0"
                          aria-label={`Rated ${rev.rating} out of 5 stars`}
                        >
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < rev.rating
                                  ? 'text-[#C49A5A] fill-[#C49A5A]'
                                  : 'text-[#FFF9EF]/20'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <p className="mt-3 text-sm sm:text-base text-[#F5EBDD]/90 leading-relaxed">
                        “{rev.comment}”
                      </p>
                    </div>

                    {rev.photoUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedPhoto({
                            id: `review-photo-${rev.id}`,
                            src: rev.photoUrl as string,
                            title: rev.reviewerName,
                            caption: rev.comment,
                            meta: [
                              rev.visitType || 'Dining Guest',
                              rev.favoriteDish
                                ? `Favourite: ${rev.favoriteDish}`
                                : null,
                            ]
                              .filter(Boolean)
                              .join(' · '),
                            rating: rev.rating,
                            isVisitorUpload: true,
                          })
                        }
                        className="group relative rounded-lg overflow-hidden border border-[#C49A5A]/30 bg-[#2B1915] aspect-[16/10] w-full cursor-pointer text-left"
                      >
                        <ShowcaseImage
                          src={rev.photoUrl}
                          alt={`Visit photo uploaded by ${rev.reviewerName}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent px-3 py-2 flex items-center justify-between text-xs text-[#FFF9EF]">
                          <span>Uploaded by {rev.reviewerName}</span>
                          <span className="text-[#C49A5A] font-medium">
                            View Photo
                          </span>
                        </div>
                      </button>
                    )}
                  </motion.article>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        <WarliBorderPattern color="#FFF9EF" opacity={0.35} className="my-16" />

        {/* Part 3: Review & Photo Submission Form at the Bottom of the Page */}
        <motion.div
          id="write-review"
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45 }}
          className="scroll-mt-24 bg-[#F5EBDD] text-[#2B1915] rounded-2xl p-6 sm:p-10 shadow-xl border border-[#C49A5A]/45"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* Left Intro Column */}
            <div className="lg:col-span-4 space-y-4">
              <div className="flex items-center gap-2 text-[#713B32]">
                <MessageSquarePlus className="w-5 h-5" />
                <p className="text-xs tracking-[0.18em] uppercase font-semibold">
                  Share Your Experience
                </p>
              </div>
              <h3 className="font-display text-3xl sm:text-4xl font-semibold text-[#2B1915] text-balance">
                Post Your Review &amp; Visit Photo
              </h3>
              <p className="text-sm text-[#2B1915]/80 leading-relaxed">
                Tell future guests what you loved about your meal at HalliKatte.
                Your feedback—and any photo you upload from your visit—appears
                directly in Our Happy Customers above.
              </p>

              <div className="pt-4 border-t border-[#713B32]/15 space-y-2 text-xs text-[#542820]/85">
                <p>· Rate your visit from 1 to 5 stars</p>
                <p>· Mention your favourite combo, biryani, or starter</p>
                <p>· Optionally attach a photo (PNG, JPG, or WEBP)</p>
              </div>
            </div>

            {/* Right Form Column */}
            <form
              onSubmit={handleSubmitReview}
              className="lg:col-span-8 space-y-5"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#542820] mb-1.5">
                    Your Rating *
                  </label>
                  <div className="flex items-center gap-1.5 min-h-[44px]">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const active = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          aria-label={`Rate ${star} stars`}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1.5 cursor-pointer transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#713B32] rounded"
                        >
                          <Star
                            className={`w-6 h-6 transition-colors ${
                              active
                                ? 'text-[#C49A5A] fill-[#C49A5A]'
                                : 'text-[#713B32]/30'
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="ml-2 font-mono text-xs font-semibold text-[#542820] tabular-nums">
                      {rating} / 5
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="review-name"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                  >
                    Your Name *
                  </label>
                  <input
                    id="review-name"
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="e.g., Ananya Rao"
                    className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="review-visit"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                  >
                    Visit Type
                  </label>
                  <select
                    id="review-visit"
                    value={visitType}
                    onChange={(e) => setVisitType(e.target.value)}
                    className="mt-1.5 w-full px-3 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                  >
                    <option value="Family Dinner">Family Dinner</option>
                    <option value="Friends Gathering">Friends Gathering</option>
                    <option value="Birthday / Celebration">
                      Birthday / Celebration
                    </option>
                    <option value="Lunch">Lunch</option>
                    <option value="Weekend Treat">Weekend Treat</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="review-dish"
                    className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                  >
                    Favourite Dish
                  </label>
                  <input
                    id="review-dish"
                    type="text"
                    value={favoriteDish}
                    onChange={(e) => setFavoriteDish(e.target.value)}
                    placeholder="e.g., Chicken Biryani, Mutton Combo"
                    className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="review-comment"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                >
                  Your Feedback *
                </label>
                <textarea
                  id="review-comment"
                  rows={3}
                  required
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about the food, ambience, and hospitality..."
                  className="mt-1.5 w-full px-3.5 py-2.5 bg-[#FFF9EF] border border-[#713B32]/25 rounded-lg text-sm text-[#2B1915] focus:outline-none focus:ring-2 focus:ring-[#713B32]"
                />
              </div>

              {/* Visitor Photo Upload Control */}
              <div>
                <label
                  htmlFor="review-photo-upload"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#542820]"
                >
                  Upload a Photo From Your Visit (Optional)
                </label>
                <input
                  ref={fileInputRef}
                  id="review-photo-upload"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handlePhotoSelect}
                  className="sr-only"
                />

                {!photoPreviewUrl ? (
                  <div className="mt-1.5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={photoProcessing}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFF9EF] hover:bg-white border border-dashed border-[#713B32]/40 rounded-lg text-sm font-medium text-[#542820] transition-colors cursor-pointer disabled:opacity-60"
                    >
                      <ImagePlus className="w-4 h-4 text-[#713B32]" />
                      <span>
                        {photoProcessing
                          ? 'Preparing Photo...'
                          : 'Choose Photo'}
                      </span>
                    </button>
                    <span className="text-xs text-[#2B1915]/65">
                      PNG, JPG, or WEBP · Automatically resized for fast upload
                    </span>
                  </div>
                ) : (
                  <div className="mt-2 flex flex-wrap items-center gap-4 p-3 bg-[#FFF9EF] border border-[#713B32]/25 rounded-xl">
                    <img
                      src={photoPreviewUrl}
                      alt="Selected visit photo preview"
                      className="w-20 h-20 object-cover rounded-lg border border-[#C49A5A]/40 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-[#2B1915] truncate">
                        {photoFileName || 'Visit photo ready'}
                      </p>
                      <p className="text-xs text-[#542820]/75 mt-0.5">
                        Will appear in Our Happy Customers with your review
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearSelectedPhoto}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="text-xs sm:text-sm text-red-700 font-medium bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-lg"
                >
                  {submitError}
                </p>
              )}

              {submitSuccess && (
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-emerald-900 font-medium bg-emerald-50 border border-emerald-200 px-4 py-3 rounded-lg">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Thank you! Your review is now live in Our Happy Customers
                      above.
                    </span>
                  </span>
                  <a
                    href="#reviews"
                    onClick={(e) => {
                      e.preventDefault();
                      document
                        .getElementById('reviews')
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="underline font-semibold text-emerald-950 whitespace-nowrap"
                  >
                    View Reviews
                  </a>
                </div>
              )}

              <div className="flex justify-end">
                <motion.button
                  type="submit"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={submitting || photoProcessing}
                  className="w-full sm:w-auto px-7 py-3 bg-[#713B32] hover:bg-[#542820] text-[#FFF9EF] font-semibold text-sm rounded-lg transition-colors cursor-pointer disabled:opacity-60 whitespace-nowrap"
                >
                  {submitting ? 'Publishing Review...' : 'Submit Feedback'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Lightbox for Customer & Visitor Uploaded Photos */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-[#2B1915]/92 flex items-center justify-center p-4 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-label={selectedPhoto.title}
          >
            <button
              type="button"
              onClick={() => setSelectedPhoto(null)}
              aria-label="Close photo"
              className="absolute top-5 right-5 w-11 h-11 rounded-full bg-[#542820] text-[#FFF9EF] flex items-center justify-center hover:bg-[#713B32] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-3xl w-full bg-[#F5EBDD] text-[#2B1915] rounded-2xl overflow-hidden shadow-2xl"
            >
              <img
                src={selectedPhoto.src}
                alt={selectedPhoto.title}
                referrerPolicy="no-referrer"
                className="w-full max-h-[70vh] object-contain bg-[#2B1915]"
              />
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-wider text-[#713B32] font-semibold">
                    {selectedPhoto.isVisitorUpload
                      ? 'Visitor Review & Photo'
                      : 'Our Happy Customers'}
                  </p>
                  {selectedPhoto.rating && (
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < (selectedPhoto.rating ?? 0)
                              ? 'text-[#C49A5A] fill-[#C49A5A]'
                              : 'text-[#713B32]/25'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
                <h4 className="mt-1 font-display text-2xl font-semibold">
                  {selectedPhoto.title}
                </h4>
                <p className="mt-1.5 text-sm text-[#2B1915]/85 leading-relaxed">
                  {selectedPhoto.caption}
                </p>
                {selectedPhoto.meta && (
                  <p className="mt-2 text-xs text-[#542820]/75">
                    {selectedPhoto.meta}
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
