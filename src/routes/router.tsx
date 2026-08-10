import { lazy, Suspense, type JSX } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import CustomerLayout from '@/layouts/CustomerLayout';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/routes/ProtectedRoute';
import PageLoader from '@/components/common/PageLoader';
import RouteErrorBoundary from '@/components/common/RouteErrorBoundary';
import HomePage from '@/pages/public/HomePage';
import LoginPage from '@/pages/public/LoginPage';

const MovieDetailPage = lazy(() => import('@/pages/public/MovieDetailPage'));
const BookingPage = lazy(() => import('@/pages/public/BookingPage'));
const ProfilePage = lazy(() => import('@/pages/public/ProfilePage'));
const TicketDetailPage = lazy(() => import('@/pages/public/TicketDetailPage'));
const RegisterPage = lazy(() => import('@/pages/public/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPasswordPage'));
const CinemaListPage = lazy(() => import('@/pages/public/CinemaListPage'));
const SchedulePage = lazy(() => import('@/pages/public/SchedulePage'));
const PromotionsPage = lazy(() => import('@/pages/public/PromotionsPage'));
const NotFoundPage = lazy(() => import('@/pages/public/NotFoundPage'));

const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const MovieListPage = lazy(() => import('@/pages/admin/MovieListPage'));
const MovieFormPage = lazy(() => import('@/pages/admin/MovieFormPage'));
const ShowtimeFormPage = lazy(() => import('@/pages/admin/ShowtimeFormPage'));
const UserListPage = lazy(() => import('@/pages/admin/UserListPage'));
const UserFormPage = lazy(() => import('@/pages/admin/UserFormPage'));
const BookingListPage = lazy(() => import('@/pages/admin/BookingListPage'));

function withSuspense(element: JSX.Element) {
  return <Suspense fallback={<PageLoader />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <CustomerLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/movies/:movieId', element: withSuspense(<MovieDetailPage />) },
      { path: '/cinemas', element: withSuspense(<CinemaListPage />) },
      { path: '/schedule', element: withSuspense(<SchedulePage />) },
      { path: '/promotions', element: withSuspense(<PromotionsPage />) },
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: withSuspense(<RegisterPage />) },
      { path: '/forgot-password', element: withSuspense(<ForgotPasswordPage />) },
      {
        element: <ProtectedRoute />,
        children: [
          { path: '/booking/:showtimeId', element: withSuspense(<BookingPage />) },
          { path: '/profile', element: withSuspense(<ProfilePage />) },
          { path: '/tickets/:bookingId', element: withSuspense(<TicketDetailPage />) },
        ],
      },
      { path: '*', element: withSuspense(<NotFoundPage />) },
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
          { index: true, element: withSuspense(<DashboardPage />) },
          { path: 'movies', element: withSuspense(<MovieListPage />) },
          { path: 'movies/create', element: withSuspense(<MovieFormPage />) },
          { path: 'movies/:id/edit', element: withSuspense(<MovieFormPage />) },
          { path: 'movies/:id/showtimes', element: withSuspense(<ShowtimeFormPage />) },
          { path: 'bookings', element: withSuspense(<BookingListPage />) },
          { path: 'users', element: withSuspense(<UserListPage />) },
          { path: 'users/create', element: withSuspense(<UserFormPage />) },
          { path: 'users/:id/edit', element: withSuspense(<UserFormPage />) },
        ],
      },
    ],
  },
]);
