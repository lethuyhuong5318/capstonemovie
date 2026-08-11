import { cybersoftApi, CYBERSOFT_MA_NHOM } from '@/lib/cybersoftApi';

/** ---- Raw API shapes (QuanLyRap) ---- */
interface RawCumRap {
  maCumRap: string;
  tenCumRap: string;
  diaChi: string;
  danhSachRap?: Array<{ maRap: string; tenRap: string }>;
}

interface RawHeThongRap {
  maHeThongRap: string;
  tenHeThongRap: string;
  biDanh: string;
  logo: string;
}

interface RawLichChieuPhim {
  maLichChieu: string | number;
  maRap: string;
  tenRap: string;
  ngayChieuGioChieu: string;
  giaVe: number;
}

interface RawCumRapChieu {
  maCumRap: string;
  tenCumRap: string;
  diaChi: string;
  lichChieuPhim: RawLichChieuPhim[];
}

interface RawHeThongRapChieu {
  maHeThongRap: string;
  tenHeThongRap: string;
  logo: string;
  cumRapChieu: RawCumRapChieu[];
}

/** ---- App-facing models ---- */
export interface CinemaSystemBrand {
  code: string;
  name: string;
  logo: string;
}

export interface CinemaCluster {
  code: string;
  name: string;
  address: string;
  rooms?: Array<{ id: string; name: string }>;
}

export interface ShowtimeEntry {
  id: number;
  /** Full ISO timestamp from the API, e.g. `2025-09-04T16:30:00`. */
  startsAt: string;
  date: string;
  time: string;
  price: number;
  roomName: string;
}

export interface ClusterShowtimes extends CinemaCluster {
  showtimes: ShowtimeEntry[];
}

export interface SystemShowtimes extends CinemaSystemBrand {
  clusters: ClusterShowtimes[];
}

function splitDateTime(iso: string) {
  const [datePart, timePart = ''] = iso.split('T');
  return { date: datePart, time: timePart.slice(0, 5) };
}

function toShowtime(raw: RawLichChieuPhim): ShowtimeEntry {
  const { date, time } = splitDateTime(raw.ngayChieuGioChieu);
  return {
    id: Number(raw.maLichChieu),
    startsAt: raw.ngayChieuGioChieu,
    date,
    time,
    price: raw.giaVe,
    roomName: raw.tenRap,
  };
}

export async function fetchCinemaBrands(): Promise<CinemaSystemBrand[]> {
  const res = await cybersoftApi.get<{ content: RawHeThongRap[] }>(
    'QuanLyRap/LayThongTinHeThongRap',
  );
  return res.data.content.map((h) => ({
    code: h.maHeThongRap,
    name: h.tenHeThongRap,
    logo: h.logo,
  }));
}

export async function fetchClustersBySystem(systemCode: string): Promise<CinemaCluster[]> {
  const res = await cybersoftApi.get<{ content: RawCumRap[] }>(
    'QuanLyRap/LayThongTinCumRapTheoHeThong',
    { params: { maHeThongRap: systemCode } },
  );
  return res.data.content.map((c) => ({
    code: c.maCumRap,
    name: c.tenCumRap,
    address: c.diaChi,
    rooms: (c.danhSachRap ?? []).map((room) => ({ id: room.maRap, name: room.tenRap })),
  }));
}

/** Showtimes for one movie, grouped brand → cluster → showtime. */
export async function fetchShowtimesForMovie(movieId: number): Promise<SystemShowtimes[]> {
  const res = await cybersoftApi.get<{ content: { heThongRapChieu?: RawHeThongRapChieu[] } }>(
    'QuanLyRap/LayThongTinLichChieuPhim',
    { params: { MaPhim: movieId } },
  );
  const systems = res.data.content?.heThongRapChieu ?? [];
  return systems.map((s) => ({
    code: s.maHeThongRap,
    name: s.tenHeThongRap,
    logo: s.logo,
    clusters: (s.cumRapChieu ?? []).map((c) => ({
      code: c.maCumRap,
      name: c.tenCumRap,
      address: c.diaChi,
      showtimes: (c.lichChieuPhim ?? [])
        .map(toShowtime)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    })),
  }));
}

/** Whole-system schedule (all movies), used by the cinema browse page. */
export interface ClusterMovieSchedule {
  movieId: number;
  movieName: string;
  posterUrl: string;
  showtimes: ShowtimeEntry[];
}

interface RawDanhSachPhim {
  maPhim: number;
  tenPhim: string;
  hinhAnh: string;
  lstLichChieuTheoPhim: RawLichChieuPhim[];
}

interface RawCumRapFull {
  maCumRap: string;
  tenCumRap: string;
  diaChi: string;
  danhSachPhim: RawDanhSachPhim[];
}

interface RawSystemFull {
  maHeThongRap: string;
  tenHeThongRap: string;
  logo: string;
  lstCumRap: RawCumRapFull[];
}

export interface SystemFullSchedule extends CinemaSystemBrand {
  clusters: Array<CinemaCluster & { movies: ClusterMovieSchedule[] }>;
}

export async function fetchFullSchedule(): Promise<SystemFullSchedule[]> {
  const res = await cybersoftApi.get<{ content: RawSystemFull[] }>(
    'QuanLyRap/LayThongTinLichChieuHeThongRap',
    { params: { maNhom: CYBERSOFT_MA_NHOM } },
  );
  return res.data.content.map((s) => ({
    code: s.maHeThongRap,
    name: s.tenHeThongRap,
    logo: s.logo,
    clusters: (s.lstCumRap ?? []).map((c) => ({
      code: c.maCumRap,
      name: c.tenCumRap,
      address: c.diaChi,
      rooms: [],
      movies: (c.danhSachPhim ?? []).map((m) => ({
        movieId: m.maPhim,
        movieName: m.tenPhim,
        posterUrl: m.hinhAnh,
        showtimes: (m.lstLichChieuTheoPhim ?? [])
          .map(toShowtime)
          .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
      })),
    })),
  }));
}
