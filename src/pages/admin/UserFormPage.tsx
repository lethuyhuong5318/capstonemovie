import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createUser,
  fetchUserById,
  updateUser,
  type UserFormValues,
} from '@/services/userService';

const schema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên'),
  username: z.string().min(3, 'Tài khoản tối thiểu 3 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  role: z.enum(['CUSTOMER', 'ADMIN']),
});

export default function UserFormPage() {
  const { id } = useParams();
  const userId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existing } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUserById(userId!),
    enabled: !!userId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', username: '', email: '', phone: '', role: 'CUSTOMER' },
  });

  useEffect(() => {
    if (existing) reset(existing);
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: UserFormValues) =>
      userId ? updateUser(userId, values) : createUser(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      navigate('/admin/users');
    },
  });

  const onSubmit = (values: UserFormValues) => mutation.mutate(values);

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">
        {userId ? `Sửa người dùng #${userId}` : 'Thêm người dùng mới'}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid max-w-xl gap-4 rounded border border-border bg-surface p-5"
      >
        <FormField label="Họ tên" error={errors.fullName?.message}>
          <input {...register('fullName')} className="input" />
        </FormField>
        <FormField label="Tài khoản" error={errors.username?.message}>
          <input {...register('username')} className="input" disabled={!!userId} />
        </FormField>
        <FormField label="Email" error={errors.email?.message}>
          <input type="email" {...register('email')} className="input" />
        </FormField>
        <FormField label="Số điện thoại" error={errors.phone?.message}>
          <input type="tel" {...register('phone')} className="input" />
        </FormField>
        <FormField label="Vai trò" error={errors.role?.message}>
          <select {...register('role')} className="input">
            <option value="CUSTOMER">Khách hàng</option>
            <option value="ADMIN">Quản trị</option>
          </select>
        </FormField>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded bg-primary px-5 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Lưu'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className="rounded bg-surface-alt px-5 py-2 text-sm hover:text-text"
          >
            Hủy
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-text-muted">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-error">
          {error}
        </span>
      )}
    </label>
  );
}
