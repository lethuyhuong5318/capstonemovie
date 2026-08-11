import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import Logo from '@/components/common/Logo';
import PasswordInput from '@/components/common/PasswordInput';
import { login } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  username: z.string().min(1, 'Vui lòng nhập tài khoản'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  // Set by ProtectedRoute when it intercepts a visit to a page that needs auth.
  const redirectTo = (location.state as { from?: { pathname: string } } | null)?.from?.pathname;

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      // Resume the interrupted flow (e.g. the showtime they were booking).
      if (redirectTo) navigate(redirectTo, { replace: true });
      else navigate(data.user.role === 'ADMIN' ? '/admin' : '/', { replace: true });
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <div className="container-app flex max-w-md flex-col py-16">
      <Logo className="mb-8 justify-center" />
      <h1 className="mb-2 text-2xl font-semibold">Đăng nhập</h1>
      {redirectTo ? (
        <p className="mb-6 rounded-md border border-primary/40 bg-primary/10 px-3 py-2 text-sm text-primary">
          Vui lòng đăng nhập để tiếp tục đặt vé. Bạn sẽ được đưa trở lại ngay sau khi đăng nhập.
        </p>
      ) : (
        <p className="mb-6 text-sm text-text-muted">
          Đăng nhập bằng tài khoản CineWave của bạn để đặt vé và xem lịch sử vé.
        </p>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        <div>
          <label htmlFor="login-username" className="mb-1 block text-sm text-text-muted">
            Tài khoản
          </label>
          <input
            id="login-username"
            autoComplete="username"
            aria-invalid={!!errors.username}
            aria-describedby={errors.username ? 'login-username-error' : undefined}
            {...registerField('username')}
            className="input"
          />
          {errors.username && (
            <p id="login-username-error" role="alert" className="mt-1 text-sm text-error">
              {errors.username.message}
            </p>
          )}
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm text-text-muted">
              Mật khẩu
            </label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <PasswordInput
            id="login-password"
            autoComplete="current-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
            {...registerField('password')}
          />
          {errors.password && (
            <p id="login-password-error" role="alert" className="mt-1 text-sm text-error">
              {errors.password.message}
            </p>
          )}
        </div>
        {mutation.isError && (
          <p role="alert" className="text-sm text-error">
            {mutation.error instanceof Error ? mutation.error.message : 'Đăng nhập thất bại. Vui lòng thử lại.'}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-primary py-2.5 font-medium hover:bg-primary-hover disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang đăng nhập...' : 'Đăng nhập'}
        </button>
      </form>
      <p className="mt-4 text-sm text-text-muted">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="text-primary">
          Đăng ký
        </Link>
      </p>
    </div>
  );
}
