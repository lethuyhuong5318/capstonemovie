import type { PaymentMethod } from '@/types';
import { cybersoftApi, CYBERSOFT_MA_NHOM } from '@/lib/cybersoftApi';

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

interface RawUser {
  taiKhoan: string;
  hoTen: string;
  email: string;
}

interface RawBookedSeat {
  tenGhe?: string;
  tenRap?: string;
  tenCumRap?: string;
  tenHeThongRap?: string;
}

interface RawBookedTicket {
  maVe: number;
  tenPhim?: string;
  ngayDat?: string;
  giaVe?: number;
  danhSachGhe?: RawBookedSeat[];
}

interface RawAccount extends RawUser {
  thongTinDatVe?: RawBookedTicket[];
}

function getStoredBookings(): AdminBookingRecord[] {
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

function seatCode(value: string | undefined) {
  const raw = String(value ?? '').trim();
  if (/^[A-Z]+\d+$/i.test(raw)) return raw.toUpperCase();
  const number = Number(raw);
  if (!Number.isFinite(number) || number < 1) return raw;
  return `${String.fromCharCode(65 + Math.floor((number - 1) / 10))}${((number - 1) % 10) + 1}`;
}

function mapAccountBookings(account: RawAccount): AdminBookingRecord[] {
  return (account.thongTinDatVe ?? []).map((ticket) => {
    const seats = ticket.danhSachGhe ?? [];
    const firstSeat = seats[0];
    const bookedAt = ticket.ngayDat ? new Date(ticket.ngayDat) : new Date(0);
    const createdAt = Number.isNaN(bookedAt.getTime()) ? '' : bookedAt.toISOString();
    return {
      id: `api-${ticket.maVe}`,
      transactionCode: String(ticket.maVe),
      customerUsername: account.taiKhoan,
      customerName: account.hoTen || account.taiKhoan,
      movieName: ticket.tenPhim ?? '',
      cinemaName: firstSeat?.tenHeThongRap ?? '',
      roomName: firstSeat?.tenRap ?? firstSeat?.tenCumRap ?? '',
      showtimeId: 0,
      showtimeDate: createdAt.slice(0, 10),
      showtimeTime: createdAt.slice(11, 16),
      seatCodes: seats.map((seat) => seatCode(seat.tenGhe)),
      total: Number(ticket.giaVe ?? 0) * Math.max(seats.length, 1),
      paymentMethod: 'CARD',
      status: 'PAID',
      createdAt,
    };
  });
}

async function fetchAccount(username: string) {
  const response = await cybersoftApi.post<{ content: RawAccount }>(
    'QuanLyNguoiDung/LayThongTinNguoiDung',
    null,
    { params: { taiKhoan: username } },
  );
  return response.data.content;
}

export async function fetchAdminBookings(): Promise<AdminBookingRecord[]> {
  const stored = getStoredBookings();
  try {
    const userResponse = await cybersoftApi.get<{ content: RawUser[] }>(
      'QuanLyNguoiDung/LayDanhSachNguoiDung',
      { params: { MaNhom: CYBERSOFT_MA_NHOM } },
    );
    const storedUsers: RawUser[] = stored.map((booking) => ({
      taiKhoan: booking.customerUsername,
      hoTen: booking.customerName,
      email: '',
    }));
    const userMap = new Map(
      [...(userResponse.data.content ?? []), ...storedUsers]
        .filter((user) => user.taiKhoan && user.taiKhoan !== 'guest')
        .map((user) => [user.taiKhoan, user]),
    );
    const users = Array.from(userMap.values());
    const accounts: RawAccount[] = [];
    for (let index = 0; index < users.length; index += 6) {
      const batch = users.slice(index, index + 6);
      const results = await Promise.allSettled(
        batch.map((user) => fetchAccount(user.taiKhoan)),
      );
      results.forEach((result, resultIndex) => {
        if (result.status === 'fulfilled' && result.value) {
          accounts.push(result.value);
        } else if (storedUsers.some((user) => user.taiKhoan === batch[resultIndex].taiKhoan)) {
          throw result.status === 'rejected' ? result.reason : new Error('Không thể tải lịch sử đặt vé.');
        }
      });
    }
    const merged = [...accounts.flatMap(mapAccountBookings), ...stored];
    const unique = new Map(merged.map((booking) => [booking.id, booking]));
    return Array.from(unique.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return stored;
  }
}

export function saveAdminBooking(record: AdminBookingRecord) {
  if (typeof localStorage === 'undefined') return;
  const current = getStoredBookings();
  const next = [record, ...current.filter((item) => item.transactionCode !== record.transactionCode)];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 500)));
}
