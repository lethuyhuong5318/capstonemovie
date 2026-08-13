import { useRef, useState } from 'react';
import { Minus, Plus, RotateCcw, X } from 'lucide-react';
import type { TicketSeat } from '@/services/ticketApiService';

const SEATS_PER_ROW = 10;

interface Props {
  seats: TicketSeat[];
  selectedIds: number[];
  onToggle: (seat: TicketSeat) => void;
}


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
    'relative flex h-10 w-10 shrink-0 items-center justify-center rounded-t-md rounded-b-sm border text-[10px] font-bold transition-all duration-200 after:absolute after:-bottom-1 after:left-1 after:right-1 after:h-1 after:rounded-b after:bg-current after:opacity-20';

  if (seat.bookedByMe) return `${base} cursor-not-allowed border-success/40 bg-success/20 text-success`;
  if (seat.booked) return `${base} cursor-not-allowed border-white/5 bg-white/[0.03] text-text-muted/30`;
  if (isSelected) return `${base} -translate-y-1 scale-105 border-primary bg-primary text-white shadow-[0_8px_24px_rgba(230,57,70,.34)]`;
  if (seat.type === 'VIP') return `${base} border-accent bg-accent/5 text-accent hover:-translate-y-1 hover:bg-accent/15`;
  return `${base} border-white/20 bg-transparent text-text hover:-translate-y-1 hover:border-white/50 hover:bg-white/5`;
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
    <div className="flex w-full flex-col items-center gap-8">
      <div className="w-full max-w-3xl px-4 pt-2 text-center">
        <div className="cinema-screen" aria-hidden="true" />
        <p className="-mt-3 text-[11px] font-semibold uppercase tracking-[0.3em] text-text-muted">Màn hình</p>
      </div>

      <div className="no-scrollbar relative w-full touch-none overflow-x-auto overflow-y-hidden px-2 py-4">
        <div
          className="mx-auto flex w-max min-w-max flex-col items-center gap-3 transition-transform duration-100"
          style={{ transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)` }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {rows.map(([row, rowSeats]) => (
            <div key={row} className="flex items-center gap-3">
              <span className={`w-5 text-center text-xs font-bold ${rowSeats[0]?.type === 'VIP' ? 'text-accent' : 'text-text-muted'}`}>{row}</span>
              <div className="flex gap-2">
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
                      {seat.booked ? <X size={14} aria-hidden="true" /> : seat.code}
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
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border"
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
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border"
        >
          <RotateCcw size={16} />
        </button>
        <button
          type="button"
          onClick={() => setScale((s) => clampScale(s + 0.25))}
          aria-label="Phóng to sơ đồ ghế"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-border"
        >
          <Plus size={16} />
        </button>
        <span className="text-xs text-text-muted">Chạm 2 ngón để phóng to</span>
      </div>

      <div className="w-full border-t border-white/5 pt-6">
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-4 text-xs text-text-muted">
        <Legend swatchClass="rounded-t-md border border-white/20 bg-transparent" label="Ghế thường" />
        <Legend swatchClass="rounded-t-md border border-accent bg-accent/5" label="Ghế VIP" />
        <Legend swatchClass="rounded-t-md bg-primary" label="Đang chọn" />
        <Legend swatchClass="rounded-t-md bg-white/5" label="Đã đặt" />
        <Legend swatchClass="rounded-t-md bg-success/40" label="Bạn đã đặt" />
        </div>
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
