import { relations } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// Authenticated staff/admin users linked to Firebase Auth UID
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  displayName: text('display_name'),
  role: text('role').notNull().default('customer'), // 'admin' | 'staff' | 'customer'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Allowlisted admin accounts (by email) for role-based dashboard access
export const adminUsers = pgTable('admin_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  role: text('role').notNull().default('admin'), // 'admin' | 'staff'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Restaurant guests / customers
export const customers = pgTable(
  'customers',
  {
    id: serial('id').primaryKey(),
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull().unique(),
    email: text('email'),
    notes: text('notes'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('customers_phone_idx').on(table.phone)],
);

// Physical tables / seating zones in HalliKatte
export const restaurantTables = pgTable('restaurant_tables', {
  id: serial('id').primaryKey(),
  tableNumber: text('table_number').notNull().unique(),
  label: text('label').notNull(),
  capacity: integer('capacity').notNull(),
  area: text('area').notNull().default('Main Courtyard'),
  isActive: boolean('is_active').notNull().default(true),
});

// Table reservations
export const reservations = pgTable(
  'reservations',
  {
    id: serial('id').primaryKey(),
    bookingRef: text('booking_ref').notNull().unique(),
    customerId: integer('customer_id')
      .references(() => customers.id)
      .notNull(),
    tableId: integer('table_id').references(() => restaurantTables.id),
    customerName: text('customer_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    reservationDate: text('reservation_date').notNull(), // YYYY-MM-DD
    reservationTime: text('reservation_time').notNull(), // HH:mm
    guests: integer('guests').notNull(),
    occasion: text('occasion'),
    specialRequests: text('special_requests'),
    status: text('status').notNull().default('Confirmed'), // 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('reservations_date_time_idx').on(
      table.reservationDate,
      table.reservationTime,
    ),
    index('reservations_ref_phone_idx').on(table.bookingRef, table.phone),
  ],
);

// Menu categories
export const menuCategories = pgTable('menu_categories', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
});

// Menu items
export const menuItems = pgTable(
  'menu_items',
  {
    id: serial('id').primaryKey(),
    categoryId: integer('category_id')
      .references(() => menuCategories.id)
      .notNull(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    priceInr: integer('price_inr'), // Nullable until owner confirms verified pricing
    isVeg: boolean('is_veg').notNull().default(true),
    isAvailable: boolean('is_available').notNull().default(true),
    imageUrl: text('image_url'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [index('menu_items_category_idx').on(table.categoryId)],
);

// Gallery images
export const galleryImages = pgTable('gallery_images', {
  id: serial('id').primaryKey(),
  section: text('section').notNull(), // 'Our Food' | 'Restaurant Ambience' | 'Family Dining' | 'Special Moments' | 'Kitchen & Preparation'
  title: text('title').notNull(),
  caption: text('caption').notNull(),
  imageUrl: text('image_url'), // Nullable placeholder until owner uploads actual photo
  sortOrder: integer('sort_order').notNull().default(0),
  isVisible: boolean('is_visible').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Configurable restaurant settings (hours, slots, phone, WhatsApp, etc.)
export const restaurantSettings = pgTable('restaurant_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Customer contact messages
export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  message: text('message').notNull(),
  status: text('status').notNull().default('New'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Guest reviews submitted directly on the website
export const reviews = pgTable('reviews', {
  id: serial('id').primaryKey(),
  reviewerName: text('reviewer_name').notNull(),
  rating: integer('rating').notNull(), // 1 to 5
  visitType: text('visit_type'),
  favoriteDish: text('favorite_dish'),
  comment: text('comment').notNull(),
  photoUrl: text('photo_url'),
  isApproved: boolean('is_approved').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const customersRelations = relations(customers, ({ many }) => ({
  reservations: many(reservations),
}));

export const restaurantTablesRelations = relations(
  restaurantTables,
  ({ many }) => ({
    reservations: many(reservations),
  }),
);

export const reservationsRelations = relations(reservations, ({ one }) => ({
  customer: one(customers, {
    fields: [reservations.customerId],
    references: [customers.id],
  }),
  table: one(restaurantTables, {
    fields: [reservations.tableId],
    references: [restaurantTables.id],
  }),
}));

export const menuCategoriesRelations = relations(
  menuCategories,
  ({ many }) => ({
    items: many(menuItems),
  }),
);

export const menuItemsRelations = relations(menuItems, ({ one }) => ({
  category: one(menuCategories, {
    fields: [menuItems.categoryId],
    references: [menuCategories.id],
  }),
}));
