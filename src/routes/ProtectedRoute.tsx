import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import PageLoader from '@/components/common/PageLoader';
import { fetchAccountInfo } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

interface Props {
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ requireAdmin }: Props) {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setAuth = useAuthStore((s) => s.setAuth);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();

  const accountQuery = useQuery({
    queryKey: ['authenticated-account', accessToken],
    queryFn: fetchAccountInfo,
    enabled: Boolean(user && accessToken),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (accountQuery.data && accessToken) {
      setAuth(accountQuery.data, accessToken, accessToken);
    }
  }, [accountQuery.data, accessToken, setAuth]);

  useEffect(() => {
    if (accountQuery.isError) logout();
  }, [accountQuery.isError, logout]);

  if (!user || !accessToken || accountQuery.isError) {


    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (accountQuery.isPending) {
    return <PageLoader />;
  }

  const verifiedUser = accountQuery.data;
  if (!verifiedUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requireAdmin && verifiedUser.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
