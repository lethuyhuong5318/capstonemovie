import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Popcorn } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fetchMyBookings } from '@/services/bookingService';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency } from '@/utils/format';
import type { BookingStatus } from '@/types';

const tabs: { key: BookingStatus; label: string }[] = [
  { key: 'UPCOMING', label: 'Sắp xem' },
  { key: 'WATCHED', label: 'Đã xem' },
  { key: 'CANCELLED', label: 'Đã hủy' },
];

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<BookingStatus>('UPCOMING');

  const { data: bookings, isLoading } = useQuery({
    queryKey: ['my-bookings', user?.id],
    queryFn: () => fetchMyBookings(user!.id),
    enabled: !!user,
  });

  const filtered = useMemo(() => (bookings ?? []).filter((b) => b.status === tab), [bookings, tab]);

  if (!user) return null;

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-semibold">Hồ sơ cá nhân</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
        <Field label="Họ tên" value={user.fullName} />
        <Field label="Tài khoản" value={user.username} />
        <Field label="Email" value={user.email} />
        <Field label="Số điện thoại" value={user.phone} />
      </div>

      <h2 className="mb-3 mt-8 text-xl font-semibold">Vé của tôi</h2>
      <div className="mb-4 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === t.key ? 'bg-primary text-white' : 'bg-surface text-text-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-text-muted">Đang tải...</p>
      ) : filtered.length > 0 ? (
        <div className="flex flex-col gap-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              to={`/tickets/${b.id}`}
              className="block rounded-lg border border-border bg-surface p-4 hover:border-primary/50"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium">{b.movieName}</p>
                <p className="font-semibold text-primary">{formatCurrency(b.total)}</p>
              </div>
              <p className="mt-1 text-sm text-text-muted">
                {b.cinemaName} · {b.showtime?.date} {b.showtime?.time}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                Mã vé: {b.code} · Ghế: {b.seatCodes.join(', ')}
                {b.combos.length > 0 && (
                  <span className="flex items-center gap-1 text-accent">
                    <Popcorn size={12} /> {b.combos.length} combo
                  </span>
                )}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="Chưa có vé nào" description="Vé của bạn sẽ hiển thị ở đây sau khi đặt thành công." />
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-text-muted">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
