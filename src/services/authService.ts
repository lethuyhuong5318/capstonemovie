import { users, nextUserId, findUserByUsername } from '@/mocks/users';
import { delay } from '@/services/delay';
import type { AuthTokens, User } from '@/types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  password: string;
  email: string;
  phone: string;
  fullName: string;
}

function makeTokens(user: User): AuthTokens {
  return {
    accessToken: `mock-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}-${Date.now()}`,
  };
}

export class InvalidCredentialsError extends Error {}
export class AccountLockedError extends Error {}
export class UsernameTakenError extends Error {}

export async function login(payload: LoginPayload): Promise<AuthTokens & { user: User }> {
  const user = findUserByUsername(payload.username);
  if (!user || payload.password.length < 6) {
    throw new InvalidCredentialsError('Sai tài khoản hoặc mật khẩu');
  }
  if (user.isLocked) {
    throw new AccountLockedError('Tài khoản đã bị khóa');
  }
  return delay({ ...makeTokens(user), user }, 400);
}

export async function register(
  payload: RegisterPayload,
): Promise<AuthTokens & { user: User }> {
  if (findUserByUsername(payload.username)) {
    throw new UsernameTakenError('Tài khoản đã tồn tại');
  }
  const user: User = {
    id: nextUserId(),
    username: payload.username,
    email: payload.email,
    phone: payload.phone,
    fullName: payload.fullName,
    role: 'CUSTOMER',
  };
  users.push(user);
  return delay({ ...makeTokens(user), user }, 400);
}

export async function requestPasswordReset(email: string) {
  return delay({ sent: true, email }, 500);
}
