import { cybersoftApi, CYBERSOFT_MA_NHOM, cybersoftErrorMessage } from '@/lib/cybersoftApi';
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

/**
 * Guards against throwaway entries other students leave behind on the shared
 * sandbox (names like `test1`, `Movie 1786111781058`, `edit 1`). The group's own
 * catalog is clean today, so this normally filters nothing.
 */
const JUNK_NAME_PATTERN = /\btest\d*\b|\d{9,}|^[a-z]{5,}$|^edit\b/i;

function isJunkMovie(movie: Movie): boolean {
  return JUNK_NAME_PATTERN.test(movie.name.trim());
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

export class MovieWriteError extends Error {}

export async function createLiveMovie(values: LiveMovieFormValues): Promise<Movie> {
  try {
    const res = await cybersoftApi.post<{ content: CyberSoftMovie }>(
      'QuanLyPhim/ThemPhimUploadHinh',
      buildMovieFormData(values),
    );
    const movie = mapCyberSoftMovie(res.data.content);
    cacheMovies([movie]);
    return movie;
  } catch (error) {
    throw new MovieWriteError(cybersoftErrorMessage(error, 'Không thể thêm phim. Vui lòng thử lại.'));
  }
}

export async function updateLiveMovie(id: number, values: LiveMovieFormValues): Promise<Movie> {
  try {
    // `maPhim` is required by the update contract (create does not take it), and
    // `File` is only appended when the admin actually picked a new poster — the
    // API keeps the existing image when the field is absent.
    const res = await cybersoftApi.post<{ content: CyberSoftMovie }>(
      'QuanLyPhim/CapNhatPhimUpload',
      buildMovieFormData(values, { maPhim: String(id) }),
    );
    const movie = mapCyberSoftMovie(res.data.content);
    cacheMovies([movie]);
    return movie;
  } catch (error) {
    throw new MovieWriteError(cybersoftErrorMessage(error, 'Không thể lưu phim. Vui lòng thử lại.'));
  }
}

export async function deleteLiveMovie(id: number): Promise<void> {
  try {
    await cybersoftApi.delete('QuanLyPhim/XoaPhim', { params: { MaPhim: id } });
    liveMovieCache.delete(id);
  } catch (error) {
    throw new MovieWriteError(cybersoftErrorMessage(error, 'Không thể xóa phim. Vui lòng thử lại.'));
  }
}
