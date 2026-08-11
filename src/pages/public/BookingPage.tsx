import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, Clock3, MapPin, XCircle } from 'lucide-react';
import {
  fetchTicketRoom,
  bookTickets,
  SeatConflictError,
  type TicketSeat,
} from '@/services/ticketApiService';
import { processPayment, paymentMethodLabel } from '@/services/paymentService';
import { saveAdminBooking } from '@/services/adminBookingService';
import { useAuthStore } from '@/store/authStore';
import SeatMap from '@/components/booking/SeatMap';
import ProgressSteps from '@/components/booking/ProgressSteps';
import PaymentMethodSelector from '@/components/booking/PaymentMethodSelector';
import PaymentGateway from '@/components/booking/PaymentGateway';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCurrency } from '@/utils/format';
import type { PaymentMethod } from '@/types';

const HOLD_SECONDS = 5 * 60;

type Step = 'seats' | 'payment' | 'gateway' | 'success';

class PaymentFailedError extends Error {
  transactionCode: string;
  constructor(transactionCode: string) {
    super('Payment failed');
    this.transactionCode = transactionCode;
  }
}

export default function BookingPage() {
  const { showtimeId } = useParams();
  const id = Number(showtimeId);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  // `room.time` from the API is unreliable (see ShowtimeSelector), so prefer the
  // start time handed over by the listing when we have it.
  const startsAt = (location.state as { startsAt?: string } | null)?.startsAt;
  const showTime = startsAt ? startsAt.split('T')[1]?.slice(0, 5) : undefined;

  const [step, setStep] = useState<Step>('seats');
  const [selected, setSelected] = useState<TicketSeat[]>([]);
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [transactionCode, setTransactionCode] = useState<string | null>(null);

  const {
    data: room,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['ticket-room', id],
    queryFn: () => fetchTicketRoom(id, user?.username),
    enabled: Number.isFinite(id),
  });

  const { label: holdLabel, remaining } = useCountdown(HOLD_SECONDS, selected.length > 0);

  const grandTotal = useMemo(() => selected.reduce((sum, s) => sum + s.price, 0), [selected]);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      if (!room) throw new Error('Thông tin suất chiếu chưa sẵn sàng. Vui lòng thử lại.');
      const result = await processPayment(method);
      if (result.status === 'FAILED') throw new PaymentFailedError(result.transactionCode);

      await bookTickets({
        showtimeId: id,
        seats: selected.map((s) => ({ id: s.id, price: s.price })),
      });
      saveAdminBooking({
        id: `${id}-${result.transactionCode}`,
        transactionCode: result.transactionCode,
        customerUsername: user?.username ?? 'guest',
        customerName: user?.fullName ?? 'Khách hàng',
        movieName: room.movieName,
        cinemaName: room.cinemaName,
        roomName: room.roomName,
        showtimeId: id,
        showtimeDate: room.date,
        showtimeTime: showTime ?? room.time,
        seatCodes: selected.map((seat) => seat.code),
        total: grandTotal,
        paymentMethod: method,
        status: 'PAID',
        createdAt: new Date().toISOString(),
      });
      return result.transactionCode;
    },
    onSuccess: (code) => {
      setTransactionCode(code);
      setStep('success');
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['ticket-room', id] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['admin-bookings'] });
    },
    onError: (error) => {
      setStep('payment');
      if (error instanceof SeatConflictError) {
        // Someone else took the seat mid-flow — pull a fresh map and drop the stale picks.
        setSelected([]);
        queryClient.invalidateQueries({ queryKey: ['ticket-room', id] });
      }
    },
  });

  function toggleSeat(seat: TicketSeat) {
    setSelected((prev) =>
      prev.some((s) => s.id === seat.id)
        ? prev.filter((s) => s.id !== seat.id)
        : [...prev, seat],
    );
  }

  if (isLoading) {
    return <div className="container-app py-8 text-text-muted">Đang tải sơ đồ ghế...</div>;
  }

  if (isError || !room) {
    return (
      <div className="container-app py-8">
        <p className="mb-4 text-error">Không tải được thông tin suất chiếu này.</p>
        <Link to="/" className="text-primary hover:underline">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="container-app flex max-w-md flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Đặt vé thành công!</h1>
        <p className="mb-1 text-text-muted">
          Phim: <strong className="text-text">{room.movieName}</strong>
        </p>
        <p className="mb-1 text-text-muted">
          {room.cinemaName} · {room.roomName}
        </p>
        <p className="mb-1 text-text-muted">
          Suất: {room.date}{showTime ? ` · ${showTime}` : ''}
        </p>
        <p className="mb-6 text-text-muted">
          {paymentMethodLabel[method]} · Mã GD: <span className="text-text">{transactionCode}</span>
        </p>
        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="rounded-md bg-surface-elevated px-4 py-2 text-sm hover:text-text"
          >
            Xem vé của tôi
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary-hover"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  const errorMessage = paymentMutation.isError
    ? paymentMutation.error instanceof PaymentFailedError
      ? `Thanh toán thất bại (mã GD ${paymentMutation.error.transactionCode}). Vui lòng thử lại.`
      : paymentMutation.error instanceof Error
        ? paymentMutation.error.message
        : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
    : null;

  const summary = (
    <div className="cinema-panel overflow-hidden rounded-xl p-5 sm:p-6">
      <h2 className="border-b border-white/10 pb-4 text-xl font-bold uppercase tracking-tight">Vé của bạn</h2>
      <div className="mt-5 flex gap-4">
        <img src={room.posterUrl} alt={`Poster ${room.movieName}`} width={76} height={112} className="h-28 w-[76px] shrink-0 rounded-md object-cover" />
        <div className="min-w-0">
          <p className="line-clamp-2 text-lg font-bold leading-snug">{room.movieName}</p>
          <span className="mt-2 inline-flex rounded bg-white/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">2D Digital</span>
        </div>
      </div>

      <div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm text-text-muted">
        <div className="flex items-start gap-3"><MapPin size={18} className="mt-0.5 shrink-0 text-primary" /><span>{room.cinemaName}<br /><span className="text-text">{room.roomName}</span></span></div>
        <div className="flex items-start gap-3"><CalendarDays size={18} className="mt-0.5 shrink-0 text-primary" /><span>{room.date}</span></div>
        {showTime && <div className="flex items-center gap-3"><Clock3 size={18} className="shrink-0 text-primary" /><span>{showTime}</span></div>}
      </div>

      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-muted">Ghế đã chọn</p>
      {selected.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">Chưa chọn ghế nào</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2 text-sm">
          {selected.map((s) => (
            <li key={s.id} className="flex justify-between">
              <span>
                {s.code} <span className="text-text-muted">({s.type === 'VIP' ? 'VIP' : 'Thường'})</span>
              </span>
              <span>{formatCurrency(s.price)}</span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-5">
        <span className="text-sm text-text-muted">Tổng cộng</span>
        <span className="text-2xl font-extrabold tabular-nums text-text">{formatCurrency(grandTotal)}</span>
      </div>
    </div>
  );

  if (step === 'gateway') {
    return (
      <div className="container-app max-w-3xl py-6">
        <div className="mb-6">
          <ProgressSteps current={3} />
        </div>
        <h1 className="mb-6 text-2xl font-semibold">Thanh toán</h1>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <PaymentGateway
            method={method}
            amount={grandTotal}
            orderCode={`ORD${id}`}
            pending={paymentMutation.isPending}
            onCancel={() => setStep('payment')}
            onConfirm={() => paymentMutation.mutate()}
          />
          <div>{summary}</div>
        </div>
      </div>
    );
  }

  if (step === 'payment') {
    return (
      <div className="container-app max-w-3xl py-6">
        <div className="mb-6">
          <ProgressSteps current={3} />
        </div>

        <button
          type="button"
          onClick={() => setStep('seats')}
          className="mb-4 text-sm text-text-muted hover:text-text"
        >
          ← Quay lại chọn ghế
        </button>

        <h1 className="mb-6 text-2xl font-semibold">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="mb-3 text-sm font-medium text-text-muted">Chọn phương thức thanh toán</p>
            <PaymentMethodSelector value={method} onChange={setMethod} />

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                <XCircle size={16} />
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            {summary}
            <button
              type="button"
              onClick={() => setStep('gateway')}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary-hover"
            >
              {errorMessage ? 'Thử lại' : `Thanh toán ${formatCurrency(grandTotal)}`}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app pb-28 pt-8 lg:pb-16">
      <div className="mx-auto mb-10 max-w-3xl" data-scroll-reveal>
        <ProgressSteps current={2} />
      </div>

      <header className="mb-10 text-center" data-scroll-reveal>
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Chọn vị trí hoàn hảo</p>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{room.movieName}</h1>
        <p className="mx-auto mt-3 flex max-w-2xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-text-muted">
          <span>{room.cinemaName}</span><span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/20" />
          <span>{room.roomName}</span><span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/20" />
          <span className="text-text">{room.date} {showTime ?? ''}</span>
        </p>
      </header>

      {selected.length > 0 && remaining <= 60 && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle size={16} />
          Ghế của bạn sẽ được giải phóng sau <span className="tabular-nums">{holdLabel}</span> nếu chưa xác nhận.
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="cinema-panel rounded-xl px-3 py-8 sm:px-7 sm:py-10" data-scroll-reveal>
          <SeatMap seats={room.seats} selectedIds={selected.map((s) => s.id)} onToggle={toggleSeat} />
        </section>

        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" data-scroll-reveal>
          <div className="flex flex-col gap-3">
            {summary}
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setStep('payment')}
              className="flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-4 py-3 text-sm font-bold uppercase tracking-wide transition hover:bg-primary-hover disabled:opacity-40"
            >
              Tiếp tục <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </aside>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between border-t border-border bg-surface px-4 py-3 lg:hidden">
        <div>
          <p className="text-xs text-text-muted">{selected.length} ghế đã chọn</p>
          <p className="font-semibold tabular-nums">{formatCurrency(grandTotal)}</p>
        </div>
        <button
          type="button"
          disabled={selected.length === 0}
          onClick={() => setStep('payment')}
        className="flex min-h-11 items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:opacity-40"
      >
          Tiếp tục <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
