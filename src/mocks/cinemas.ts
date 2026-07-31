import type { CinemaSystem } from '@/types';

export const cities = ['TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng'];

export const cinemaSystems: CinemaSystem[] = [
  {
    id: 1,
    name: 'StarLight Cinemas',
    shortName: 'StarLight',
    cinemas: [
      {
        id: 1,
        name: 'StarLight Đồng Khởi',
        address: '72 Lê Thánh Tôn, Quận 1',
        city: 'TP. Hồ Chí Minh',
        rooms: [{ id: 1, name: 'Phòng 1', rows: 8, cols: 10, roomType: '2D' }],
      },
      {
        id: 2,
        name: 'StarLight Landmark',
        address: '720A Điện Biên Phủ, Bình Thạnh',
        city: 'TP. Hồ Chí Minh',
        rooms: [{ id: 2, name: 'Phòng IMAX', rows: 8, cols: 10, roomType: 'IMAX' }],
      },
    ],
  },
  {
    id: 2,
    name: 'Orbit Cinema',
    shortName: 'Orbit',
    cinemas: [
      {
        id: 3,
        name: 'Orbit Cộng Hòa',
        address: '20 Cộng Hòa, Tân Bình',
        city: 'TP. Hồ Chí Minh',
        rooms: [{ id: 3, name: 'Phòng 1', rows: 8, cols: 10, roomType: '2D' }],
      },
      {
        id: 5,
        name: 'Orbit Times City',
        address: '458 Minh Khai, Hai Bà Trưng',
        city: 'Hà Nội',
        rooms: [{ id: 5, name: 'Phòng 1', rows: 8, cols: 10, roomType: '3D' }],
      },
    ],
  },
  {
    id: 3,
    name: 'Nova Cinema',
    shortName: 'Nova',
    cinemas: [
      {
        id: 4,
        name: 'Nova Nguyễn Du',
        address: '116 Nguyễn Du, Quận 1',
        city: 'TP. Hồ Chí Minh',
        rooms: [{ id: 4, name: 'Phòng A', rows: 8, cols: 10, roomType: '3D' }],
      },
    ],
  },
];

export function allCinemas() {
  return cinemaSystems.flatMap((s) => s.cinemas);
}

export function findCinema(id: number) {
  return allCinemas().find((c) => c.id === id);
}

export function findSystemByCinema(cinemaId: number) {
  return cinemaSystems.find((s) => s.cinemas.some((c) => c.id === cinemaId));
}
