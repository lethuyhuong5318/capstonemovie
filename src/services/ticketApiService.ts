import { cybersoftApi, cybersoftErrorMessage } from '@/lib/cybersoftApi';

interface RawGhe {
  maGhe: number;
  tenGhe: string;
  maRap: number;
  loaiGhe: 'Thuong' | 'Vip' | string;
  stt: string;
  giaVe: number;
  daDat: boolean;
  taiKhoanNguoiDat: string | null;
}

interface RawThongTinPhim {
  maLichChieu: number;
  tenCumRap: string;
  tenRap: string;
  diaChi: string;
  tenPhim: string;
  hinhAnh: string;
  ngayChieu: string;
  gioChieu: string;
}

export interface TicketSeat {
  id: number;
  code: string;
  /** `VIP` seats cost more; the API already returns the correct `price`. */
  type: 'STANDARD' | 'VIP';
  price: number;
  booked: boolean;
  /** True when the currently signed-in account owns this booked seat. */
  bookedByMe: boolean;
}

export interface TicketRoom {
  showtimeId: number;
  movieName: string;
  posterUrl: string;
  cinemaName: string;
  roomName: string;
  address: string;
  date: string;
  time: string;
  seats: TicketSeat[];
}

export async function fetchTicketRoom(
  showtimeId: number,
  currentAccount?: string,
): Promise<TicketRoom> {
  const res = await cybersoftApi.get<{
    content: { thongTinPhim: RawThongTinPhim; danhSachGhe: RawGhe[] };
  }>('QuanLyDatVe/LayDanhSachPhongVe', { params: { MaLichChieu: showtimeId } });

  const { thongTinPhim: info, danhSachGhe: seats } = res.data.content;
  return {
    showtimeId: info.maLichChieu,
    movieName: info.tenPhim,
    posterUrl: info.hinhAnh,
    cinemaName: info.tenCumRap,
    roomName: info.tenRap,
    address: info.diaChi,
    date: info.ngayChieu,
    time: info.gioChieu,
    seats: seats.map((s) => ({
      id: s.maGhe,
      code: s.tenGhe,
      type: s.loaiGhe === 'Vip' ? 'VIP' : 'STANDARD',
      price: s.giaVe,
      booked: s.daDat,
      bookedByMe: !!currentAccount && s.taiKhoanNguoiDat === currentAccount,
    })),
  };
}

export class SeatConflictError extends Error {}

export interface BookTicketPayload {
  showtimeId: number;
  seats: Array<{ id: number; price: number }>;
}

/** Requires a signed-in CyberSoft account (Bearer token) — verified against the live API. */
export async function bookTickets(payload: BookTicketPayload): Promise<void> {
  try {
    await cybersoftApi.post('QuanLyDatVe/DatVe', {
      maLichChieu: payload.showtimeId,
      danhSachVe: payload.seats.map((s) => ({ maGhe: s.id, giaVe: s.price })),
    });
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    const message = cybersoftErrorMessage(error, 'Đặt vé thất bại. Vui lòng thử lại.');
    if (status === 409 || /đã (được )?đặt/i.test(message)) {
      throw new SeatConflictError('Rất tiếc, ghế bạn chọn vừa có người đặt. Vui lòng chọn ghế khác.');
    }
    throw new Error(message);
  }
}

/** ---- Booking history (ThongTinTaiKhoan) ---- */
interface RawVeDaDat {
  maVe: number;
  tenPhim: string;
  hinhAnh: string;
  ngayDat: string;
  thoiLuongPhim: number;
  giaVe: number;
  danhSachGhe: Array<{ maHeThongRap: string; tenHeThongRap: string; tenCumRap: string; maRap: number; tenRap: string; tenGhe: string }>;
}

export interface BookedTicket {
  id: number;
  movieName: string;
  posterUrl: string;
  bookedAt: string;
  durationMinutes: number;
  price: number;
  cinemaName: string;
  roomName: string;
  seatCodes: string[];
  total: number;
}

export async function fetchMyTickets(): Promise<BookedTicket[]> {
  const res = await cybersoftApi.post<{ content: { thongTinDatVe?: RawVeDaDat[] } }>(
    'QuanLyNguoiDung/ThongTinTaiKhoan',
    {},
  );
  const list = res.data.content?.thongTinDatVe ?? [];
  return list.map((v) => ({
    id: v.maVe,
    movieName: v.tenPhim,
    posterUrl: v.hinhAnh,
    bookedAt: v.ngayDat,
    durationMinutes: v.thoiLuongPhim,
    price: v.giaVe,
    // The API's naming is shifted here: `tenHeThongRap` actually carries the
    // cluster name ("MegaGS - Cao Thắng") while `tenCumRap` carries the room.
    cinemaName: v.danhSachGhe[0]?.tenHeThongRap ?? '',
    roomName: v.danhSachGhe[0]?.tenRap ?? '',
    seatCodes: v.danhSachGhe.map((g) => g.tenGhe),
    total: v.giaVe * Math.max(v.danhSachGhe.length, 1),
  }));
}
