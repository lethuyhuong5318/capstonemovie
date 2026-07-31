import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { fetchSeatsByShowtime, fetchShowtimeDetail } from '@/services/showtimeService';
import { confirmBooking, SeatConflictError } from '@/services/bookingService';
import { fetchCombos } from '@/services/concessionService';
import { processPayment, paymentMethodLabel } from '@/services/paymentService';
import { useAuthStore } from '@/store/authStore';
import SeatMap from '@/components/booking/SeatMap';
import BookingSummary from '@/components/booking/BookingSummary';
import ComboSelector from '@/components/booking/ComboSelector';
import ProgressSteps from '@/components/booking/ProgressSteps';
import PaymentMethodSelector from '@/components/booking/PaymentMethodSelector';
import { useCountdown } from '@/hooks/useCountdown';
import { formatCurrency } from '@/utils/format';
import type { Booking, PaymentMethod, Seat } from '@/types';

const HOLD_SECONDS = 5 * 60;

type Step = 'seats' | 'payment' | 'success';

export default function BookingPage() {
  const { showtimeId } = useParams();
  const id = Number(showtimeId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [step, setStep] = useState<Step>('seats');
  const [selected, setSelected] = useState<Seat[]>([]);
  const [comboQuantities, setComboQuantities] = useState<Record<number, number>>({});
  const [method, setMethod] = useState<PaymentMethod>('CARD');
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  const { data: showtime } = useQuery({
    queryKey: ['showtime-detail', id],
    queryFn: () => fetchShowtimeDetail(id),
    enabled: Number.isFinite(id),
  });

  const { data: seats, isLoading } = useQuery({
    queryKey: ['seats', id],
    queryFn: () => fetchSeatsByShowtime(id),
    enabled: Number.isFinite(id),
  });

  const { data: combos } = useQuery({
    queryKey: ['combos'],
    queryFn: fetchCombos,
  });

  const { label: holdLabel, remaining } = useCountdown(HOLD_SECONDS, selected.length > 0);

  const paymentMutation = useMutation({
    mutationFn: async () => {
      const result = await processPayment(method);
      if (result.status === 'FAILED') {
        throw new PaymentFailedError(result.transactionCode);
      }
      return confirmBooking({
        userId: user!.id,
        showtimeId: id,
        seatCodes: selected.map((s) => s.code),
        combos: Object.entries(comboQuantities)
          .filter(([, qty]) => qty > 0)
          .map(([comboId, quantity]) => ({ comboId: Number(comboId), quantity })),
        paymentMethod: method,
        transactionCode: result.transactionCode,
      });
    },
    onSuccess: (booking) => {
      setCompletedBooking(booking);
      setStep('success');
      setSelected([]);
      setComboQuantities({});
      queryClient.invalidateQueries({ queryKey: ['seats', id] });
    },
  });

  function toggleSeat(seat: Seat) {
    setSelected((prev) =>
      prev.some((s) => s.code === seat.code)
        ? prev.filter((s) => s.code !== seat.code)
        : [...prev, seat],
    );
  }

  function setComboQuantity(comboId: number, quantity: number) {
    setComboQuantities((prev) => ({ ...prev, [comboId]: quantity }));
  }

  const comboTotal = (combos ?? []).reduce(
    (sum, c) => sum + c.price * (comboQuantities[c.id] ?? 0),
    0,
  );
  const grandTotal = selected.reduce((s, x) => s + x.price, 0) + comboTotal;

  if (step === 'success' && completedBooking) {
    return (
      <div className="container-app flex max-w-md flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
          <CheckCircle2 size={32} aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-2xl font-semibold">Đặt vé thành công!</h1>
        <p className="mb-1 text-text-muted">
          Mã vé: <strong className="text-text">{completedBooking.code}</strong>
        </p>
        <p className="mb-1 text-text-muted">
          Phim: <strong className="text-text">{showtime?.movieName}</strong>
        </p>
        <p className="mb-1 text-text-muted">
          Suất: {showtime?.time} · {showtime?.date}
        </p>
        <p className="mb-6 text-text-muted">
          {paymentMethodLabel[completedBooking.paymentMethod]} · Mã GD:{' '}
          <span className="text-text">{completedBooking.transactionCode}</span>
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
      : paymentMutation.error instanceof SeatConflictError
        ? paymentMutation.error.message
        : 'Đã có lỗi xảy ra. Vui lòng thử lại.'
    : null;

  if (step === 'payment') {
    return (
      <div className="container-app max-w-3xl py-6">
        <div className="mb-6">
          <ProgressSteps current={3} />
        </div>

        <button
          type="button"
          onClick={() => setStep('seats')}
          disabled={paymentMutation.isPending}
          className="mb-4 text-sm text-text-muted hover:text-text disabled:opacity-40"
        >
          ← Quay lại chọn ghế
        </button>

        <h1 className="mb-6 text-2xl font-semibold">Thanh toán</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <p className="mb-3 text-sm font-medium text-text-muted">Chọn phương thức thanh toán</p>
            <PaymentMethodSelector value={method} onChange={setMethod} disabled={paymentMutation.isPending} />

            {errorMessage && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
                <XCircle size={16} />
                {errorMessage}
              </div>
            )}
          </div>

          <div>
            <BookingSummary
              showtime={showtime}
              selectedSeats={selected}
              combos={combos}
              comboQuantities={comboQuantities}
              confirmDisabled={paymentMutation.isPending}
              confirmLabel={
                paymentMutation.isPending
                  ? 'Đang xử lý thanh toán...'
                  : errorMessage
                    ? 'Thử lại'
                    : `Thanh toán ${formatCurrency(grandTotal)}`
              }
              onConfirm={() => paymentMutation.mutate()}
            />
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
      {showtime && (
        <p className="mt-1 text-sm text-text-muted">
          {showtime.movieName} · {showtime.cinemaSystemName} — {showtime.cinemaName} · {showtime.date}{' '}
          {showtime.time}
        </p>
      )}

      {selected.length > 0 && remaining <= 60 && (
        <div className="mt-4 flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle size={16} />
          Ghế của bạn sẽ được giải phóng sau <span className="tabular-nums">{holdLabel}</span> nếu chưa xác nhận.
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-8">
          {isLoading ? (
            <p className="text-text-muted">Đang tải sơ đồ ghế...</p>
          ) : (
            <SeatMap seats={seats ?? []} selectedCodes={selected.map((s) => s.code)} onToggle={toggleSeat} />
          )}

          {combos && (
            <ComboSelector combos={combos} quantities={comboQuantities} onChange={setComboQuantity} />
          )}
        </div>

        <div className="hidden lg:block lg:sticky lg:top-20 lg:self-start">
          <BookingSummary
            showtime={showtime}
            selectedSeats={selected}
            combos={combos}
            comboQuantities={comboQuantities}
            confirmDisabled={selected.length === 0}
            confirmLabel="Tiếp tục thanh toán"
            onConfirm={() => setStep('payment')}
          />
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

class PaymentFailedError extends Error {
  transactionCode: string;
  constructor(transactionCode: string) {
    super('Payment failed');
    this.transactionCode = transactionCode;
  }
}
