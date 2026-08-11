import axios from 'axios';

/**
 * Public CyberSoft bootcamp training API — shared sandbox used to demo a real
 * (non-mock) HTTP data source for the movie catalog. Not a private secret:
 * this token is the standard publicly-distributed classroom token.
 */
export const cybersoftApi = axios.create({
  baseURL: 'https://movienew.cybersoft.edu.vn/api/',
});

/**
 * Write endpoints (`CapNhatPhimUpload`, `XoaPhim`, ...) additionally require an
 * `Authorization: Bearer <accessToken>` from a real CyberSoft account with the
 * `QuanTri` role — `TokenCybersoft` alone only unlocks the read endpoints.
 * Without it those calls fail 401; with a non-admin account they fail 403.
 */
const CYBERSOFT_TOKEN_KEY = 'cinewave-cybersoft-token';

let cybersoftAccessToken: string | null =
  typeof localStorage !== 'undefined' ? localStorage.getItem(CYBERSOFT_TOKEN_KEY) : null;

export function setCybersoftAccessToken(token: string | null) {
  cybersoftAccessToken = token;
  if (typeof localStorage === 'undefined') return;
  if (token) localStorage.setItem(CYBERSOFT_TOKEN_KEY, token);
  else localStorage.removeItem(CYBERSOFT_TOKEN_KEY);
}

export function getCybersoftAccessToken() {
  return cybersoftAccessToken;
}

cybersoftApi.interceptors.request.use((config) => {
  config.headers.set(
    'TokenCybersoft',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0ZW5Mb3AiOiJCb290Y2FtcCA5NCIsIkhldEhhblN0cmluZyI6IjEzLzAxLzIwMjciLCJIZXRIYW5UaW1lIjoiMTc5OTc5ODQwMDAwMCIsIm5iZiI6MTc3MjY0MzYwMCwiZXhwIjoxNzk5OTQ2MDAwfQ.fXnFWdTzELVYga9S7pakEljJsvLiA3qz1XvvVCzlxkI',
  );
  if (cybersoftAccessToken) {
    config.headers.set('Authorization', `Bearer ${cybersoftAccessToken}`);
  }
  return config;
});

/** Turns an axios error from this API into the server's real message. */
export function cybersoftErrorMessage(error: unknown, fallback: string): string {
  const res = (error as { response?: { status?: number; data?: { content?: unknown; message?: unknown } } })
    .response;
  if (!res) return 'Không kết nối được tới máy chủ phim. Kiểm tra kết nối mạng rồi thử lại.';

  const raw = res.data?.content ?? res.data?.message;
  const serverMessage = typeof raw === 'string' && raw.trim() ? raw.trim() : null;

  if (res.status === 401) {
    return 'Thao tác này cần đăng nhập bằng tài khoản CyberSoft có quyền quản trị (API dùng chung của lớp học).';
  }
  if (res.status === 403) {
    return 'Tài khoản CyberSoft hiện tại không có quyền quản trị nên không thể thay đổi dữ liệu phim.';
  }
  return serverMessage ?? fallback;
}

export const CYBERSOFT_MA_NHOM = 'GP05';
