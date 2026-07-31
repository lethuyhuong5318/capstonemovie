import { bookings, nextBookingId, nextBookingCode } from '@/mocks/bookings';
import { markSeatsBooked, getSeatsForShowtime } from '@/mocks/seats';
import { findShowtime } from '@/mocks/showtimes';
import { movies } from '@/mocks/movies';
import { cinemaSystems } from '@/mocks/cinemas';
import { findCombo } from '@/mocks/concessions';
import { getCachedLiveMovie } from '@/services/movieApiService';
import { delay } from '@/services/delay';
import type { Booking, BookingCombo, PaymentMethod } from '@/types';

export interface ConfirmBookingCombo {
  comboId: number;
  quantity: number;
}

export interface ConfirmBookingPayload {
  userId: number;
  showtimeId: number;
  seatCodes: string[];
  combos?: ConfirmBookingCombo[];
  paymentMethod: PaymentMethod;
  transactionCode: string;
}

export class SeatConflictError extends Error {}

function nextFnbCode() {
  return `FNB-${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function confirmBooking(payload: ConfirmBookingPayload) {
  const seats = getSeatsForShowtime(payload.showtimeId);
  const alreadyBooked = seats.some(
    (s) => payload.seatCodes.includes(s.code) && s.status === 'BOOKED',
  );
  if (alreadyBooked) {
    throw new SeatConflictError('Một số ghế vừa được người khác đặt. Vui lòng chọn lại.');
  }

  const showtime = findShowtime(payload.showtimeId);
  const seatTotal = seats
    .filter((s) => payload.seatCodes.includes(s.code))
    .reduce((sum, s) => sum + s.price, 0);

  const bookingCombos: BookingCombo[] = (payload.combos ?? [])
    .filter((c) => c.quantity > 0)
    .map((c) => {
      const combo = findCombo(c.comboId);
      return {
        comboId: c.comboId,
        name: combo?.name ?? '',
        quantity: c.quantity,
        unitPrice: combo?.price ?? 0,
      };
    });
  const comboTotal = bookingCombos.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);

  markSeatsBooked(payload.showtimeId, payload.seatCodes);

  const hasCombos = bookingCombos.length > 0;
  const record: Booking = {
    id: nextBookingId(),
    code: nextBookingCode(),
    userId: payload.userId,
    showtimeId: payload.showtimeId,
    seatCodes: payload.seatCodes,
    seatTotal: seatTotal || showtime?.price || 0,
    combos: bookingCombos,
    comboTotal,
    total: (seatTotal || showtime?.price || 0) + comboTotal,
    status: 'UPCOMING',
    createdAt: new Date().toISOString(),
    fnbCode: hasCombos ? nextFnbCode() : undefined,
    fnbStatus: hasCombos ? 'NOT_REDEEMED' : undefined,
    paymentMethod: payload.paymentMethod,
    paymentStatus: 'PAID',
    transactionCode: payload.transactionCode,
  };
  bookings.push(record);
  return delay(record, 500);
}

function enrichBooking(b: Booking) {
  const showtime = findShowtime(b.showtimeId);
  const movie = showtime
    ? (movies.find((m) => m.id === showtime.movieId) ?? getCachedLiveMovie(showtime.movieId))
    : undefined;
  const system = showtime ? cinemaSystems.find((s) => s.id === showtime.cinemaSystemId) : undefined;
  const cinema = system?.cinemas.find((c) => c.id === showtime?.cinemaId);

  let status = b.status;
  if (status === 'UPCOMING' && showtime) {
    const dt = new Date(`${showtime.date}T${showtime.time}:00`);
    if (dt.getTime() < Date.now()) status = 'WATCHED';
  }

  return {
    ...b,
    status,
    showtime,
    movieName: movie?.name ?? '',
    cinemaName: cinema?.name ?? '',
    cinemaSystemName: system?.name ?? '',
  };
}

export async function fetchMyBookings(userId: number) {
  const mine = bookings
    .filter((b) => b.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map(enrichBooking);
  return delay(mine);
}

export async function fetchBookingById(id: number) {
  const booking = bookings.find((b) => b.id === id);
  return delay(booking ? enrichBooking(booking) : undefined);
}

export async function redeemBookingFnb(id: number) {
  const booking = bookings.find((b) => b.id === id);
  if (booking && booking.fnbStatus === 'NOT_REDEEMED') {
    booking.fnbStatus = 'REDEEMED';
  }
  return delay(booking ? enrichBooking(booking) : undefined);
}
