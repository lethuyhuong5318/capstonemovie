import { users, nextUserId } from '@/mocks/users';
import { delay } from '@/services/delay';
import type { User, UserRole } from '@/types';

export interface UserListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchUsers(params: UserListParams = {}) {
  const { keyword = '', page = 1, pageSize = 10 } = params;
  let filtered = [...users];
  if (keyword) {
    const kw = keyword.toLowerCase();
    filtered = filtered.filter(
      (u) =>
        u.username.toLowerCase().includes(kw) ||
        u.fullName.toLowerCase().includes(kw) ||
        u.email.toLowerCase().includes(kw),
    );
  }
  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const data = filtered.slice(start, start + pageSize);
  return delay({ data, meta: { page, pageSize, total } });
}

export async function fetchUserById(id: number): Promise<User | undefined> {
  return delay(users.find((u) => u.id === id));
}

export interface UserFormValues {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export async function createUser(values: UserFormValues): Promise<User> {
  const user: User = { id: nextUserId(), ...values };
  users.push(user);
  return delay(user);
}

export async function updateUser(id: number, values: UserFormValues): Promise<User | undefined> {
  const user = users.find((u) => u.id === id);
  if (!user) return delay(undefined);
  Object.assign(user, values);
  return delay(user);
}

export async function deleteUser(id: number): Promise<void> {
  const idx = users.findIndex((u) => u.id === id);
  if (idx >= 0) users.splice(idx, 1);
  return delay(undefined);
}

export async function toggleLockUser(id: number): Promise<User | undefined> {
  const user = users.find((u) => u.id === id);
  if (!user) return delay(undefined);
  user.isLocked = !user.isLocked;
  return delay(user);
}
