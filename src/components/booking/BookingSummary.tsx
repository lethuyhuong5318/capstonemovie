import { formatCurrency, formatFullDate } from '@/utils/format';
import type { Combo, Seat } from '@/types';
import type { ShowtimeDetail } from '@/services/showtimeService';

interface Props {
  showtime?: ShowtimeDetail;
  selectedSeats: Seat[];
  combos?: Combo[];
  comboQuantities?: Record<number, number>;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
}

export default function BookingSummary({
  showtime,
  selectedSeats,
  combos = [],
  comboQuantities = {},
  onConfirm,
  confirmDisabled,
  confirmLabel = 'Tiếp tục',
}: Props) {
  const seatTotal = selectedSeats.reduce((sum, s) => sum + s.price, 0);
  const selectedCombos = combos
    .map((c) => ({ combo: c, qty: comboQuantities[c.id] ?? 0 }))
    .filter((c) => c.qty > 0);
  const comboTotal = selectedCombos.reduce((sum, c) => sum + c.combo.price * c.qty, 0);
  const total = seatTotal + comboTotal;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-4">
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">Suất chiếu</p>
        <p className="mt-1 font-semibold">{showtime?.movieName}</p>
        <p className="mt-1 text-sm text-text-muted">
          {showtime?.cinemaSystemName} — {showtime?.cinemaName}
        </p>
        <p className="text-sm text-text-muted">
          {showtime && formatFullDate(showtime.date)} · {showtime?.time} · {showtime?.roomType}
        </p>
      </div>

      <div className="border-t border-border pt-3">
        <p className="text-xs uppercase tracking-wide text-text-muted">Ghế đã chọn</p>
        {selectedSeats.length === 0 ? (
          <p className="mt-1 text-sm text-text-muted">Chưa chọn ghế</p>
        ) : (
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {selectedSeats.map((s) => (
              <li key={s.code} className="flex justify-between">
                <span>
                  {s.code} <span className="text-text-muted">({s.type})</span>
                </span>
                <span className="tabular-nums">{formatCurrency(s.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedCombos.length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-xs uppercase tracking-wide text-text-muted">Bắp nước</p>
          <ul className="mt-1 flex flex-col gap-1 text-sm">
            {selectedCombos.map(({ combo, qty }) => (
              <li key={combo.id} className="flex justify-between">
                <span>
                  {combo.name} <span className="text-text-muted">x{qty}</span>
                </span>
                <span className="tabular-nums">{formatCurrency(combo.price * qty)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm text-text-muted">Tổng cộng</span>
        <span className="text-lg font-bold text-primary tabular-nums">{formatCurrency(total)}</span>
      </div>

      <button
        type="button"
        disabled={confirmDisabled}
        onClick={onConfirm}
        className="rounded-md bg-primary py-2.5 text-sm font-semibold hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-40"
      >
        {confirmLabel}
      </button>
    </div>
  );
}
