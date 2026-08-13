import { cybersoftApi, CYBERSOFT_MA_NHOM, setCybersoftAccessToken, cybersoftErrorMessage } from '@/lib/cybersoftApi';
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

interface CyberSoftAccount {
  taiKhoan: string;
  hoTen: string;
  email: string;
  soDT?: string;
  soDt?: string;
  maLoaiNguoiDung?: string;
  accessToken?: string;
}

export class InvalidCredentialsError extends Error {}
export class AccountLockedError extends Error {}
export class UsernameTakenError extends Error {}






function idFromAccount(taiKhoan: string): number {
  let hash = 0;
  for (let i = 0; i < taiKhoan.length; i++) {
    hash = (hash * 31 + taiKhoan.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function toUser(raw: CyberSoftAccount): User {
  const isRealAdmin = raw.maLoaiNguoiDung === 'QuanTri';
  return {
    id: idFromAccount(raw.taiKhoan),
    username: raw.taiKhoan,
    email: raw.email,
    phone: raw.soDT ?? raw.soDt ?? '',
    fullName: raw.hoTen,
    role: isRealAdmin ? 'ADMIN' : 'CUSTOMER',
  };
}

export async function login(payload: LoginPayload): Promise<AuthTokens & { user: User }> {
  try {
    const res = await cybersoftApi.post<{ content: CyberSoftAccount }>(
      'QuanLyNguoiDung/DangNhap',
      { taiKhoan: payload.username, matKhau: payload.password },
    );
    const content = res.data.content;
    const accessToken = content.accessToken ?? '';

    setCybersoftAccessToken(accessToken);
    return { user: toUser(content), accessToken, refreshToken: accessToken };
  } catch (error) {
    const status = (error as { response?: { status?: number } }).response?.status;
    if (status === 404 || status === 400 || status === 401) {
      throw new InvalidCredentialsError('Sai tài khoản hoặc mật khẩu');
    }
    throw new Error(cybersoftErrorMessage(error, 'Đăng nhập thất bại. Vui lòng thử lại.'));
  }
}

export async function register(payload: RegisterPayload): Promise<AuthTokens & { user: User }> {
  try {
    await cybersoftApi.post('QuanLyNguoiDung/DangKy', {
      taiKhoan: payload.username,
      matKhau: payload.password,
      email: payload.email,
      soDt: payload.phone,
      maNhom: CYBERSOFT_MA_NHOM,
      hoTen: payload.fullName,
    });
  } catch (error) {
    const message = cybersoftErrorMessage(error, 'Đăng ký thất bại. Vui lòng thử lại.');
    if (/tồn tại|đã có|taken/i.test(message)) {
      throw new UsernameTakenError('Tài khoản đã tồn tại, vui lòng chọn tên khác');
    }
    throw new Error(message);
  }

  return login({ username: payload.username, password: payload.password });
}

export async function fetchAccountInfo(): Promise<User> {
  const res = await cybersoftApi.post<{ content: CyberSoftAccount }>(
    'QuanLyNguoiDung/ThongTinTaiKhoan',
    {},
  );
  return toUser(res.data.content);
}

export function clearAuthToken() {
  setCybersoftAccessToken(null);
}





export async function requestPasswordReset(_email: string): Promise<never> {
  throw new Error(
    'Hệ thống hiện chưa hỗ trợ đặt lại mật khẩu tự động. Vui lòng liên hệ quản trị viên để được cấp lại mật khẩu.',
  );
}
