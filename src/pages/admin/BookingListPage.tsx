import { bookings } from '@/mocks/bookings';
import { showtimes } from '@/mocks/showtimes';
import { movies } from '@/mocks/movies';
import { users } from '@/mocks/users';
import { formatCurrency } from '@/utils/format';

export default function BookingListPage() {
  const rows = [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Quản lý đơn đặt vé</h1>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="px-4 py-3">Mã vé</th>
              <th className="px-4 py-3">Khách hàng</th>
              <th className="px-4 py-3">Phim</th>
              <th className="px-4 py-3">Ghế</th>
              <th className="px-4 py-3">Tổng tiền</th>
              <th className="px-4 py-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((b) => {
              const showtime = showtimes.find((s) => s.id === b.showtimeId);
              const movie = movies.find((m) => m.id === showtime?.movieId);
              const customer = users.find((u) => u.id === b.userId);
              return (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{b.code}</td>
                  <td className="px-4 py-3 text-text-muted">{customer?.fullName}</td>
                  <td className="px-4 py-3">{movie?.name}</td>
                  <td className="px-4 py-3 text-text-muted">{b.seatCodes.join(', ')}</td>
                  <td className="px-4 py-3">{formatCurrency(b.total)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-surface-elevated px-2 py-0.5 text-xs">{b.status}</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-text-muted">
                  Chưa có đơn đặt vé nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
