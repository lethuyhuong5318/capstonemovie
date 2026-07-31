import { combos } from '@/mocks/concessions';
import { delay } from '@/services/delay';

export async function fetchCombos() {
  return delay(combos);
}
