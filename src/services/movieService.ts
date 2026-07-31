import { movies, nextMovieId } from '@/mocks/movies';
import { delay } from '@/services/delay';
import type { AgeRating, Movie } from '@/types';

export interface MovieListFilter {
  keyword?: string;
  status?: 'showing' | 'upcoming' | 'all';
}

export async function fetchMovies(filter: MovieListFilter = {}): Promise<Movie[]> {
  let result = [...movies];
  if (filter.status === 'showing') result = result.filter((m) => m.isShowing);
  if (filter.status === 'upcoming') result = result.filter((m) => m.isUpcoming);
  if (filter.keyword) {
    const kw = filter.keyword.toLowerCase();
    result = result.filter((m) => m.name.toLowerCase().includes(kw));
  }
  return delay(result);
}

export async function fetchMovieById(id: number): Promise<Movie | undefined> {
  return delay(movies.find((m) => m.id === id));
}

export interface MovieFormValues {
  name: string;
  englishName: string;
  trailerUrl: string;
  description: string;
  genres: string;
  durationMinutes: number;
  releaseDate: string;
  ageRating: AgeRating;
  isUpcoming: boolean;
  isShowing: boolean;
  isHot: boolean;
}

function toMovieFields(values: MovieFormValues) {
  return {
    ...values,
    genres: values.genres
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean),
  };
}

export async function createMovie(values: MovieFormValues): Promise<Movie> {
  const movie: Movie = {
    id: nextMovieId(),
    posterUrl: '',
    backdropUrl: '',
    rating: 0,
    director: '',
    cast: [],
    country: '',
    language: '',
    ...toMovieFields(values),
  };
  movies.push(movie);
  return delay(movie);
}

export async function updateMovie(
  id: number,
  values: MovieFormValues,
): Promise<Movie | undefined> {
  const movie = movies.find((m) => m.id === id);
  if (!movie) return delay(undefined);
  Object.assign(movie, toMovieFields(values));
  return delay(movie);
}

export async function deleteMovie(id: number): Promise<void> {
  const idx = movies.findIndex((m) => m.id === id);
  if (idx >= 0) movies.splice(idx, 1);
  return delay(undefined);
}
