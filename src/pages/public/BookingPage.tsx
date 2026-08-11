import { useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
  fetchTicketRoom,
  bookTickets,
  SeatConflictError,
  type TicketSeat,
} from '@/services/ticketApiService';
import { processPayment, paymentMethodLabel } from '@/services/paymentService';
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
      const result = await processPayment(method);
      if (result.status === 'FAILED') throw new PaymentFailedError(result.transactionCode);

      await bookTickets({
        showtimeId: id,
        seats: selected.map((s) => ({ id: s.id, price: s.price })),
      });
      return result.transactionCode;
    },
    onSuccess: (code) => {
      setTransactionCode(code);
      setStep('success');
      setSelected([]);
      queryClient.invalidateQueries({ queryKey: ['ticket-room', id] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
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
    <div className="rounded-lg border border-border bg-surface p-4">
      <p className="text-xs uppercase tracking-wide text-text-muted">Suất chiếu</p>
      <p className="mt-1 font-semibold">{room.movieName}</p>
      <p className="text-sm text-text-muted">
        {room.cinemaName} — {room.roomName}
      </p>
      <p className="text-sm text-text-muted">
        {room.date}{showTime ? ` · ${showTime}` : ''}
      </p>

      <p className="mt-4 text-xs uppercase tracking-wide text-text-muted">Ghế đã chọn</p>
      {selected.length === 0 ? (
        <p className="mt-1 text-sm text-text-muted">Chưa chọn ghế nào</p>
      ) : (
        <ul className="mt-1 flex flex-col gap-1 text-sm">
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

      <div className="mt-4 flex justify-between border-t border-border pt-3">
        <span className="text-text-muted">Tổng cộng</span>
        <span className="font-bold text-primary">{formatCurrency(grandTotal)}</span>
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
    <div className="container-app pb-28 pt-6 lg:pb-6">
      <div className="mb-6 max-w-2xl">
        <ProgressSteps current={2} />
      </div>

      <h1 className="text-2xl font-semibold">Chọn ghế</h1>
      <p className="mt-1 text-sm text-text-muted">
        {room.movieName} · {room.cinemaName} — {room.roomName} · {room.date} {showTime ?? ''}
      </p>

      {selected.length > 0 && remaining <= 60 && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle size={16} />
          Ghế của bạn sẽ được giải phóng sau <span className="tabular-nums">{holdLabel}</span> nếu chưa xác nhận.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <SeatMap seats={room.seats} selectedIds={selected.map((s) => s.id)} onToggle={toggleSeat} />

        <div className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
          <div className="flex flex-col gap-3">
            {summary}
            <button
              type="button"
              disabled={selected.length === 0}
              onClick={() => setStep('payment')}
              className="rounded-md bg-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:opacity-40"
            >
              Tiếp tục thanh toán
            </button>
          </div>
        </div>
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
          className="rounded-md bg-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:opacity-40"
        >
          Tiếp tục
        </button>
      </div>
    </div>
  );
}
