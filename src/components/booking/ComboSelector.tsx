import { Minus, Plus, Popcorn } from 'lucide-react';
import type { Combo } from '@/types';
import { formatCurrency } from '@/utils/format';

interface Props {
  combos: Combo[];
  quantities: Record<number, number>;
  onChange: (comboId: number, quantity: number) => void;
}

export default function ComboSelector({ combos, quantities, onChange }: Props) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Popcorn size={18} className="text-accent" />
        <h3 className="font-semibold">Bắp nước & combo</h3>
        <span className="text-xs text-text-muted">(không bắt buộc)</span>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {combos.map((combo) => {
          const qty = quantities[combo.id] ?? 0;
          return (
            <div key={combo.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{combo.name}</p>
                <p className="text-xs text-text-muted">{combo.description}</p>
                <p className="mt-0.5 text-xs font-semibold text-primary">{formatCurrency(combo.price)}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={qty === 0}
                  onClick={() => onChange(combo.id, Math.max(0, qty - 1))}
                  aria-label={`Giảm số lượng ${combo.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border disabled:opacity-30"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm tabular-nums">{qty}</span>
                <button
                  type="button"
                  onClick={() => onChange(combo.id, qty + 1)}
                  aria-label={`Tăng số lượng ${combo.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-border hover:border-primary"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
