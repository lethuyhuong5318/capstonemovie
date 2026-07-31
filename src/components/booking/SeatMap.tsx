import { useRef, useState } from 'react';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import type { Seat } from '@/types';

interface Props {
  seats: Seat[];
  selectedCodes: string[];
  onToggle: (seat: Seat) => void;
}

function groupByRow(seats: Seat[]) {
  const map = new Map<string, Seat[]>();
  for (const seat of seats) {
    const row = seat.code[0];
    const arr = map.get(row) ?? [];
    arr.push(seat);
    map.set(row, arr);
  }
  return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
}

function seatShapeClass(seat: Seat, isSelected: boolean, isBooked: boolean) {
  const base = 'flex h-7 w-7 items-center justify-center text-[10px] font-semibold transition';
  const shape = seat.type === 'COUPLE' ? 'rounded-md w-9' : 'rounded-t-md rounded-b-sm';

  if (isBooked) return `${base} ${shape} cursor-not-allowed bg-white/5 text-text-muted/40`;
  if (isSelected)
    return `${base} ${shape} scale-110 bg-primary text-white shadow-lg shadow-primary/30`;
  if (seat.type === 'VIP') return `${base} ${shape} bg-accent/25 text-accent hover:bg-accent/40`;
  if (seat.type === 'COUPLE')
    return `${base} ${shape} bg-fuchsia-500/25 text-fuchsia-300 hover:bg-fuchsia-500/40`;
  return `${base} ${shape} bg-surface-elevated hover:bg-white/10`;
}

function pinchDistance(touches: React.TouchList) {
  const [a, b] = [touches[0], touches[1]];
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export default function SeatMap({ seats, selectedCodes, onToggle }: Props) {
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

  function zoom(delta: number) {
    setScale((s) => clampScale(s + delta));
  }
  function reset() {
    setScale(1);
    setOffset({ x: 0, y: 0 });
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
                {rowSeats
                  .sort((a, b) => Number(a.code.slice(1)) - Number(b.code.slice(1)))
                  .map((seat) => {
                    const isSelected = selectedCodes.includes(seat.code);
                    const isBooked = seat.status === 'BOOKED';
                    return (
                      <button
                        key={seat.code}
                        type="button"
                        disabled={isBooked}
                        onClick={() => onToggle(seat)}
                        title={`${seat.code} · ${seat.type} · ${seat.price.toLocaleString('vi-VN')}đ`}
                        aria-label={`Ghế ${seat.code}, ${seat.type}, ${seat.price.toLocaleString('vi-VN')}đ${isBooked ? ', đã đặt' : isSelected ? ', đang chọn' : ', còn trống'}`}
                        aria-pressed={isSelected}
                        className={seatShapeClass(seat, isSelected, isBooked)}
                      >
                        {seat.code.slice(1)}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:hidden">
        <button type="button" onClick={() => zoom(-0.25)} className="rounded-full border border-border p-2">
          <Minus size={16} />
        </button>
        <button type="button" onClick={reset} className="rounded-full border border-border p-2">
          <RotateCcw size={16} />
        </button>
        <button type="button" onClick={() => zoom(0.25)} className="rounded-full border border-border p-2">
          <Plus size={16} />
        </button>
        <span className="text-xs text-text-muted">Chạm 2 ngón để phóng to</span>
      </div>

      <div className="flex flex-wrap justify-center gap-4 text-xs text-text-muted">
        <Legend swatchClass="rounded-t-md bg-surface-elevated" label="Ghế thường" />
        <Legend swatchClass="rounded-t-md bg-accent/25" label="Ghế VIP" />
        <Legend swatchClass="rounded-md w-5 bg-fuchsia-500/25" label="Ghế đôi" />
        <Legend swatchClass="rounded-t-md bg-primary" label="Đang chọn" />
        <Legend swatchClass="rounded-t-md bg-white/5" label="Đã đặt" />
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
