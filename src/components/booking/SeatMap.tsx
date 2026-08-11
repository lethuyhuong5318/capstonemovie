import { useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { TicketSeat } from '@/services/ticketApiService';

const SEATS_PER_ROW = 10;

interface Props {
  seats: TicketSeat[];
  selectedIds: number[];
  onToggle: (seat: TicketSeat) => void;
}

/** The API returns a flat, sequentially numbered list — lay it out as rows of 10. */
function groupByRow(seats: TicketSeat[]) {
  const rows = new Map<string, TicketSeat[]>();
  seats.forEach((seat, index) => {
    const rowLetter = String.fromCharCode(65 + Math.floor(index / SEATS_PER_ROW));
    const arr = rows.get(rowLetter) ?? [];
    arr.push(seat);
    rows.set(rowLetter, arr);
  });
  return Array.from(rows.entries());
}

function seatClass(seat: TicketSeat, isSelected: boolean) {
  const base =
    'flex h-7 w-7 items-center justify-center rounded-t-md rounded-b-sm text-[10px] font-semibold transition';

  if (seat.bookedByMe) return `${base} cursor-not-allowed bg-success/40 text-white`;
  if (seat.booked) return `${base} cursor-not-allowed bg-white/5 text-text-muted/40`;
  if (isSelected) return `${base} scale-110 bg-primary text-white shadow-lg shadow-primary/30`;
  if (seat.type === 'VIP') return `${base} bg-accent/25 text-accent hover:bg-accent/40`;
  return `${base} bg-surface-elevated hover:bg-white/10`;
}

function pinchDistance(touches: React.TouchList) {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export default function SeatMap({ seats, selectedIds, onToggle }: Props) {
  const rows = groupByRow(seats);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pinchRef = useRef<{ dist: number; scale: number } | null>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  function clampScale(v: number) {
    return Math.min(2.4, Math.max(1, v));
  }

  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length === 2) {
      pinchRef.current = { dist: pinchDistance(e.touches), scale };
    } else if (e.touches.length === 1) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, ox: offset.x, oy: offset.y };
    }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (e.touches.length === 2 && pinchRef.current) {
      const newDist = pinchDistance(e.touches);
      setScale(clampScale(pinchRef.current.scale * (newDist / pinchRef.current.dist)));
    } else if (e.touches.length === 1 && dragRef.current && scale > 1) {
      const dx = e.touches[0].clientX - dragRef.current.x;
      const dy = e.touches[0].clientY - dragRef.current.y;
      setOffset({ x: dragRef.current.ox + dx, y: dragRef.current.oy + dy });
    }
  }
  function onTouchEnd() {
    pinchRef.current = null;
    dragRef.current = null;
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div
        className="w-full max-w-2xl overflow-hidden rounded-t-[100px] border-b-2 border-primary bg-gradient-to-b from-surface-elevated to-transparent py-2.5 text-center text-xs tracking-[0.3em] text-text-muted"
        style={{ boxShadow: '0 12px 24px -12px rgba(230,57,70,0.45)' }}
      >
        MÀN HÌNH
      </div>

      <div className="relative w-full max-w-2xl touch-none overflow-hidden rounded-lg border border-border bg-surface/40 p-4 sm:overflow-visible sm:border-0 sm:bg-transparent sm:p-0">
        <div
          className="flex flex-col items-center gap-2 transition-transform duration-100"
          style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {rows.map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-1.5">
              <span className="w-4 text-xs text-text-muted">{row}</span>
              <div className="flex gap-1.5">
                {rowSeats.map((seat) => {
                  const isSelected = selectedIds.includes(seat.id);
                  const disabled = seat.booked;
                  const stateLabel = seat.bookedByMe
                    ? 'bạn đã đặt'
                    : seat.booked
                      ? 'đã có người đặt'
                      : isSelected
                        ? 'đang chọn'
                        : 'còn trống';
                  return (
                    <button
                      key={seat.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => onToggle(seat)}
                      title={`Ghế ${seat.code} · ${seat.type} · ${seat.price.toLocaleString('vi-VN')}đ`}
                      aria-label={`Ghế ${seat.code}, ${seat.type === 'VIP' ? 'VIP' : 'thường'}, ${seat.price.toLocaleString('vi-VN')}đ, ${stateLabel}`}
                      aria-pressed={isSelected}
                      className={seatClass(seat, isSelected)}
                    >
                      {seat.code}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:hidden">
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s - 0.25))}
          aria-label="Thu nhỏ sơ đồ ghế"
          className="rounded-full border border-border p-2"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={() => {
            setScale(1);
            setOffset({ x: 0, y: 0 });
          }}
          aria-label="Đặt lại sơ đồ ghế"
          className="rounded-full border border-border p-2"
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s + 0.25))}
          aria-label="Phóng to sơ đồ ghế"
          className="rounded-full border border-border p-2"
        >
          <Plus size={16} />
        </button>
        <span className="text-xs text-text-muted">Chạm 2 ngón để phóng to</span>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs text-text-muted">
        <Legend swatchClass="rounded-t-md bg-surface-elevated" label="Ghế thường" />
        <Legend swatchClass="rounded-t-md bg-accent/25" label="Ghế VIP" />
        <Legend swatchClass="rounded-t-md bg-primary" label="Đang chọn" />
        <Legend swatchClass="rounded-t-md bg-white/5" label="Đã đặt" />
        <Legend swatchClass="rounded-t-md bg-success/40" label="Bạn đã đặt" />
      </div>
    </div>
  );
}

function Legend({ swatchClass, label }: { swatchClass: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-3.5 w-3.5 ${swatchClass}`} />
      {label}
    </div>
  );
}
