import { createBrowserRouter } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import RouteErrorBoundary from '@/components/common/RouteErrorBoundary';
import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';
import {
  BookingListPage,
  BookingPage,
  CinemaListPage,
  DashboardPage,
  ForgotPasswordPage,
  MovieDetailPage,
  MovieFormPage,
  MovieListPage,
  NotFoundPage,
  ProfilePage,
  PromotionsPage,
  RegisterPage,
  SchedulePage,
  ShowtimeFormPage,
  TicketDetailPage,
  UserFormPage,
  UserListPage,
} from '@/routes/routeComponents';

export const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/movies/:movieId', element: <MovieDetailPage /> },
      { path: '/cinemas', element: <CinemaListPage /> },
      { path: '/schedule', element: <SchedulePage /> },
      { path: '/promotions', element: <PromotionsPage /> },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/booking/:showtimeId', element: <BookingPage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/tickets/:bookingId', element: <TicketDetailPage /> },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
  {
    element: <ProtectedRoute requireAdmin />,
    children: [
      {
        path: '/admin',
        element: <AdminLayout />,
        errorElement: <RouteErrorBoundary />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'movies', element: <MovieListPage /> },
          { path: 'movies/create', element: <MovieFormPage /> },
          { path: 'movies/:id/edit', element: <MovieFormPage /> },
          { path: 'movies/:id/showtimes', element: <ShowtimeFormPage /> },
          { path: 'bookings', element: <BookingListPage /> },
          { path: 'users', element: <UserListPage /> },
          { path: 'users/create', element: <UserFormPage /> },
          { path: 'users/:id/edit', element: <UserFormPage /> },
        ],
      },
    ],
  },
]);
