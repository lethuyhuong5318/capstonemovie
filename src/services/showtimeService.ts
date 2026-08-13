import { showtimes, findShowtime, ensureShowtimesForMovie } from '@/mocks/showtimes';
import { cinemaSystems } from '@/mocks/cinemas';
import { movies } from '@/mocks/movies';
import { getCachedLiveMovie } from '@/services/movieApiService';
import { getSeatsForShowtime, computeShowtimeStatus } from '@/mocks/seats';
import { delay } from '@/services/delay';
import { cybersoftApi, cybersoftErrorMessage } from '@/lib/cybersoftApi';
import type { Movie, Seat, Showtime, ShowtimeStatus } from '@/types';

export interface ShowtimeWithStatus extends Showtime {
  status: ShowtimeStatus;
}

export interface CinemaGroup {
  id: number;
  name: string;
  address: string;
  dates: { date: string; showtimes: ShowtimeWithStatus[] }[];
}

export interface CinemaSystemGroup {
  id: number;
  name: string;
  shortName: string;
  cinemas: CinemaGroup[];
}

export async function fetchShowtimesByMovie(
  movieId: number,
  city?: string,
): Promise<CinemaSystemGroup[]> {
  ensureShowtimesForMovie(movieId);
  const relevant: ShowtimeWithStatus[] = showtimes
    .filter((s) => s.movieId === movieId)
    .map((s) => ({ ...s, status: computeShowtimeStatus(s.id) }));

  const result: CinemaSystemGroup[] = cinemaSystems
    .map((system) => {
      const cinemas = system.cinemas
        .filter((cinema) => !city || cinema.city === city)
        .map((cinema) => {
          const cinemaShowtimes = relevant.filter((s) => s.cinemaId === cinema.id);
          const dateMap = new Map<string, ShowtimeWithStatus[]>();
          for (const st of cinemaShowtimes) {
            const arr = dateMap.get(st.date) ?? [];
            arr.push(st);
            dateMap.set(st.date, arr);
          }
          const dates = Array.from(dateMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, sts]) => ({ date, showtimes: sts.sort((a, b) => a.time.localeCompare(b.time)) }));
          return { id: cinema.id, name: cinema.name, address: cinema.address, dates };
        })
        .filter((c) => c.dates.length > 0);
      return { id: system.id, name: system.name, shortName: system.shortName, cinemas };
    })
    .filter((s) => s.cinemas.length > 0);

  return delay(result);
}

export async function fetchShowtimeById(id: number) {
  return delay(findShowtime(id));
}

export interface CinemaScheduleMovie {
  movieId: number;
  movieName: string;
  posterUrl: string;
  ageRating: Movie['ageRating'] | undefined;
  showtimes: ShowtimeWithStatus[];
}


export async function fetchScheduleByCinema(
  cinemaId: number,
  date: string,
  movieIds: number[],
): Promise<CinemaScheduleMovie[]> {
  for (const id of movieIds) ensureShowtimesForMovie(id);

  const relevant = showtimes
    .filter((s) => s.cinemaId === cinemaId && s.date === date)
    .map((s) => ({ ...s, status: computeShowtimeStatus(s.id) }));

  const byMovie = new Map<number, ShowtimeWithStatus[]>();
  for (const st of relevant) {
    const arr = byMovie.get(st.movieId) ?? [];
    arr.push(st);
    byMovie.set(st.movieId, arr);
  }

  const result: CinemaScheduleMovie[] = Array.from(byMovie.entries()).map(([movieId, sts]) => {
    const movie = movies.find((m) => m.id === movieId) ?? getCachedLiveMovie(movieId);
    return {
      movieId,
      movieName: movie?.name ?? '',
      posterUrl: movie?.posterUrl ?? '',
      ageRating: movie?.ageRating,
      showtimes: sts.sort((a, b) => a.time.localeCompare(b.time)),
    };
  });

  return delay(result.filter((m) => m.movieName));
}

export interface ShowtimeDetail extends Showtime {
  movieName: string;
  moviePosterClassId: number;
  cinemaSystemName: string;
  cinemaName: string;
}

export async function fetchShowtimeDetail(id: number): Promise<ShowtimeDetail | undefined> {
  const showtime = findShowtime(id);
  if (!showtime) return delay(undefined);
  const system = cinemaSystems.find((s) => s.id === showtime.cinemaSystemId);
  const cinema = system?.cinemas.find((c) => c.id === showtime.cinemaId);
  const movie = movies.find((m) => m.id === showtime.movieId) ?? getCachedLiveMovie(showtime.movieId);
  return delay({
    ...showtime,
    movieName: movie?.name ?? '',
    moviePosterClassId: movie?.id ?? 0,
    cinemaSystemName: system?.name ?? '',
    cinemaName: cinema?.name ?? '',
  });
}

export async function fetchSeatsByShowtime(showtimeId: number): Promise<Seat[]> {
  return delay(getSeatsForShowtime(showtimeId).map((s) => ({ ...s })), 400);
}

export interface ShowtimeFormValues {
  movieId: number;
  roomId: string;
  cinemaClusterCode: string;
  date: string;
  time: string;
  price: number;
}

export async function createShowtime(values: ShowtimeFormValues) {
  const [year, month, day] = values.date.split('-');
  try {
    const response = await cybersoftApi.post('QuanLyDatVe/TaoLichChieu', {
      maPhim: Number(values.movieId),
      ngayChieuGioChieu: `${day}/${month}/${year} ${values.time}:00`,
      maRap: values.cinemaClusterCode,
      giaVe: Number(values.price),
    });
    return response.data.content;
  } catch (error) {
    throw new Error(cybersoftErrorMessage(error, 'Tạo lịch chiếu thất bại. Vui lòng thử lại.'));
  }
}
