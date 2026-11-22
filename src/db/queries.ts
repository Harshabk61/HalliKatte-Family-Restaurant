import { and, asc, desc, eq, gte, ilike, inArray, or } from 'drizzle-orm';
import { db } from './index.ts';
import {
  contactMessages,
  customers,
  galleryImages,
  menuCategories,
  menuItems,
  reservations,
  restaurantSettings,
  restaurantTables,
  reviews,
} from './schema.ts';
import { ensureSeeded } from './seed.ts';

export async function getPublicSettings(): Promise<Record<string, string>> {
  try {
    await ensureSeeded();
    const rows = await db.select().from(restaurantSettings);
    const out: Record<string, string> = {};
    for (const row of rows) {
      out[row.key] = row.value;
    }
    return out;
  } catch (error) {
    console.error('Failed to fetch settings:', error);
    throw new Error('Database query failed. Please try again later.', {
      cause: error,
    });
  }
}

export async function upsertSetting(key: string, value: string) {
  try {
    const result = await db
      .insert(restaurantSettings)
      .values({ key, value, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: restaurantSettings.key,
        set: { value, updatedAt: new Date() },
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Failed to update setting:', error);
    throw new Error('Failed to save restaurant setting.', { cause: error });
  }
}

export async function getMenuData(includeUnavailable = false) {
  try {
    await ensureSeeded();
    const categories = await db
      .select()
      .from(menuCategories)
      .where(eq(menuCategories.isActive, true))
      .orderBy(asc(menuCategories.sortOrder), asc(menuCategories.id));

    const itemsQuery = includeUnavailable
      ? db
          .select()
          .from(menuItems)
          .orderBy(asc(menuItems.sortOrder), asc(menuItems.id))
      : db
          .select()
          .from(menuItems)
          .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));

    const items = await itemsQuery;
    return { categories, items };
  } catch (error) {
    console.error('Failed to fetch menu:', error);
    throw new Error('Unable to load menu items right now.', { cause: error });
  }
}

export async function getGalleryData(includeHidden = false) {
  try {
    await ensureSeeded();
    const rows = includeHidden
      ? await db
          .select()
          .from(galleryImages)
          .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.id))
      : await db
          .select()
          .from(galleryImages)
          .where(eq(galleryImages.isVisible, true))
          .orderBy(asc(galleryImages.sortOrder), asc(galleryImages.id));
    return rows;
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    throw new Error('Unable to load photo gallery.', { cause: error });
  }
}

export async function getAvailabilityForDate(dateStr: string, guests: number) {
  try {
    await ensureSeeded();
    const settings = await getPublicSettings();
    let slots: string[] = [
      '12:00',
      '12:45',
      '13:30',
      '14:15',
      '15:00',
      '18:30',
      '19:15',
      '20:00',
      '20:45',
      '21:15',
    ];
    if (settings.booking_slots) {
      try {
        const parsed = JSON.parse(settings.booking_slots);
        if (Array.isArray(parsed) && parsed.length > 0) {
          slots = parsed.map(String);
        }
      } catch {
        // Keep default slots if malformed
      }
    }

    const activeTables = await db
      .select()
      .from(restaurantTables)
      .where(eq(restaurantTables.isActive, true))
      .orderBy(asc(restaurantTables.capacity), asc(restaurantTables.id));

    const dayReservations = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.reservationDate, dateStr),
          inArray(reservations.status, ['Pending', 'Confirmed']),
        ),
      );

    return slots.map((time) => {
      const slotBookings = dayReservations.filter(
        (r) => r.reservationTime === time,
      );
      const bookedTableIds = new Set(
        slotBookings.map((r) => r.tableId).filter((id): id is number => id !== null),
      );

      const freeTables = activeTables.filter((t) => !bookedTableIds.has(t.id));
      const fittingTable = freeTables.find((t) => t.capacity >= guests);
      const totalFreeSeats = freeTables.reduce((sum, t) => sum + t.capacity, 0);

      // Allow single fitting table, or combined capacity if party > largest single table up to totalFreeSeats
      const largestTableCap = activeTables.reduce(
        (max, t) => Math.max(max, t.capacity),
        0,
      );
      const canAccommodate =
        Boolean(fittingTable) ||
        (guests > largestTableCap && totalFreeSeats >= guests);

      return {
        time,
        available: canAccommodate,
        remainingTables: freeTables.length,
        remainingSeats: totalFreeSeats,
      };
    });
  } catch (error) {
    console.error('Failed to check table availability:', error);
    throw new Error('Unable to check table availability.', { cause: error });
  }
}

function generateBookingRef(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `HK-${suffix}`;
}

export async function createReservationRecord(input: {
  customerName: string;
  phone: string;
  email?: string | null;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  occasion?: string | null;
  specialRequests?: string | null;
}) {
  try {
    await ensureSeeded();

    const normalizedPhone = input.phone.replace(/\D/g, '').slice(-10);

    // Prevent duplicate rapid submission for same phone, date, and time
    const existingDuplicate = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.phone, normalizedPhone),
          eq(reservations.reservationDate, input.reservationDate),
          eq(reservations.reservationTime, input.reservationTime),
          inArray(reservations.status, ['Pending', 'Confirmed']),
        ),
      )
      .limit(1);

    if (existingDuplicate.length > 0) {
      const err = new Error(
        `A reservation already exists for this phone number on ${input.reservationDate} at ${input.reservationTime} (Ref: ${existingDuplicate[0].bookingRef}).`,
      );
      (err as Error & { statusCode?: number }).statusCode = 409;
      throw err;
    }

    // Find available table inside transaction
    return await db.transaction(async (tx) => {
      const activeTables = await tx
        .select()
        .from(restaurantTables)
        .where(eq(restaurantTables.isActive, true))
        .orderBy(asc(restaurantTables.capacity), asc(restaurantTables.id));

      const slotBookings = await tx
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.reservationDate, input.reservationDate),
            eq(reservations.reservationTime, input.reservationTime),
            inArray(reservations.status, ['Pending', 'Confirmed']),
          ),
        );

      const bookedTableIds = new Set(
        slotBookings
          .map((r) => r.tableId)
          .filter((id): id is number => id !== null),
      );

      const freeTables = activeTables.filter((t) => !bookedTableIds.has(t.id));
      const assignedTable = freeTables.find((t) => t.capacity >= input.guests);
      const totalFreeSeats = freeTables.reduce((sum, t) => sum + t.capacity, 0);
      const largestTableCap = activeTables.reduce(
        (max, t) => Math.max(max, t.capacity),
        0,
      );

      if (
        !assignedTable &&
        !(input.guests > largestTableCap && totalFreeSeats >= input.guests)
      ) {
        const err = new Error(
          'Sorry, all tables matching your party size are booked for that time slot. Please choose another time.',
        );
        (err as Error & { statusCode?: number }).statusCode = 409;
        throw err;
      }

      // Upsert customer
      const [customer] = await tx
        .insert(customers)
        .values({
          fullName: input.customerName.trim(),
          phone: normalizedPhone,
          email: input.email?.trim() || null,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: customers.phone,
          set: {
            fullName: input.customerName.trim(),
            email: input.email?.trim() || null,
            updatedAt: new Date(),
          },
        })
        .returning();

      const bookingRef = generateBookingRef();
      const status = assignedTable ? 'Confirmed' : 'Pending';

      const [created] = await tx
        .insert(reservations)
        .values({
          bookingRef,
          customerId: customer.id,
          tableId: assignedTable ? assignedTable.id : freeTables[0]?.id ?? null,
          customerName: input.customerName.trim(),
          phone: normalizedPhone,
          email: input.email?.trim() || null,
          reservationDate: input.reservationDate,
          reservationTime: input.reservationTime,
          guests: input.guests,
          occasion: input.occasion?.trim() || null,
          specialRequests: input.specialRequests?.trim() || null,
          status,
        })
        .returning();

      return {
        ...created,
        tableLabel: assignedTable?.label ?? 'Combined Group Seating',
        tableArea: assignedTable?.area ?? 'Main Courtyard',
      };
    });
  } catch (error) {
    if ((error as Error & { statusCode?: number }).statusCode) {
      throw error;
    }
    console.error('Failed to create reservation:', error);
    throw new Error('Could not save your reservation. Please try again.', {
      cause: error,
    });
  }
}

export async function lookupReservation(bookingRef: string, phone: string) {
  try {
    const cleanRef = bookingRef.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const rows = await db
      .select({
        reservation: reservations,
        tableLabel: restaurantTables.label,
        tableArea: restaurantTables.area,
      })
      .from(reservations)
      .leftJoin(
        restaurantTables,
        eq(reservations.tableId, restaurantTables.id),
      )
      .where(
        and(
          eq(reservations.bookingRef, cleanRef),
          eq(reservations.phone, cleanPhone),
        ),
      )
      .limit(1);

    if (rows.length === 0) return null;
    return {
      ...rows[0].reservation,
      tableLabel: rows[0].tableLabel ?? 'Main Dining Hall',
      tableArea: rows[0].tableArea ?? 'Main Courtyard',
    };
  } catch (error) {
    console.error('Failed to lookup reservation:', error);
    throw new Error('Unable to look up reservation right now.', {
      cause: error,
    });
  }
}

export async function updateCustomerReservation(
  bookingRef: string,
  phone: string,
  updates: {
    reservationDate?: string;
    reservationTime?: string;
    guests?: number;
    specialRequests?: string;
    occasion?: string;
  },
) {
  try {
    const cleanRef = bookingRef.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const existing = await lookupReservation(cleanRef, cleanPhone);
    if (!existing) return null;

    if (existing.status === 'Cancelled' || existing.status === 'Completed') {
      const err = new Error(
        `Reservations with status "${existing.status}" cannot be modified.`,
      );
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }

    const nextDate = updates.reservationDate ?? existing.reservationDate;
    const nextTime = updates.reservationTime ?? existing.reservationTime;
    const nextGuests = updates.guests ?? existing.guests;

    // Verify table availability if date, time, or guests changed
    let nextTableId = existing.tableId;
    if (
      nextDate !== existing.reservationDate ||
      nextTime !== existing.reservationTime ||
      nextGuests !== existing.guests
    ) {
      const activeTables = await db
        .select()
        .from(restaurantTables)
        .where(eq(restaurantTables.isActive, true))
        .orderBy(asc(restaurantTables.capacity));

      const slotBookings = await db
        .select()
        .from(reservations)
        .where(
          and(
            eq(reservations.reservationDate, nextDate),
            eq(reservations.reservationTime, nextTime),
            inArray(reservations.status, ['Pending', 'Confirmed']),
          ),
        );

      const bookedTableIds = new Set(
        slotBookings
          .filter((r) => r.id !== existing.id)
          .map((r) => r.tableId)
          .filter((id): id is number => id !== null),
      );

      const freeTables = activeTables.filter((t) => !bookedTableIds.has(t.id));
      const fittingTable = freeTables.find((t) => t.capacity >= nextGuests);
      if (!fittingTable) {
        const err = new Error(
          'No tables available for the updated date, time, or guest count.',
        );
        (err as Error & { statusCode?: number }).statusCode = 409;
        throw err;
      }
      nextTableId = fittingTable.id;
    }

    const [updated] = await db
      .update(reservations)
      .set({
        reservationDate: nextDate,
        reservationTime: nextTime,
        guests: nextGuests,
        tableId: nextTableId,
        occasion:
          updates.occasion !== undefined ? updates.occasion : existing.occasion,
        specialRequests:
          updates.specialRequests !== undefined
            ? updates.specialRequests
            : existing.specialRequests,
        updatedAt: new Date(),
      })
      .where(eq(reservations.id, existing.id))
      .returning();

    return updated;
  } catch (error) {
    if ((error as Error & { statusCode?: number }).statusCode) {
      throw error;
    }
    console.error('Failed to update reservation:', error);
    throw new Error('Unable to update reservation.', { cause: error });
  }
}

export async function cancelCustomerReservation(
  bookingRef: string,
  phone: string,
) {
  try {
    const cleanRef = bookingRef.trim().toUpperCase();
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    const existing = await lookupReservation(cleanRef, cleanPhone);
    if (!existing) return null;

    if (existing.status === 'Completed') {
      const err = new Error('Completed reservations cannot be cancelled.');
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }

    const [updated] = await db
      .update(reservations)
      .set({ status: 'Cancelled', updatedAt: new Date() })
      .where(eq(reservations.id, existing.id))
      .returning();

    return updated;
  } catch (error) {
    if ((error as Error & { statusCode?: number }).statusCode) {
      throw error;
    }
    console.error('Failed to cancel reservation:', error);
    throw new Error('Unable to cancel reservation.', { cause: error });
  }
}

export async function createContactMessage(input: {
  name: string;
  phone: string;
  email?: string | null;
  message: string;
}) {
  try {
    const [created] = await db
      .insert(contactMessages)
      .values({
        name: input.name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() || null,
        message: input.message.trim(),
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Failed to save contact message:', error);
    throw new Error('Unable to send message right now.', { cause: error });
  }
}

// Admin Queries
export async function getAdminReservations(filters: {
  date?: string;
  status?: string;
  search?: string;
}) {
  try {
    await ensureSeeded();
    const conditions = [];

    if (filters.date) {
      conditions.push(eq(reservations.reservationDate, filters.date));
    }
    if (filters.status && filters.status !== 'All') {
      conditions.push(eq(reservations.status, filters.status));
    }
    if (filters.search?.trim()) {
      const q = `%${filters.search.trim()}%`;
      conditions.push(
        or(
          ilike(reservations.bookingRef, q),
          ilike(reservations.customerName, q),
          ilike(reservations.phone, q),
        ),
      );
    }

    const rows = await db
      .select({
        reservation: reservations,
        tableLabel: restaurantTables.label,
        tableArea: restaurantTables.area,
      })
      .from(reservations)
      .leftJoin(
        restaurantTables,
        eq(reservations.tableId, restaurantTables.id),
      )
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(
        desc(reservations.reservationDate),
        asc(reservations.reservationTime),
        desc(reservations.createdAt),
      );

    return rows.map((r) => ({
      ...r.reservation,
      tableLabel: r.tableLabel ?? 'Unassigned',
      tableArea: r.tableArea ?? 'Main Courtyard',
    }));
  } catch (error) {
    console.error('Failed to fetch admin reservations:', error);
    throw new Error('Unable to fetch reservations.', { cause: error });
  }
}

export async function getAdminCustomers() {
  try {
    await ensureSeeded();
    return await db
      .select()
      .from(customers)
      .orderBy(desc(customers.updatedAt));
  } catch (error) {
    console.error('Failed to fetch customers:', error);
    throw new Error('Unable to fetch customers.', { cause: error });
  }
}

export async function getAdminTables() {
  try {
    await ensureSeeded();
    return await db
      .select()
      .from(restaurantTables)
      .orderBy(asc(restaurantTables.id));
  } catch (error) {
    console.error('Failed to fetch tables:', error);
    throw new Error('Unable to fetch dining tables.', { cause: error });
  }
}

export async function getAdminContactMessages() {
  try {
    await ensureSeeded();
    return await db
      .select()
      .from(contactMessages)
      .orderBy(desc(contactMessages.createdAt));
  } catch (error) {
    console.error('Failed to fetch contact messages:', error);
    throw new Error('Unable to fetch contact messages.', { cause: error });
  }
}

export async function getAdminUpcomingCount(todayStr: string) {
  try {
    const rows = await db
      .select()
      .from(reservations)
      .where(
        and(
          gte(reservations.reservationDate, todayStr),
          inArray(reservations.status, ['Pending', 'Confirmed']),
        ),
      );
    return rows.length;
  } catch (error) {
    console.error('Failed to count upcoming reservations:', error);
    return 0;
  }
}

export async function getApprovedReviews() {
  try {
    await ensureSeeded();
    return await db
      .select()
      .from(reviews)
      .where(eq(reviews.isApproved, true))
      .orderBy(desc(reviews.createdAt), desc(reviews.id));
  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    throw new Error('Unable to load guest reviews right now.', { cause: error });
  }
}

export async function createReviewRecord(input: {
  reviewerName: string;
  rating: number;
  visitType?: string | null;
  favoriteDish?: string | null;
  comment: string;
  photoUrl?: string | null;
}) {
  try {
    const [created] = await db
      .insert(reviews)
      .values({
        reviewerName: input.reviewerName.trim(),
        rating: input.rating,
        visitType: input.visitType?.trim() || null,
        favoriteDish: input.favoriteDish?.trim() || null,
        comment: input.comment.trim(),
        photoUrl: input.photoUrl || null,
        isApproved: true,
      })
      .returning();
    return created;
  } catch (error) {
    console.error('Failed to save review:', error);
    throw new Error('Unable to submit your review right now.', { cause: error });
  }
}

export async function getAdminReviews() {
  try {
    await ensureSeeded();
    return await db
      .select()
      .from(reviews)
      .orderBy(desc(reviews.createdAt), desc(reviews.id));
  } catch (error) {
    console.error('Failed to fetch admin reviews:', error);
    throw new Error('Unable to fetch guest reviews.', { cause: error });
  }
}

export async function deleteReviewRecord(id: number) {
  try {
    const [deleted] = await db
      .delete(reviews)
      .where(eq(reviews.id, id))
      .returning();
    return deleted ?? null;
  } catch (error) {
    console.error('Failed to delete review:', error);
    throw new Error('Unable to delete review.', { cause: error });
  }
}

