import type { Showtime } from '@/types';
import { movies } from '@/mocks/movies';
import { cinemaSystems } from '@/mocks/cinemas';

function nextDates(count: number) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const times = ['09:00', '11:30', '14:00', '16:30', '19:00', '21:30'];

export const showtimes: Showtime[] = [];
let showtimeIdCounter = 1;
const generatedForMovie = new Set<number>();

function generateShowtimesForMovie(movieId: number) {
  if (generatedForMovie.has(movieId)) return;
  generatedForMovie.add(movieId);

  for (const system of cinemaSystems) {
    for (const cinema of system.cinemas) {
      for (const date of nextDates(7)) {
        const dayTimes = times.filter(() => Math.random() > 0.35);
        for (const time of dayTimes.length ? dayTimes : [times[0]]) {
          showtimes.push({
            id: showtimeIdCounter++,
            movieId,
            cinemaSystemId: system.id,
            cinemaId: cinema.id,
            roomId: cinema.rooms[0].id,
            date,
            time,
            price: 75000,
            roomType: cinema.rooms[0].roomType,
          });
        }
      }
    }
  }
}

for (const movie of movies.filter((m) => m.isShowing)) {
  generateShowtimesForMovie(movie.id);
}

/** Ensures a movie (including one loaded from a live API, not just the local mock catalog) has generated showtimes. */
export function ensureShowtimesForMovie(movieId: number) {
  generateShowtimesForMovie(movieId);
}

export function findShowtime(id: number) {
  return showtimes.find((s) => s.id === id);
}

export function nextShowtimeId() {
  return Math.max(0, ...showtimes.map((s) => s.id)) + 1;
}

export function isShowtimeExpired(showtime: Showtime) {
  const dt = new Date(`${showtime.date}T${showtime.time}:00`);
  return dt.getTime() < Date.now();
}
