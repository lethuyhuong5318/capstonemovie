import { useQuery } from '@tanstack/react-query';
import { fetchAdminBookings } from '@/services/adminBookingService';
import { formatCurrency } from '@/utils/format';

export default function BookingListPage() {
  const { data: rows = [], isLoading, isError } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: fetchAdminBookings,
    staleTime: 0,
  });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Quản lý đơn đặt vé</h1>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        {isError && <p className="px-4 py-3 text-sm text-error">Không thể tải dữ liệu vé từ máy chủ.</p>}
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
              return (
                <tr key={b.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{b.transactionCode}</td>
                  <td className="px-4 py-3 text-text-muted">{b.customerName}<br /><span className="text-xs">{b.customerUsername}</span></td>
                  <td className="px-4 py-3">{b.movieName}</td>
                  <td className="px-4 py-3 text-text-muted">{b.seatCodes.join(', ')}</td>
                  <td className="px-4 py-3">{formatCurrency(b.total)}</td>
                  <td className="px-4 py-3">
                    <span className="rounded bg-success/15 px-2 py-0.5 text-xs text-success">Đã thanh toán</span>
                  </td>
                </tr>
              );
            })}
            {isLoading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-text-muted">Đang tải danh sách vé...</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
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
