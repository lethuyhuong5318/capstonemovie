import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import PasswordInput from '@/components/common/PasswordInput';
import { register as registerApi } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  username: z.string().min(3, 'Tài khoản tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

type FormValues = z.infer<typeof schema>;

const fields: Array<{
  name: keyof FormValues;
  label: string;
  type?: string;
  autoComplete?: string;
}> = [
  { name: 'fullName', label: 'Họ tên', autoComplete: 'name' },
  { name: 'username', label: 'Tài khoản', autoComplete: 'username' },
  { name: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { name: 'phone', label: 'Số điện thoại', type: 'tel', autoComplete: 'tel' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    },
  });

  const onSubmit = (values: FormValues) => mutation.mutate(values);

  return (
    <div className="container-app flex max-w-md flex-col py-16">
      <h1 className="mb-6 text-2xl font-semibold">Đăng ký</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
        {fields.map((field) => {
          const inputId = `register-${field.name}`;
          const errorId = `${inputId}-error`;
          return (
            <div key={field.name}>
              <label htmlFor={inputId} className="mb-1 block text-sm text-text-muted">
                {field.label}
              </label>
              <input
                id={inputId}
                type={field.type ?? 'text'}
                autoComplete={field.autoComplete}
                aria-invalid={!!errors[field.name]}
                aria-describedby={errors[field.name] ? errorId : undefined}
                {...registerField(field.name)}
                className="input"
              />
              {errors[field.name] && (
                <p id={errorId} role="alert" className="mt-1 text-sm text-error">
                  {errors[field.name]?.message}
                </p>
              )}
            </div>
          );
        })}

        <div>
          <label htmlFor="register-password" className="mb-1 block text-sm text-text-muted">
            Mật khẩu
          </label>
          <PasswordInput
            id="register-password"
            autoComplete="new-password"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? 'register-password-error' : undefined}
            {...registerField('password')}
          />
          {errors.password && (
            <p id="register-password-error" role="alert" className="mt-1 text-sm text-error">
              {errors.password.message}
            </p>
          )}
        </div>

        {mutation.isError && (
          <p role="alert" className="text-sm text-error">
            {mutation.error instanceof Error
              ? mutation.error.message
              : 'Đăng ký thất bại. Vui lòng thử lại.'}
          </p>
        )}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="rounded-md bg-primary py-2.5 font-medium hover:bg-primary-hover disabled:opacity-60"
        >
          {mutation.isPending ? 'Đang đăng ký...' : 'Đăng ký'}
        </button>
      </form>
      <p className="mt-4 text-sm text-text-muted">
        Đã có tài khoản?{' '}
        <Link to="/login" className="text-primary">
          Đăng nhập
        </Link>
      </p>
    </div>
  );
}
