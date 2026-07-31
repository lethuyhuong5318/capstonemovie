import type { Combo } from '@/types';

export const combos: Combo[] = [
  {
    id: 1,
    name: 'Combo Solo',
    description: '1 bắp vừa, 1 nước vừa',
    price: 89000,
    items: ['1 bắp rang vị ngọt (size vừa)', '1 nước ngọt (size vừa)'],
  },
  {
    id: 2,
    name: 'Combo Couple',
    description: '1 bắp lớn, 2 nước vừa',
    price: 159000,
    items: ['1 bắp rang vị caramel (size lớn)', '2 nước ngọt (size vừa)'],
  },
  {
    id: 3,
    name: 'Combo Family',
    description: '2 bắp lớn, 4 nước vừa',
    price: 299000,
    items: ['2 bắp rang (size lớn)', '4 nước ngọt (size vừa)'],
  },
];

export function findCombo(id: number) {
  return combos.find((c) => c.id === id);
}
