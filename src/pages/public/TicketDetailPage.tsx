import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Download, Printer, Share2 } from 'lucide-react';
import QRCode from 'qrcode';
import { fetchMyTickets } from '@/services/ticketApiService';
import { formatCurrency } from '@/utils/format';

export default function TicketDetailPage() {
  const { bookingId } = useParams();
  const id = Number(bookingId);
  const { data: tickets = [], isLoading, isError } = useQuery({
    queryKey: ['my-tickets'],
    queryFn: fetchMyTickets,
  });
  const ticket = tickets.find((item) => item.id === id);
  const qrPayload = ticket
    ? JSON.stringify({ ticketId: ticket.id, movie: ticket.movieName, seats: ticket.seatCodes })
    : '';
  const { data: qrCode } = useQuery({
    queryKey: ['ticket-qr', ticket?.id],
    queryFn: () => QRCode.toDataURL(qrPayload, { width: 224, margin: 2, errorCorrectionLevel: 'M' }),
    enabled: !!ticket,
    staleTime: Infinity,
  });

  if (isLoading) return <div className="container-app py-8 text-text-muted">Đang tải vé...</div>;
  if (isError) return <div className="container-app py-8 text-error">Không tải được thông tin vé.</div>;
  if (!Number.isFinite(id) || !ticket) {
    return (
      <div className="container-app py-8">
        <p>Không tìm thấy vé trong tài khoản của bạn.</p>
        <Link to="/profile" className="mt-3 inline-block text-sm text-primary hover:underline">Về vé của tôi</Link>
      </div>
    );
  }

  const bookedAt = new Date(ticket.bookedAt);
  const bookedAtLabel = Number.isNaN(bookedAt.getTime())
    ? ticket.bookedAt
    : bookedAt.toLocaleString('vi-VN');

  function ticketText() {
    return [
      'CineWave — Vé điện tử',
      `Mã vé: ${ticket!.id}`,
      `Phim: ${ticket!.movieName}`,
      `Rạp: ${ticket!.cinemaName} — ${ticket!.roomName}`,
      `Ghế: ${ticket!.seatCodes.join(', ')}`,
      `Đặt lúc: ${bookedAtLabel}`,
      `Tổng tiền: ${formatCurrency(ticket!.total)}`,
    ].join('\n');
  }

  function handleDownload() {
    const blob = new Blob([ticketText()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ve-${ticket!.id}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function handleShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Vé ${ticket!.movieName}`, text: ticketText() });
      } catch {
      }
      return;
    }
    await navigator.clipboard.writeText(ticketText());
  }

  return (
    <div className="container-app max-w-lg py-8">
      <Link to="/profile" className="text-sm text-text-muted hover:text-text">← Quay lại vé của tôi</Link>
      <div className="mt-4 overflow-hidden rounded-lg border border-border bg-surface">
        <div className="bg-primary p-4 text-center text-white">
          <p className="text-xs uppercase tracking-wide text-white/80">Mã vé</p>
          <p className="text-2xl font-bold">{ticket.id}</p>
        </div>
        <div className="flex flex-col items-center gap-2 border-b border-dashed border-border p-6">
          {qrCode ? (
            <img src={qrCode} alt={`Mã QR vé ${ticket.id}`} className="h-48 w-48 rounded-lg bg-white p-2" />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-white text-xs text-bg">
              Đang tạo mã QR...
            </div>
          )}
          <p className="text-xs text-text-muted">Xuất trình mã này tại quầy soát vé</p>
        </div>
        <div className="flex flex-col gap-3 p-6 text-sm">
          <Row label="Phim" value={ticket.movieName} />
          <Row label="Rạp" value={`${ticket.cinemaName} — ${ticket.roomName}`} />
          <Row label="Ghế" value={ticket.seatCodes.join(', ')} />
          <Row label="Đặt lúc" value={bookedAtLabel} />
          <Row label="Thời lượng" value={`${ticket.durationMinutes} phút`} />
          <Row label="Tổng tiền" value={formatCurrency(ticket.total)} strong />
        </div>
        <div className="flex gap-2 border-t border-border p-4">
          <ActionButton icon={Download} label="Tải vé" onClick={handleDownload} />
          <ActionButton icon={Printer} label="In vé" onClick={() => window.print()} />
          <ActionButton icon={Share2} label="Chia sẻ" onClick={handleShare} />
        </div>
      </div>
    </div>
  );
}

function ActionButton({ icon: Icon, label, onClick }: { icon: typeof Download; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-1 items-center justify-center gap-1.5 rounded-md bg-surface-elevated py-2 text-xs font-medium hover:bg-border">
      <Icon size={14} /> {label}
    </button>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <span className="shrink-0 text-text-muted">{label}</span>
      <span className={`text-right ${strong ? 'font-bold text-primary' : ''}`}>{value}</span>
    </div>
  );
}
