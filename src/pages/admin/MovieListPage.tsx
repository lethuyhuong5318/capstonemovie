import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { deleteLiveMovie, fetchLiveMovies } from '@/services/movieApiService';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import Pagination from '@/components/common/Pagination';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import toast from 'react-hot-toast';

const PAGE_SIZE = 6;

export default function MovieListPage() {
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const queryClient = useQueryClient();

  const { data: movies } = useQuery({
    queryKey: ['admin-movies'],
    queryFn: () => fetchLiveMovies({ status: 'all' }),
  });

  const filtered = useMemo(() => {
    const kw = keyword.toLowerCase();
    return (movies ?? []).filter((m) => m.name.toLowerCase().includes(kw));
  }, [movies, keyword]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteLiveMovie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['live-movies'] });
      setDeleteTarget(null);
    },
    onError: (err: unknown) => {
      const message =
        (err as { response?: { data?: { content?: string } } })?.response?.data?.content ??
        'Không thể xóa phim này (có thể đã có lịch chiếu hoặc đặt vé).';
      toast.error(message);
      setDeleteTarget(null);
    },
  });

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Quản lý phim</h1>
        <Link
          to="/admin/movies/create"
          className="rounded bg-primary px-4 py-2 text-sm hover:bg-primary-hover"
        >
          + Thêm phim
        </Link>
      </div>

      <input
        value={keyword}
        onChange={(e) => {
          setKeyword(e.target.value);
          setPage(1);
        }}
        placeholder="Tìm kiếm theo tên phim..."
        className="mb-4 w-full max-w-sm rounded border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      />

      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="px-4 py-3">Poster</th>
              <th className="px-4 py-3">Tên phim</th>
              <th className="px-4 py-3">Ngày khởi chiếu</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {paged.map((movie) => (
              <tr key={movie.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3">
                  <PosterPlaceholder
                    label={movie.name}
                    src={movie.posterUrl}
                    className="h-14 w-10"
                    rounded="rounded"
                  />
                </td>
                <td className="px-4 py-3 font-medium">{movie.name}</td>
                <td className="px-4 py-3 text-text-muted">
                  {new Date(movie.releaseDate).toLocaleDateString('vi-VN')}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      movie.isShowing
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : movie.isUpcoming
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-border text-text-muted'
                    }`}
                  >
                    {movie.isShowing ? 'Đang chiếu' : movie.isUpcoming ? 'Sắp chiếu' : 'Ngừng chiếu'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-3 text-primary">
                    <Link to={`/admin/movies/${movie.id}/edit`} className="hover:underline">
                      Sửa
                    </Link>
                    <Link to={`/admin/movies/${movie.id}/showtimes`} className="hover:underline">
                      Lịch chiếu
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ id: movie.id, name: movie.name })}
                      className="hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-text-muted">
                  Không có phim nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={safePage} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa phim"
        description={`Bạn có chắc muốn xóa phim "${deleteTarget?.name}"?`}
        confirmLabel="Xóa"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
      />
    </div>
  );
}
