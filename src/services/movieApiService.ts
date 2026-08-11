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

async function fetchRawMovies(): Promise<CyberSoftMovie[]> {
  const res = await cybersoftApi.get<{ content: CyberSoftMovie[] }>(
    'QuanLyPhim/LayDanhSachPhim',
    { params: { maNhom: CYBERSOFT_MA_NHOM } },
  );
  return res.data.content;
}

export async function fetchLiveMovies(filter: LiveMovieFilter = {}): Promise<Movie[]> {
  const content = await fetchRawMovies();
  cacheMovies(content.map(mapCyberSoftMovie));

  let result = content.map(mapCyberSoftMovie).filter((m) => !isJunkMovie(m));
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

function hasHttpResponse(error: unknown): boolean {
  return Boolean((error as { response?: unknown }).response);
}

export async function createLiveMovie(values: LiveMovieFormValues): Promise<Movie> {
  let previousIds: Set<number> | null = null;
  try {
    previousIds = new Set((await fetchRawMovies()).map((movie) => movie.maPhim));
  } catch {
    // The write can still proceed; only post-error verification is unavailable.
  }

  try {
    const res = await cybersoftApi.post<{ content: CyberSoftMovie }>(
      'QuanLyPhim/ThemPhimUploadHinh',
      buildMovieFormData(values),
    );
    const movie = mapCyberSoftMovie(res.data.content);
    cacheMovies([movie]);
    return movie;
  } catch (error) {
    // CyberSoft sometimes commits a multipart upload but closes the response
    // without CORS headers. Confirm the side effect before showing a false error.
    if (!hasHttpResponse(error) && previousIds) {
      try {
        const created = (await fetchRawMovies())
          .filter((movie) => !previousIds.has(movie.maPhim) && movie.tenPhim.trim() === values.name.trim())
          .sort((a, b) => b.maPhim - a.maPhim)[0];
        if (created) {
          const movie = mapCyberSoftMovie(created);
          cacheMovies([movie]);
          return movie;
        }
      } catch {
        // Preserve the original write error when verification is unavailable.
      }
    }
    throw new MovieWriteError(cybersoftErrorMessage(error, 'Không thể thêm phim. Vui lòng thử lại.'));
  }
}

export async function updateLiveMovie(id: number, values: LiveMovieFormValues): Promise<Movie> {
  try {
    // `maPhim` and `File` are both required by CapNhatPhimUpload. MovieFormPage
    // validates the file before this request so the API does not fail opaquely.
    const res = await cybersoftApi.post<{ content: CyberSoftMovie }>(
      'QuanLyPhim/CapNhatPhimUpload',
      buildMovieFormData(values, { maPhim: String(id) }),
    );
    const movie = mapCyberSoftMovie(res.data.content);
    cacheMovies([movie]);
    return movie;
  } catch (error) {
    if (!hasHttpResponse(error)) {
      try {
        const saved = await fetchLiveMovieById(id);
        if (
          saved &&
          saved.name.trim() === values.name.trim() &&
          saved.description.trim() === values.description.trim() &&
          saved.releaseDate.slice(0, 10) === values.releaseDate.slice(0, 10) &&
          saved.isShowing === values.isShowing &&
          saved.isUpcoming === values.isUpcoming &&
          saved.isHot === values.isHot
        ) {
          return saved;
        }
      } catch {
        // Preserve the original write error when verification is unavailable.
      }
    }
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
