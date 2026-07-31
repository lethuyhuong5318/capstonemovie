import { cybersoftApi, CYBERSOFT_MA_NHOM } from '@/lib/cybersoftApi';
import type { AgeRating, Movie } from '@/types';

interface CyberSoftMovie {
  maPhim: number;
  tenPhim: string;
  biDanh: string;
  trailer: string;
  hinhAnh: string;
  moTa: string;
  ngayKhoiChieu: string;
  danhGia: number;
  hot: boolean;
  dangChieu: boolean;
  sapChieu: boolean;
}

function toEmbedUrl(url: string): string {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  return url;
}

function ageRatingFromRating(danhGia: number): AgeRating {
  if (danhGia >= 9) return 'T13';
  if (danhGia >= 7) return 'K';
  return 'P';
}

export function mapCyberSoftMovie(raw: CyberSoftMovie): Movie {
  return {
    id: raw.maPhim,
    name: raw.tenPhim,
    englishName: raw.biDanh.replace(/-/g, ' '),
    trailerUrl: toEmbedUrl(raw.trailer),
    description: raw.moTa || 'Đang cập nhật mô tả phim.',
    genres: ['Đang cập nhật'],
    durationMinutes: 120,
    releaseDate: raw.ngayKhoiChieu,
    ageRating: ageRatingFromRating(raw.danhGia),
    director: 'Đang cập nhật',
    cast: ['Đang cập nhật'],
    country: 'Đang cập nhật',
    language: 'Phụ đề tiếng Việt',
    isUpcoming: raw.sapChieu,
    isShowing: raw.dangChieu,
    isHot: raw.hot,
    rating: raw.danhGia,
    posterUrl: raw.hinhAnh,
    backdropUrl: raw.hinhAnh,
  };
}

export interface LiveMovieFilter {
  keyword?: string;
  status?: 'showing' | 'upcoming' | 'all';
}

/** Small in-memory cache so other mock services (showtimes/bookings) can resolve
 * a movie's name/poster even though it was never loaded into mocks/movies.ts. */
const liveMovieCache = new Map<number, Movie>();

function cacheMovies(list: Movie[]) {
  for (const m of list) liveMovieCache.set(m.id, m);
  return list;
}

export function getCachedLiveMovie(id: number): Movie | undefined {
  return liveMovieCache.get(id);
}

export async function fetchLiveMovies(filter: LiveMovieFilter = {}): Promise<Movie[]> {
  const res = await cybersoftApi.get<{ content: CyberSoftMovie[] }>(
    'QuanLyPhim/LayDanhSachPhim',
    { params: { maNhom: CYBERSOFT_MA_NHOM } },
  );
  cacheMovies(res.data.content.map(mapCyberSoftMovie));

  let result = res.data.content.map(mapCyberSoftMovie);
  if (filter.status === 'showing') result = result.filter((m) => m.isShowing);
  if (filter.status === 'upcoming') result = result.filter((m) => m.isUpcoming);
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter((m) => m.name.toLowerCase().includes(kw));
  }
  return result;
}

export async function fetchLiveMovieById(id: number): Promise<Movie | undefined> {
  const res = await cybersoftApi.get<{ content: CyberSoftMovie }>(
    'QuanLyPhim/LayThongTinPhim',
    { params: { MaPhim: id } },
  );
  if (!res.data.content) return undefined;
  const movie = mapCyberSoftMovie(res.data.content);
  cacheMovies([movie]);
  return movie;
}
