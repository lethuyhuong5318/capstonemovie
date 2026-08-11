import { cybersoftApi, setCybersoftAccessToken, getCybersoftAccessToken } from '@/lib/cybersoftApi';

interface CyberSoftLoginContent {
  taiKhoan: string;
  hoTen: string;
  email: string;
  maLoaiNguoiDung: string;
  accessToken: string;
}

export interface CybersoftSession {
  account: string;
  fullName: string;
  /** `QuanTri` = admin. Only this role may write to the movie catalog. */
  role: string;
  isAdmin: boolean;
}

const SESSION_KEY = 'cinewave-cybersoft-session';

export function getCybersoftSession(): CybersoftSession | null {
  if (!getCybersoftAccessToken()) return null;
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CybersoftSession;
  } catch {
    return null;
  }
}

/**
 * Signs in against the real CyberSoft API to obtain the Bearer token that the
 * catalog write endpoints require. This is separate from the app's own (mock)
 * admin login, which never leaves the browser.
 */
export async function loginCybersoft(taiKhoan: string, matKhau: string): Promise<CybersoftSession> {
  const res = await cybersoftApi.post<{ content: CyberSoftLoginContent }>(
    'QuanLyNguoiDung/DangNhap',
    { taiKhoan, matKhau },
  );
  const content = res.data.content;
  setCybersoftAccessToken(content.accessToken);

  const session: CybersoftSession = {
    account: content.taiKhoan,
    fullName: content.hoTen,
    role: content.maLoaiNguoiDung,
    isAdmin: content.maLoaiNguoiDung === 'QuanTri',
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutCybersoft() {
  setCybersoftAccessToken(null);
  localStorage.removeItem(SESSION_KEY);
}
