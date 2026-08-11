import type { PaymentMethod } from '@/types';

const STORAGE_KEY = 'cinewave-admin-bookings';

export interface AdminBookingRecord {
  id: string;
  transactionCode: string;
  customerUsername: string;
  customerName: string;
  movieName: string;
  cinemaName: string;
  roomName: string;
  showtimeId: number;
  showtimeDate: string;
  showtimeTime: string;
  seatCodes: string[];
  total: number;
  paymentMethod: PaymentMethod;
  status: 'PAID';
  createdAt: string;
}

export function fetchAdminBookings(): AdminBookingRecord[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return Array.isArray(parsed)
      ? (parsed as AdminBookingRecord[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      : [];
  } catch {
    return [];
  }
}

export function saveAdminBooking(record: AdminBookingRecord) {
  if (typeof localStorage === 'undefined') return;
  const current = fetchAdminBookings();
  const next = [record, ...current.filter((item) => item.transactionCode !== record.transactionCode)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 500)));
}
