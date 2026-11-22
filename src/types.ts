export interface MenuCategory {
  id: number;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}

export interface MenuItem {
  id: number;
  categoryId: number;
  name: string;
  description: string;
  priceInr: number | null;
  isVeg: boolean;
  isAvailable: boolean;
  imageUrl: string | null;
  sortOrder: number;
}

export interface CartItem {
  item: MenuItem;
  quantity: number;
}

export interface AvailabilitySlot {
  time: string;
  available: boolean;
  remainingTables: number;
  remainingSeats: number;
}

export interface ReservationRecord {
  id: number;
  bookingRef: string;
  customerId: number;
  tableId: number | null;
  customerName: string;
  phone: string;
  email: string | null;
  reservationDate: string;
  reservationTime: string;
  guests: number;
  occasion: string | null;
  specialRequests: string | null;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | string;
  tableLabel?: string;
  tableArea?: string;
  createdAt: string;
}

export interface GalleryImageRecord {
  id: number;
  section: string;
  title: string;
  caption: string;
  imageUrl: string | null;
  sortOrder: number;
  isVisible: boolean;
}

export interface RestaurantTableRecord {
  id: number;
  tableNumber: string;
  label: string;
  capacity: number;
  area: string;
  isActive: boolean;
}

export interface CustomerRecord {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  notes: string | null;
  createdAt: string;
}

export interface ContactMessageRecord {
  id: number;
  name: string;
  phone: string;
  email: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export interface ReviewRecord {
  id: number;
  reviewerName: string;
  rating: number;
  visitType: string | null;
  favoriteDish: string | null;
  comment: string;
  photoUrl: string | null;
  isApproved: boolean;
  createdAt: string;
}

export interface RestaurantSettings {
  phone?: string;
  whatsapp?: string;
  email?: string;
  opening_hours?: string;
  booking_slots?: string;
  online_ordering_enabled?: string;
  instagram_url?: string;
  facebook_url?: string;
  [key: string]: string | undefined;
}
