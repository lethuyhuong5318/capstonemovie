import type { User } from '@/types';

export const users: User[] = [
  {
    id: 1,
    username: 'admin',
    email: 'admin@cinewave.vn',
    phone: '0900000000',
    fullName: 'Quản trị viên',
    role: 'ADMIN',
  },
  {
    id: 2,
    username: 'huong',
    email: 'huong@cinewave.vn',
    phone: '0912345678',
    fullName: 'Lê Thúy Hường',
    role: 'CUSTOMER',
  },
];

let userIdCounter = users.length + 1;
export function nextUserId() {
  return userIdCounter++;
}

export function findUserByUsername(username: string) {
  return users.find((u) => u.username === username);
}
