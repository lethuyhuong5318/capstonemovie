import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Popcorn, Printer, Share2 } from 'lucide-react';
import { fetchBookingById } from '@/services/bookingService';
import { paymentMethodLabel } from '@/services/paymentService';
import { formatCurrency, formatFullDate } from '@/utils/format';
import type { FnbStatus } from '@/types';

const statusLabel: Record<string, string> = {
  UPCOMING: 'Sắp xem',
  WATCHED: 'Đã xem',
  CANCELLED: 'Đã hủy',
};

const fnbStatusStyle: Record<FnbStatus, string> = {
  NOT_REDEEMED: 'bg-warning/20 text-warning',
  REDEEMED: 'bg-success/20 text-success',
  CANCELLED: 'bg-error/20 text-error',
};

const fnbStatusLabel: Record<FnbStatus, string> = {
  NOT_REDEEMED: 'Chưa nhận',
  REDEEMED: 'Đã nhận',
  CANCELLED: 'Đã hủy',
};

export default function TicketDetailPage() {
  const { bookingId } = useParams();
  const id = Number(bookingId);
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => fetchBookingById(id),
    enabled: Number.isFinite(id),
  });

  if (isLoading) return <div className="container-app py-8 text-text-muted">Đang tải...</div>;
  if (!booking) return <div className="container-app py-8">Không tìm thấy vé.</div>;

  function handleDownload() {
    if (!booking) return;
    const lines = [
      `CineWave — Vé điện tử`,
      `Mã đặt vé: ${booking.code}`,
      `Phim: ${booking.movieName}`,
      `Rạp: ${booking.cinemaSystemName} — ${booking.cinemaName}`,
      booking.showtime ? `Ngày giờ: ${formatFullDate(booking.showtime.date)} · ${booking.showtime.time}` : '',
      `Ghế: ${booking.seatCodes.join(', ')}`,
      `Thanh toán: ${paymentMethodLabel[booking.paymentMethod]} (${booking.transactionCode})`,
      ...(booking.combos.length
        ? ['Bắp nước:', ...booking.combos.map((c) => `  - ${c.name} x${c.quantity}`)]
        : []),
      booking.fnbCode ? `Mã nhận combo: ${booking.fnbCode}` : '',
      `Tổng tiền: ${formatCurrency(booking.total)}`,
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ve-${booking.code}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (!booking) return;
    const shareText = `Vé xem phim ${booking.movieName} — mã ${booking.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Vé CineWave', text: shareText, url: window.location.href });
      } catch {
        // người dùng hủy chia sẻ
      }
    } else {
      await navigator.clipboard.writeText(`${shareText} — ${window.location.href}`);
      setFeedback('Đã sao chép thông tin vé vào bộ nhớ tạm.');
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  return (
    <div className="container-app max-w-lg py-8">
      <Link to="/profile" className="text-sm text-text-muted hover:text-text">
        ← Quay lại vé của tôi
      </Link>

      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="bg-primary p-4 text-center">
          <p className="text-xs uppercase tracking-wide text-white/80">Mã đặt vé</p>
          <p className="text-2xl font-bold">{booking.code}</p>
        </div>

        <div className="flex flex-col items-center gap-3 border-b border-dashed border-border p-6">
          <QrPlaceholder />
          <span
            className={`rounded px-2 py-0.5 text-xs font-medium ${
              booking.status === 'UPCOMING'
                ? 'bg-primary/20 text-primary'
                : booking.status === 'WATCHED'
                  ? 'bg-success/20 text-success'
                  : 'bg-error/20 text-error'
            }`}
          >
            {statusLabel[booking.status]}
          </span>
        </div>

        <div className="flex flex-col gap-2 p-6 text-sm">
          <Row label="Phim" value={booking.movieName} />
          <Row label="Rạp" value={`${booking.cinemaSystemName} — ${booking.cinemaName}`} />
          <Row
            label="Ngày giờ"
            value={booking.showtime ? `${formatFullDate(booking.showtime.date)} · ${booking.showtime.time}` : ''}
          />
          <Row label="Ghế" value={booking.seatCodes.join(', ')} />
          <Row label="Thanh toán" value={`${paymentMethodLabel[booking.paymentMethod]} · Đã thanh toán`} />
          <Row label="Mã giao dịch" value={booking.transactionCode} />
          <Row label="Tổng tiền" value={formatCurrency(booking.total)} strong />
        </div>

        {booking.combos.length > 0 && (
          <div className="border-t border-border p-6">
            <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-text-muted">
              <Popcorn size={14} /> Bắp nước & combo
            </p>
            <ul className="flex flex-col gap-1.5 text-sm">
              {booking.combos.map((c) => (
                <li key={c.comboId} className="flex justify-between">
                  <span>
                    {c.name} <span className="text-text-muted">x{c.quantity}</span>
                  </span>
                  <span>{formatCurrency(c.unitPrice * c.quantity)}</span>
                </li>
              ))}
            </ul>

            {booking.fnbCode && (
              <div className="mt-4 flex items-center justify-between rounded-md border border-border bg-surface-elevated px-3 py-2.5">
                <div>
                  <p className="text-xs text-text-muted">Mã nhận combo</p>
                  <p className="font-mono text-sm font-semibold">{booking.fnbCode}</p>
                </div>
                <span
                  className={`rounded px-2 py-0.5 text-xs font-medium ${fnbStatusStyle[booking.fnbStatus ?? 'NOT_REDEEMED']}`}
                >
                  {fnbStatusLabel[booking.fnbStatus ?? 'NOT_REDEEMED']}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 border-t border-border p-4">
          <ActionButton icon={Download} label="Tải vé" onClick={handleDownload} />
          <ActionButton icon={Printer} label="In vé" onClick={() => window.print()} />
          <ActionButton icon={Share2} label="Chia sẻ" onClick={handleShare} />
        </div>
        {feedback && <p className="px-4 pb-4 text-xs text-text-muted">{feedback}</p>}
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Download;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-elevated py-2 text-xs font-medium hover:bg-border"
    >
      <Icon size={14} /> {label}
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-border/60 pb-2">
      <span className="text-text-muted">{label}</span>
      <span className={strong ? 'font-bold text-primary' : ''}>{value}</span>
    </div>
  );
}

function QrPlaceholder() {
  const cells = Array.from({ length: 49 }, (_, i) => (i * 7 + (i % 5)) % 3 === 0);
  return (
    <div className="grid h-32 w-32 grid-cols-7 gap-0.5 rounded bg-white p-2">
      {cells.map((filled, i) => (
        <span key={i} className={filled ? 'bg-bg' : 'bg-white'} />
      ))}
    </div>
  );
}
