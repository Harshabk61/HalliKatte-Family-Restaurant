import 'dotenv/config';
import express, { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './src/db/index.ts';
import {
  cancelCustomerReservation,
  createContactMessage,
  createReservationRecord,
  createReviewRecord,
  deleteReviewRecord,
  getAdminContactMessages,
  getAdminCustomers,
  getAdminReservations,
  getAdminReviews,
  getAdminTables,
  getApprovedReviews,
  getAvailabilityForDate,
  getGalleryData,
  getMenuData,
  getPublicSettings,
  lookupReservation,
  updateCustomerReservation,
  upsertSetting,
} from './src/db/queries.ts';
import {
  contactMessages,
  galleryImages,
  menuItems,
  reservations,
  restaurantTables,
} from './src/db/schema.ts';
import { AuthRequest, requireAdmin, requireAuth } from './src/middleware/auth.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function isValidFutureOrTodayDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const parsed = new Date(Date.UTC(y, m - 1, d));
  if (
    parsed.getUTCFullYear() !== y ||
    parsed.getUTCMonth() !== m - 1 ||
    parsed.getUTCDate() !== d
  ) {
    return false;
  }
  // Compare against local India/Bengaluru date (UTC+5:30)
  const nowIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayIst = nowIst.toISOString().slice(0, 10);
  return dateStr >= todayIst;
}

function isSlotInPastToday(dateStr: string, timeStr: string): boolean {
  const nowIst = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  const todayIst = nowIst.toISOString().slice(0, 10);
  if (dateStr > todayIst) return false;
  if (dateStr < todayIst) return true;
  const [hh, mm] = timeStr.split(':').map(Number);
  const curMinutes = nowIst.getUTCHours() * 60 + nowIst.getUTCMinutes();
  return hh * 60 + mm <= curMinutes + 15;
}

function sanitizeImageUrl(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/src/assets/') || trimmed.startsWith('/assets/aistudio/')) {
    return trimmed;
  }
  if (/^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

const MAX_VISITOR_PHOTO_CHARS = 2_800_000; // ~2 MB decoded image

function sanitizeVisitorPhotoDataUrl(url: unknown): {
  valid: boolean;
  value: string | null;
} {
  if (url === undefined || url === null || url === '') {
    return { valid: true, value: null };
  }
  if (typeof url !== 'string') {
    return { valid: false, value: null };
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return { valid: true, value: null };
  }
  if (
    trimmed.length <= MAX_VISITOR_PHOTO_CHARS &&
    /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/i.test(trimmed)
  ) {
    return { valid: true, value: trimmed };
  }
  return { valid: false, value: null };
}

function sanitizeExternalUrl(url: unknown): string {
  if (typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed;
    }
    return '';
  } catch {
    return '';
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'hallikatte-restaurant' });
  });

  // Public Settings
  app.get('/api/settings', async (_req: Request, res: Response) => {
    try {
      const settings = await getPublicSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to load restaurant settings.',
      });
    }
  });

  // Public Menu
  app.get('/api/menu', async (_req: Request, res: Response) => {
    try {
      const data = await getMenuData(false);
      res.json(data);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unable to load menu.',
      });
    }
  });

  // Public Gallery
  app.get('/api/gallery', async (_req: Request, res: Response) => {
    try {
      const items = await getGalleryData(false);
      res.json(items);
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unable to load gallery.',
      });
    }
  });

  // Reservation Availability Check
  app.get(
    '/api/reservations/availability',
    async (req: Request, res: Response) => {
      const dateStr = String(req.query.date || '');
      const guests = Number(req.query.guests || 2);

      if (!isValidFutureOrTodayDate(dateStr)) {
        return res
          .status(400)
          .json({ error: 'Please select today or an upcoming valid date.' });
      }
      if (!Number.isInteger(guests) || guests < 1 || guests > 24) {
        return res
          .status(400)
          .json({ error: 'Guest count must be between 1 and 24.' });
      }

      try {
        const slots = await getAvailabilityForDate(dateStr, guests);
        const filtered = slots.map((slot) => ({
          ...slot,
          available:
            slot.available && !isSlotInPastToday(dateStr, slot.time),
        }));
        res.json({ date: dateStr, guests, slots: filtered });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to check table availability.',
        });
      }
    },
  );

  // Create Reservation
  app.post('/api/reservations', async (req: Request, res: Response) => {
    const {
      customerName,
      phone,
      email,
      reservationDate,
      reservationTime,
      guests,
      occasion,
      specialRequests,
    } = req.body || {};

    if (typeof customerName !== 'string' || customerName.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid 10-digit phone number.' });
    }
    if (
      typeof email === 'string' &&
      email.trim() &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
    ) {
      return res
        .status(400)
        .json({ error: 'Please enter a valid email address.' });
    }
    if (
      typeof reservationDate !== 'string' ||
      !isValidFutureOrTodayDate(reservationDate)
    ) {
      return res
        .status(400)
        .json({ error: 'Reservations cannot be made in the past.' });
    }
    if (
      typeof reservationTime !== 'string' ||
      !/^\d{2}:\d{2}$/.test(reservationTime)
    ) {
      return res
        .status(400)
        .json({ error: 'Please select a valid reservation time slot.' });
    }
    if (isSlotInPastToday(reservationDate, reservationTime)) {
      return res
        .status(400)
        .json({ error: 'Selected time slot has already passed.' });
    }
    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 24) {
      return res
        .status(400)
        .json({ error: 'Number of guests must be between 1 and 24.' });
    }

    try {
      const created = await createReservationRecord({
        customerName: customerName.trim(),
        phone: cleanPhone.slice(-10),
        email: typeof email === 'string' && email.trim() ? email.trim() : null,
        reservationDate,
        reservationTime,
        guests: guestCount,
        occasion:
          typeof occasion === 'string' && occasion.trim()
            ? occasion.trim()
            : null,
        specialRequests:
          typeof specialRequests === 'string' && specialRequests.trim()
            ? specialRequests.trim()
            : null,
      });

      res.status(201).json({ reservation: created });
    } catch (error) {
      const status =
        (error as Error & { statusCode?: number }).statusCode || 500;
      res.status(status).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to complete your reservation.',
      });
    }
  });

  // Lookup Reservation by Ref + Phone
  app.get(
    '/api/reservations/lookup',
    async (req: Request, res: Response) => {
      const bookingRef = String(req.query.bookingRef || '').trim();
      const phone = String(req.query.phone || '').replace(/\D/g, '');

      if (!bookingRef || phone.length < 10) {
        return res.status(400).json({
          error:
            'Please provide both your booking reference and 10-digit phone number.',
        });
      }

      try {
        const found = await lookupReservation(bookingRef, phone);
        if (!found) {
          return res.status(404).json({
            error:
              'No reservation matched that booking reference and phone number.',
          });
        }
        res.json({ reservation: found });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to look up reservation.',
        });
      }
    },
  );

  // Customer Update Reservation
  app.patch(
    '/api/reservations/:bookingRef',
    async (req: Request, res: Response) => {
      const bookingRef = String(req.params.bookingRef || '');
      const { phone, reservationDate, reservationTime, guests, specialRequests, occasion } =
        req.body || {};

      const cleanPhone = String(phone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return res
          .status(400)
          .json({ error: 'Verified 10-digit phone number is required.' });
      }
      if (reservationDate && !isValidFutureOrTodayDate(String(reservationDate))) {
        return res
          .status(400)
          .json({ error: 'Reservation date cannot be in the past.' });
      }
      if (
        reservationDate &&
        reservationTime &&
        isSlotInPastToday(String(reservationDate), String(reservationTime))
      ) {
        return res
          .status(400)
          .json({ error: 'Selected time slot has already passed.' });
      }

      try {
        const updated = await updateCustomerReservation(bookingRef, cleanPhone, {
          reservationDate:
            typeof reservationDate === 'string' ? reservationDate : undefined,
          reservationTime:
            typeof reservationTime === 'string' ? reservationTime : undefined,
          guests: guests !== undefined ? Number(guests) : undefined,
          specialRequests:
            typeof specialRequests === 'string' ? specialRequests : undefined,
          occasion: typeof occasion === 'string' ? occasion : undefined,
        });

        if (!updated) {
          return res.status(404).json({
            error: 'Reservation not found for that booking reference and phone.',
          });
        }
        res.json({ reservation: updated });
      } catch (error) {
        const status =
          (error as Error & { statusCode?: number }).statusCode || 500;
        res.status(status).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to update reservation.',
        });
      }
    },
  );

  // Customer Cancel Reservation
  app.post(
    '/api/reservations/:bookingRef/cancel',
    async (req: Request, res: Response) => {
      const bookingRef = String(req.params.bookingRef || '');
      const cleanPhone = String(req.body?.phone || '').replace(/\D/g, '');

      if (cleanPhone.length < 10) {
        return res
          .status(400)
          .json({ error: 'Verified 10-digit phone number is required.' });
      }

      try {
        const cancelled = await cancelCustomerReservation(bookingRef, cleanPhone);
        if (!cancelled) {
          return res.status(404).json({
            error: 'Reservation not found for that booking reference and phone.',
          });
        }
        res.json({ reservation: cancelled });
      } catch (error) {
        const status =
          (error as Error & { statusCode?: number }).statusCode || 500;
        res.status(status).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to cancel reservation.',
        });
      }
    },
  );

  // Contact Inquiry Form
  app.post('/api/contact', async (req: Request, res: Response) => {
    const { name, phone, email, message } = req.body || {};
    if (typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({ error: 'Please provide your name.' });
    }
    const cleanPhone = String(phone || '').replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      return res
        .status(400)
        .json({ error: 'Please provide a valid 10-digit phone number.' });
    }
    if (typeof message !== 'string' || message.trim().length < 5) {
      return res
        .status(400)
        .json({ error: 'Please enter your message (at least 5 characters).' });
    }

    try {
      const saved = await createContactMessage({
        name: name.trim(),
        phone: cleanPhone.slice(-10),
        email: typeof email === 'string' && email.trim() ? email.trim() : null,
        message: message.trim(),
      });
      res.status(201).json({ contactMessage: saved });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to send your message.',
      });
    }
  });

  // Public Guest Reviews
  app.get('/api/reviews', async (_req: Request, res: Response) => {
    try {
      const list = await getApprovedReviews();
      const total = list.length;
      const averageRating =
        total > 0
          ? Number(
              (
                list.reduce((sum, r) => sum + Number(r.rating || 0), 0) / total
              ).toFixed(1),
            )
          : 0;
      res.json({ reviews: list, averageRating, totalReviews: total });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error ? error.message : 'Unable to load reviews.',
      });
    }
  });

  app.post('/api/reviews', async (req: Request, res: Response) => {
    const { reviewerName, rating, visitType, favoriteDish, comment, photoUrl } =
      req.body || {};

    if (typeof reviewerName !== 'string' || reviewerName.trim().length < 2) {
      return res
        .status(400)
        .json({ error: 'Please enter your name (at least 2 characters).' });
    }
    const parsedRating = Number(rating);
    if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      return res
        .status(400)
        .json({ error: 'Please select a star rating between 1 and 5.' });
    }
    if (typeof comment !== 'string' || comment.trim().length < 5) {
      return res.status(400).json({
        error: 'Please share a brief review (at least 5 characters).',
      });
    }
    const sanitizedPhoto = sanitizeVisitorPhotoDataUrl(photoUrl);
    if (!sanitizedPhoto.valid) {
      return res.status(400).json({
        error: 'Please upload a valid PNG, JPG, or WEBP photo under 2 MB.',
      });
    }

    try {
      const created = await createReviewRecord({
        reviewerName: reviewerName.trim().slice(0, 80),
        rating: parsedRating,
        visitType:
          typeof visitType === 'string' && visitType.trim()
            ? visitType.trim().slice(0, 60)
            : null,
        favoriteDish:
          typeof favoriteDish === 'string' && favoriteDish.trim()
            ? favoriteDish.trim().slice(0, 80)
            : null,
        comment: comment.trim().slice(0, 800),
        photoUrl: sanitizedPhoto.value,
      });
      res.status(201).json({ review: created });
    } catch (error) {
      res.status(500).json({
        error:
          error instanceof Error
            ? error.message
            : 'Unable to save your review.',
      });
    }
  });

  // ============================================
  // PROTECTED ADMIN ROUTES (Firebase Auth + RBAC)
  // ============================================

  app.get(
    '/api/admin/me',
    requireAuth,
    requireAdmin,
    (req: AuthRequest, res: Response) => {
      res.json({
        email: req.user?.email,
        name: req.user?.name || 'Restaurant Admin',
        role: req.adminRole,
      });
    },
  );

  app.get(
    '/api/admin/reservations',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      try {
        const rows = await getAdminReservations({
          date: req.query.date ? String(req.query.date) : undefined,
          status: req.query.status ? String(req.query.status) : undefined,
          search: req.query.search ? String(req.query.search) : undefined,
        });
        res.json({ reservations: rows });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load reservations.',
        });
      }
    },
  );

  app.patch(
    '/api/admin/reservations/:id/status',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      const status = String(req.body?.status || '');
      const allowed = ['Pending', 'Confirmed', 'Cancelled', 'Completed'];
      if (!Number.isInteger(id) || !allowed.includes(status)) {
        return res
          .status(400)
          .json({ error: 'Valid reservation ID and status are required.' });
      }

      try {
        const [updated] = await db
          .update(reservations)
          .set({ status, updatedAt: new Date() })
          .where(eq(reservations.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: 'Reservation not found.' });
        }
        res.json({ reservation: updated });
      } catch (error) {
        console.error('Admin update status failed:', error);
        res.status(500).json({ error: 'Unable to update reservation status.' });
      }
    },
  );

  app.get(
    '/api/admin/customers',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const rows = await getAdminCustomers();
        res.json({ customers: rows });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load customers.',
        });
      }
    },
  );

  app.get(
    '/api/admin/tables',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const rows = await getAdminTables();
        res.json({ tables: rows });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : 'Unable to load tables.',
        });
      }
    },
  );

  app.patch(
    '/api/admin/tables/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      const { capacity, isActive, label, area } = req.body || {};
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid table ID.' });
      }

      try {
        const updateSet: Partial<typeof restaurantTables.$inferInsert> = {};
        if (typeof capacity === 'number' && capacity >= 1 && capacity <= 30) {
          updateSet.capacity = capacity;
        }
        if (typeof isActive === 'boolean') {
          updateSet.isActive = isActive;
        }
        if (typeof label === 'string' && label.trim()) {
          updateSet.label = label.trim();
        }
        if (typeof area === 'string' && area.trim()) {
          updateSet.area = area.trim();
        }

        const [updated] = await db
          .update(restaurantTables)
          .set(updateSet)
          .where(eq(restaurantTables.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: 'Table not found.' });
        }
        res.json({ table: updated });
      } catch (error) {
        console.error('Admin table update failed:', error);
        res.status(500).json({ error: 'Unable to update table.' });
      }
    },
  );

  app.get(
    '/api/admin/menu',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const data = await getMenuData(true);
        res.json(data);
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error ? error.message : 'Unable to load menu.',
        });
      }
    },
  );

  app.post(
    '/api/admin/menu/items',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const {
        categoryId,
        name,
        description,
        priceInr,
        isVeg,
        isAvailable,
        imageUrl,
      } = req.body || {};

      if (
        !Number.isInteger(Number(categoryId)) ||
        typeof name !== 'string' ||
        !name.trim()
      ) {
        return res
          .status(400)
          .json({ error: 'Category and dish name are required.' });
      }

      const parsedPrice =
        priceInr === null || priceInr === '' || priceInr === undefined
          ? null
          : Number(priceInr);
      if (
        parsedPrice !== null &&
        (!Number.isFinite(parsedPrice) || parsedPrice < 0)
      ) {
        return res
          .status(400)
          .json({ error: 'Price must be a valid positive number.' });
      }

      try {
        const [created] = await db
          .insert(menuItems)
          .values({
            categoryId: Number(categoryId),
            name: name.trim(),
            description:
              typeof description === 'string' && description.trim()
                ? description.trim()
                : 'Prepared fresh in our kitchen.',
            priceInr: parsedPrice !== null ? Math.round(parsedPrice) : null,
            isVeg: Boolean(isVeg),
            isAvailable: isAvailable !== false,
            imageUrl: sanitizeImageUrl(imageUrl),
          })
          .returning();

        res.status(201).json({ item: created });
      } catch (error) {
        console.error('Create menu item failed:', error);
        res.status(500).json({ error: 'Unable to create menu item.' });
      }
    },
  );

  app.patch(
    '/api/admin/menu/items/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid menu item ID.' });
      }

      const {
        categoryId,
        name,
        description,
        priceInr,
        isVeg,
        isAvailable,
        imageUrl,
      } = req.body || {};

      const updateSet: Partial<typeof menuItems.$inferInsert> = {
        updatedAt: new Date(),
      };
      if (categoryId !== undefined && Number.isInteger(Number(categoryId))) {
        updateSet.categoryId = Number(categoryId);
      }
      if (typeof name === 'string' && name.trim()) {
        updateSet.name = name.trim();
      }
      if (typeof description === 'string') {
        updateSet.description = description.trim();
      }
      if (priceInr !== undefined) {
        if (priceInr === null || priceInr === '') {
          updateSet.priceInr = null;
        } else {
          const p = Number(priceInr);
          if (!Number.isFinite(p) || p < 0) {
            return res.status(400).json({ error: 'Invalid price value.' });
          }
          updateSet.priceInr = Math.round(p);
        }
      }
      if (typeof isVeg === 'boolean') {
        updateSet.isVeg = isVeg;
      }
      if (typeof isAvailable === 'boolean') {
        updateSet.isAvailable = isAvailable;
      }
      if (imageUrl !== undefined) {
        updateSet.imageUrl = sanitizeImageUrl(imageUrl);
      }

      try {
        const [updated] = await db
          .update(menuItems)
          .set(updateSet)
          .where(eq(menuItems.id, id))
          .returning();

        if (!updated) {
          return res.status(404).json({ error: 'Menu item not found.' });
        }
        res.json({ item: updated });
      } catch (error) {
        console.error('Update menu item failed:', error);
        res.status(500).json({ error: 'Unable to update menu item.' });
      }
    },
  );

  app.delete(
    '/api/admin/menu/items/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid menu item ID.' });
      }

      try {
        const [deleted] = await db
          .delete(menuItems)
          .where(eq(menuItems.id, id))
          .returning();
        if (!deleted) {
          return res.status(404).json({ error: 'Menu item not found.' });
        }
        res.json({ deletedId: deleted.id });
      } catch (error) {
        console.error('Delete menu item failed:', error);
        res.status(500).json({ error: 'Unable to delete menu item.' });
      }
    },
  );

  app.get(
    '/api/admin/gallery',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const items = await getGalleryData(true);
        res.json({ items });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load gallery.',
        });
      }
    },
  );

  app.post(
    '/api/admin/gallery',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const { section, title, caption, imageUrl, isVisible } = req.body || {};
      if (typeof section !== 'string' || typeof title !== 'string' || !title.trim()) {
        return res
          .status(400)
          .json({ error: 'Gallery section and title are required.' });
      }

      try {
        const [created] = await db
          .insert(galleryImages)
          .values({
            section: section.trim(),
            title: title.trim(),
            caption:
              typeof caption === 'string' && caption.trim()
                ? caption.trim()
                : 'HalliKatte Family Restaurant',
            imageUrl: sanitizeImageUrl(imageUrl),
            isVisible: isVisible !== false,
          })
          .returning();
        res.status(201).json({ item: created });
      } catch (error) {
        console.error('Create gallery item failed:', error);
        res.status(500).json({ error: 'Unable to add gallery item.' });
      }
    },
  );

  app.patch(
    '/api/admin/gallery/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid gallery ID.' });
      }

      const { section, title, caption, imageUrl, isVisible } = req.body || {};
      const updateSet: Partial<typeof galleryImages.$inferInsert> = {};
      if (typeof section === 'string' && section.trim()) {
        updateSet.section = section.trim();
      }
      if (typeof title === 'string' && title.trim()) {
        updateSet.title = title.trim();
      }
      if (typeof caption === 'string') {
        updateSet.caption = caption.trim();
      }
      if (imageUrl !== undefined) {
        updateSet.imageUrl = sanitizeImageUrl(imageUrl);
      }
      if (typeof isVisible === 'boolean') {
        updateSet.isVisible = isVisible;
      }

      try {
        const [updated] = await db
          .update(galleryImages)
          .set(updateSet)
          .where(eq(galleryImages.id, id))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: 'Gallery item not found.' });
        }
        res.json({ item: updated });
      } catch (error) {
        console.error('Update gallery item failed:', error);
        res.status(500).json({ error: 'Unable to update gallery item.' });
      }
    },
  );

  app.delete(
    '/api/admin/gallery/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid gallery ID.' });
      }

      try {
        const [deleted] = await db
          .delete(galleryImages)
          .where(eq(galleryImages.id, id))
          .returning();
        if (!deleted) {
          return res.status(404).json({ error: 'Gallery item not found.' });
        }
        res.json({ deletedId: deleted.id });
      } catch (error) {
        console.error('Delete gallery item failed:', error);
        res.status(500).json({ error: 'Unable to delete gallery item.' });
      }
    },
  );

  app.put(
    '/api/admin/settings',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const body = req.body || {};
      const allowedKeys = [
        'phone',
        'whatsapp',
        'email',
        'opening_hours',
        'booking_slots',
        'online_ordering_enabled',
        'instagram_url',
        'facebook_url',
      ];

      try {
        for (const key of allowedKeys) {
          if (body[key] !== undefined) {
            let val = String(body[key]);
            if (key === 'instagram_url' || key === 'facebook_url') {
              val = sanitizeExternalUrl(val);
            }
            if (key === 'booking_slots') {
              const parsed = Array.isArray(body[key])
                ? body[key]
                : JSON.parse(val);
              if (!Array.isArray(parsed)) {
                return res
                  .status(400)
                  .json({ error: 'Booking slots must be a valid list.' });
              }
              val = JSON.stringify(
                parsed
                  .map((s) => String(s).trim())
                  .filter((s) => /^\d{2}:\d{2}$/.test(s)),
              );
            }
            await upsertSetting(key, val);
          }
        }
        const updated = await getPublicSettings();
        res.json({ settings: updated });
      } catch (error) {
        console.error('Update settings failed:', error);
        res.status(500).json({ error: 'Unable to update settings.' });
      }
    },
  );

  app.get(
    '/api/admin/messages',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const messages = await getAdminContactMessages();
        res.json({ messages });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load contact messages.',
        });
      }
    },
  );

  app.patch(
    '/api/admin/messages/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      const status = String(req.body?.status || 'Reviewed');
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid message ID.' });
      }

      try {
        const [updated] = await db
          .update(contactMessages)
          .set({ status })
          .where(eq(contactMessages.id, id))
          .returning();
        if (!updated) {
          return res.status(404).json({ error: 'Message not found.' });
        }
        res.json({ message: updated });
      } catch (error) {
        console.error('Update message failed:', error);
        res.status(500).json({ error: 'Unable to update message status.' });
      }
    },
  );

  app.get(
    '/api/admin/reviews',
    requireAuth,
    requireAdmin,
    async (_req: AuthRequest, res: Response) => {
      try {
        const list = await getAdminReviews();
        res.json({ reviews: list });
      } catch (error) {
        res.status(500).json({
          error:
            error instanceof Error
              ? error.message
              : 'Unable to load guest reviews.',
        });
      }
    },
  );

  app.delete(
    '/api/admin/reviews/:id',
    requireAuth,
    requireAdmin,
    async (req: AuthRequest, res: Response) => {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ error: 'Invalid review ID.' });
      }
      try {
        const deleted = await deleteReviewRecord(id);
        if (!deleted) {
          return res.status(404).json({ error: 'Review not found.' });
        }
        res.json({ deletedId: deleted.id });
      } catch (error) {
        res.status(500).json({ error: 'Unable to delete review.' });
      }
    },
  );

  // Vite Dev Middleware or Static Production Build
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distPath, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build not found');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`HalliKatte server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
