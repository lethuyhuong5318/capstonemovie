import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { requestPasswordReset } from '@/services/authService';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const mutation = useMutation({ mutationFn: requestPasswordReset });

  return (
    <div className="container-app flex max-w-md flex-col py-16">
      <h1 className="mb-2 text-2xl font-semibold">Quên mật khẩu</h1>
      <p className="mb-6 text-sm text-text-muted">
        Nhập email đã đăng ký, chúng tôi sẽ gửi hướng dẫn đặt lại mật khẩu.
      </p>

      {mutation.isSuccess ? (
        <p className="rounded-md bg-success/10 px-3 py-2 text-sm text-success">
          Đã gửi hướng dẫn đến {email}. Vui lòng kiểm tra hộp thư.
        </p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(email);
          }}
          className="flex flex-col gap-4"
        >
          <label className="block">
            <span className="mb-1 block text-sm text-text-muted">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ban@vidu.com"
              className="input"
            />
          </label>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded-md bg-primary py-2.5 font-medium hover:bg-primary-hover disabled:opacity-60"
          >
            {mutation.isPending ? 'Đang gửi...' : 'Gửi hướng dẫn'}
          </button>
        </form>
      )}

      <Link to="/login" className="mt-4 text-sm text-primary">
        ← Quay lại đăng nhập
      </Link>
    </div>
  );
}
