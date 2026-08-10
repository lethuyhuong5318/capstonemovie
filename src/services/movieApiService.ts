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

/**
 * A few otherwise-legitimate movies on the shared `GP01` sandbox have had their
 * poster overwritten by another student's test upload (e.g. movie 1283's image
 * is currently an unrelated school timetable screenshot). We can't fix the file
 * on the shared account, so we substitute a same-franchise poster that's already
 * hosted there instead of showing the broken image.
 */
const POSTER_OVERRIDES: Record<number, string> = {
  1283: 'https://movienew.cybersoft.edu.vn/hinhanh/latmat7_gp01.jpg', // Lật mặt 48h → ảnh gốc bị đè, dùng tạm poster Lật mặt 7
};

export function mapCyberSoftMovie(raw: CyberSoftMovie): Movie {
  const posterOverride = POSTER_OVERRIDES[raw.maPhim];
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
    posterUrl: posterOverride ?? raw.hinhAnh,
    backdropUrl: posterOverride ?? raw.hinhAnh,
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

/**
 * Sandbox `GP01` is shared by every student on the bootcamp; other students'
 * throwaway test entries (created while testing their own CRUD screens) show
 * up in the same catalog. We have no write access to delete other people's
 * data on the shared account, so we hide known/likely test entries client-side
 * instead of showing them to our own users.
 */
const KNOWN_JUNK_MOVIE_IDS = new Set([
  15600, 15601, 15602, 15603, 15604, 15605, 15606, 15607, 15608, 15612, 15613,
  15614, 15615, 15616, 15617, 15618, 15619, 15620, 15621, 15622, 15626, 15627,
  15628, 15629, 15630, 15631, 15632, 15633,
]);

const JUNK_NAME_PATTERN = /\btest\d*\b|\d{9,}|^[a-z]{5,}$|^edit\b/i;

function isJunkMovie(movie: Movie): boolean {
  return KNOWN_JUNK_MOVIE_IDS.has(movie.id) || JUNK_NAME_PATTERN.test(movie.name.trim());
}

export async function fetchLiveMovies(filter: LiveMovieFilter = {}): Promise<Movie[]> {
  const res = await cybersoftApi.get<{ content: CyberSoftMovie[] }>(
    'QuanLyPhim/LayDanhSachPhim',
    { params: { maNhom: CYBERSOFT_MA_NHOM } },
  );
  cacheMovies(res.data.content.map(mapCyberSoftMovie));

  let result = res.data.content.map(mapCyberSoftMovie).filter((m) => !isJunkMovie(m));
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

export interface LiveMovieFormValues {
  name: string;
  trailerUrl: string;
  description: string;
  durationMinutes: number;
  releaseDate: string;
  ageRating: AgeRating;
  isUpcoming: boolean;
  isShowing: boolean;
  isHot: boolean;
  posterFile?: File | null;
}

const ratingFromAgeRating: Record<AgeRating, number> = {
  P: 5,
  K: 6,
  T13: 9,
  T16: 9,
  T18: 10,
};

function toCyberSoftDate(isoDate: string): string {
  const [y, m, d] = isoDate.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function buildMovieFormData(values: LiveMovieFormValues, extra?: Record<string, string>) {
  const form = new FormData();
  form.append('tenPhim', values.name);
  form.append('trailer', values.trailerUrl);
  form.append('moTa', values.description);
  form.append('ngayKhoiChieu', toCyberSoftDate(values.releaseDate));
  form.append('danhGia', String(ratingFromAgeRating[values.ageRating]));
  form.append('hot', String(values.isHot));
  form.append('dangChieu', String(values.isShowing));
  form.append('sapChieu', String(values.isUpcoming));
  form.append('maNhom', CYBERSOFT_MA_NHOM);
  if (values.posterFile) form.append('File', values.posterFile);
  for (const [key, value] of Object.entries(extra ?? {})) form.append(key, value);
  return form;
}

export async function createLiveMovie(values: LiveMovieFormValues): Promise<Movie> {
  const res = await cybersoftApi.post<{ content: CyberSoftMovie }>(
    'QuanLyPhim/ThemPhimUploadHinh',
    buildMovieFormData(values),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const movie = mapCyberSoftMovie(res.data.content);
  cacheMovies([movie]);
  return movie;
}

export async function updateLiveMovie(id: number, values: LiveMovieFormValues): Promise<Movie> {
  const res = await cybersoftApi.post<{ content: CyberSoftMovie }>(
    'QuanLyPhim/CapNhatPhimUpload',
    buildMovieFormData(values, { maPhim: String(id) }),
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );
  const movie = mapCyberSoftMovie(res.data.content);
  cacheMovies([movie]);
  return movie;
}

export async function deleteLiveMovie(id: number): Promise<void> {
  await cybersoftApi.delete('QuanLyPhim/XoaPhim', { params: { MaPhim: id } });
  liveMovieCache.delete(id);
}
