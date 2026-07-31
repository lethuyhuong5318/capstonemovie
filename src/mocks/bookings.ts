import type { Booking } from '@/types';

export const bookings: Booking[] = [];

let bookingIdCounter = 1000;
export function nextBookingCode() {
  bookingIdCounter++;
  return `CW${bookingIdCounter}`;
}

let bookingIdSeq = 1;
export function nextBookingId() {
  return bookingIdSeq++;
}
