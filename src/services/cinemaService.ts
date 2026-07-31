import { cinemaSystems, cities, findCinema } from '@/mocks/cinemas';
import { delay } from '@/services/delay';

export async function fetchCinemaSystems() {
  return delay(cinemaSystems);
}

export async function fetchCities() {
  return delay(cities);
}

export async function fetchCinemaById(id: number) {
  return delay(findCinema(id));
}
