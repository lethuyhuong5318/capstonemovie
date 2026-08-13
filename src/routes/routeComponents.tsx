import { lazyRoute } from '@/routes/lazyRoute';

export const MovieDetailPage = lazyRoute(() => import('@/pages/public/MovieDetailPage'));
export const BookingPage = lazyRoute(() => import('@/pages/public/BookingPage'));
export const ProfilePage = lazyRoute(() => import('@/pages/public/ProfilePage'));
export const TicketDetailPage = lazyRoute(() => import('@/pages/public/TicketDetailPage'));
export const RegisterPage = lazyRoute(() => import('@/pages/public/RegisterPage'));
export const ForgotPasswordPage = lazyRoute(() => import('@/pages/public/ForgotPasswordPage'));
export const CinemaListPage = lazyRoute(() => import('@/pages/public/CinemaListPage'));
export const SchedulePage = lazyRoute(() => import('@/pages/public/SchedulePage'));
export const NotFoundPage = lazyRoute(() => import('@/pages/public/NotFoundPage'));
export const DashboardPage = lazyRoute(() => import('@/pages/admin/DashboardPage'));
export const MovieListPage = lazyRoute(() => import('@/pages/admin/MovieListPage'));
export const MovieFormPage = lazyRoute(() => import('@/pages/admin/MovieFormPage'));
export const ShowtimeFormPage = lazyRoute(() => import('@/pages/admin/ShowtimeFormPage'));
export const UserListPage = lazyRoute(() => import('@/pages/admin/UserListPage'));
export const UserFormPage = lazyRoute(() => import('@/pages/admin/UserFormPage'));
export const BookingListPage = lazyRoute(() => import('@/pages/admin/BookingListPage'));
