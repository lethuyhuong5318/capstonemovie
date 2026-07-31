import type { Seat, SeatType, ShowtimeStatus } from '@/types';
import { findCinema } from '@/mocks/cinemas';
import { findShowtime, isShowtimeExpired } from '@/mocks/showtimes';

const seatStore = new Map<number, Seat[]>();

function typeForRow(rowIndex: number, totalRows: number): SeatType {
  if (rowIndex === totalRows - 1) return 'COUPLE';
  if (rowIndex >= totalRows - 3) return 'VIP';
  return 'STANDARD';
}

function priceForType(base: number, type: SeatType) {
  if (type === 'VIP') return base + 30000;
  if (type === 'COUPLE') return base + 60000;
  return base;
}

function generateSeats(showtimeId: number): Seat[] {
  const showtime = findShowtime(showtimeId);
  if (!showtime) return [];
  const cinema = findCinema(showtime.cinemaId);
  const room = cinema?.rooms.find((r) => r.id === showtime.roomId);
  if (!room) return [];

  const seats: Seat[] = [];
  let counter = 1;
  for (let r = 0; r < room.rows; r++) {
    const rowLabel = String.fromCharCode(65 + r);
    const type = typeForRow(r, room.rows);
    for (let c = 1; c <= room.cols; c++) {
      const rand = Math.random();
      seats.push({
        id: counter,
        showtimeId,
        seatId: counter,
        code: `${rowLabel}${c}`,
        type,
        price: priceForType(showtime.price, type),
        status: rand < 0.18 ? 'BOOKED' : 'AVAILABLE',
      });
      counter++;
    }
  }
  return seats;
}

export function getSeatsForShowtime(showtimeId: number): Seat[] {
  if (!seatStore.has(showtimeId)) {
    seatStore.set(showtimeId, generateSeats(showtimeId));
  }
  return seatStore.get(showtimeId)!;
}

export function markSeatsBooked(showtimeId: number, codes: string[]) {
  const seats = getSeatsForShowtime(showtimeId);
  for (const seat of seats) {
    if (codes.includes(seat.code)) seat.status = 'BOOKED';
  }
}

export function computeShowtimeStatus(showtimeId: number): ShowtimeStatus {
  const showtime = findShowtime(showtimeId);
  if (!showtime) return 'SOLD_OUT';
  if (isShowtimeExpired(showtime)) return 'EXPIRED';

  const seats = getSeatsForShowtime(showtimeId);
  const total = seats.length;
  const booked = seats.filter((s) => s.status === 'BOOKED').length;
  const ratio = total ? booked / total : 0;
  if (ratio >= 1) return 'SOLD_OUT';
  if (ratio >= 0.75) return 'ALMOST_FULL';
  return 'AVAILABLE';
}
