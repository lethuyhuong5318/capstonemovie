import { useQuery } from '@tanstack/react-query';
import { Clock, MapPin, Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { fetchMyTickets } from '@/services/ticketApiService';
import EmptyState from '@/components/common/EmptyState';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import { formatCurrency } from '@/utils/format';

function formatBookedAt(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  const {
    data: tickets,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: fetchMyTickets,
    enabled: !!user,
  });

  if (!user) return null;

  return (
    <div className="container-app py-8">
      <h1 className="text-2xl font-semibold">Hồ sơ cá nhân</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-lg border border-border bg-surface p-5 sm:grid-cols-2">
        <Field label="Họ tên" value={user.fullName} />
        <Field label="Tài khoản" value={user.username} />
        <Field label="Email" value={user.email} />
        <Field label="Số điện thoại" value={user.phone || '—'} />
      </div>

      <h2 className="mb-4 mt-8 text-xl font-semibold">Vé của tôi</h2>

      {isLoading ? (
        <p className="text-text-muted">Đang tải vé...</p>
      ) : isError ? (
        <p className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-sm text-error">
          Không tải được lịch sử vé. Vui lòng thử lại sau.
        </p>
      ) : tickets && tickets.length > 0 ? (
        <div className="flex flex-col gap-3">
          {tickets.map((t) => (
            <div key={t.id} className="flex gap-4 rounded-lg border border-border bg-surface p-4">
              <PosterPlaceholder
                label={t.movieName}
                src={t.posterUrl}
                className="aspect-[2/3] w-20 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-medium">{t.movieName}</p>
                  <p className="font-semibold text-primary">{formatCurrency(t.total)}</p>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                  <MapPin size={13} /> {t.cinemaName} · {t.roomName}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                  <Clock size={13} /> Đặt lúc {formatBookedAt(t.bookedAt)}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm">
                  <Ticket size={13} className="text-text-muted" />
                  <span className="text-text-muted">Ghế:</span>
                  <span className="font-medium">{t.seatCodes.join(', ')}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="Chưa có vé nào"
          description="Vé của bạn sẽ hiển thị ở đây sau khi đặt thành công."
        />
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
