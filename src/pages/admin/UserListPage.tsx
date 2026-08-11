import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteUser, fetchUsers } from '@/services/userService';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const PAGE_SIZE = 8;

export default function UserListPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-users', keyword, page],
    queryFn: () => fetchUsers({ keyword, page, pageSize: PAGE_SIZE }),
  });

  useEffect(() => {
    if (!data) return;
    const totalPages = Math.max(1, Math.ceil(data.meta.total / PAGE_SIZE));
    if (page > totalPages) setPage(totalPages);
  }, [data, page]);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Quản lý người dùng</h1>
        <Link
          to="/admin/users/create"
          className="rounded bg-primary px-4 py-2 text-sm hover:bg-primary-hover"
        >
          + Thêm người dùng
        </Link>
      </div>

      <input
        type="search"
        aria-label="Tìm người dùng"
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(1);
        }}
        placeholder="Tìm theo tên, tài khoản, email..."
        className="mb-4 w-full max-w-sm rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      />

      {deleteMutation.isError && (
        <p role="alert" className="mb-4 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
          {deleteMutation.error instanceof Error ? deleteMutation.error.message : 'Không thể xóa người dùng.'}
        </p>
      )}

      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="px-4 py-3">Họ tên</th>
              <th className="px-4 py-3">Tài khoản</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Vai trò</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {data?.data.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{u.fullName}</td>
                <td className="px-4 py-3 text-text-muted">{u.username}</td>
                <td className="px-4 py-3 text-text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      u.role === 'ADMIN'
                        ? 'bg-primary/20 text-primary'
                        : 'bg-surface-alt text-text-muted'
                    }`}
                  >
                    {u.role === 'ADMIN' ? 'Quản trị' : 'Khách hàng'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-primary">
                    <Link to={`/admin/users/${u.id}/edit`} className="hover:underline">
                      Sửa
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: u.id, name: u.fullName })}
                      className="hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  Không tìm thấy người dùng.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pageSize={PAGE_SIZE}
        total={data?.meta.total ?? 0}
        onPageChange={setPage}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa người dùng"
        description={`Bạn có chắc muốn xóa "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
