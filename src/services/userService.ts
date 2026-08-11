import { cybersoftApi, CYBERSOFT_MA_NHOM, cybersoftErrorMessage } from '@/lib/cybersoftApi';
import type { UserRole } from '@/types';

interface CyberSoftUser {
  taiKhoan: string;
  hoTen: string;
  email: string;
  soDt?: string;
  soDT?: string;
  matKhau?: string | null;
  maLoaiNguoiDung: 'QuanTri' | 'KhachHang' | string;
  maNhom?: string;
}

export interface AdminUser {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

export interface UserListParams {
  keyword?: string;
  page?: number;
  pageSize?: number;
}

export interface UserFormValues {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: UserRole;
}

function mapUser(user: CyberSoftUser): AdminUser {
  return {
    id: user.taiKhoan,
    username: user.taiKhoan,
    fullName: user.hoTen,
    email: user.email,
    phone: user.soDt ?? user.soDT ?? '',
    password: user.matKhau ?? '',
    role: user.maLoaiNguoiDung === 'QuanTri' ? 'ADMIN' : 'CUSTOMER',
  };
}

export async function fetchUsers(params: UserListParams = {}) {
  const { keyword = '', page = 1, pageSize = 10 } = params;
  const response = await cybersoftApi.get<{ content: CyberSoftUser[] }>(
    'QuanLyNguoiDung/LayDanhSachNguoiDung',
    { params: { MaNhom: CYBERSOFT_MA_NHOM } },
  );

  const query = keyword.trim().toLocaleLowerCase('vi');
  const users = (response.data.content ?? []).map(mapUser).filter((user) =>
    !query || [user.fullName, user.username, user.email].some((value) => value.toLocaleLowerCase('vi').includes(query)),
  );
  const total = users.length;
  const start = (page - 1) * pageSize;
  return { data: users.slice(start, start + pageSize), meta: { page, pageSize, total } };
}

export async function fetchUserById(username: string): Promise<AdminUser> {
  const response = await cybersoftApi.get<{ content: CyberSoftUser[] }>(
    'QuanLyNguoiDung/TimKiemNguoiDung',
    { params: { MaNhom: CYBERSOFT_MA_NHOM, tuKhoa: username } },
  );
  const user = (response.data.content ?? []).find((item) => item.taiKhoan === username);
  if (!user) throw new Error('Không tìm thấy người dùng.');
  return mapUser(user);
}

function toPayload(values: UserFormValues, username = values.username) {
  return {
    taiKhoan: username,
    matKhau: values.password,
    email: values.email,
    soDt: values.phone,
    maNhom: CYBERSOFT_MA_NHOM,
    maLoaiNguoiDung: values.role === 'ADMIN' ? 'QuanTri' : 'KhachHang',
    hoTen: values.fullName,
  };
}

export async function createUser(values: UserFormValues): Promise<void> {
  try {
    await cybersoftApi.post('QuanLyNguoiDung/ThemNguoiDung', toPayload(values));
  } catch (error) {
    throw new Error(cybersoftErrorMessage(error, 'Không thể thêm người dùng.'));
  }
}

export async function updateUser(username: string, values: UserFormValues): Promise<void> {
  try {
    await cybersoftApi.put(
      'QuanLyNguoiDung/CapNhatThongTinNguoiDung',
      toPayload(values, username),
    );
  } catch (error) {
    throw new Error(cybersoftErrorMessage(error, 'Không thể cập nhật người dùng.'));
  }
}

export async function deleteUser(username: string): Promise<void> {
  try {
    await cybersoftApi.delete('QuanLyNguoiDung/XoaNguoiDung', {
      params: { TaiKhoan: username },
    });
  } catch (error) {
    throw new Error(cybersoftErrorMessage(error, 'Không thể xóa người dùng.'));
  }
}
