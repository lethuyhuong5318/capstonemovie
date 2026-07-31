import { CreditCard, Landmark, QrCode, Wallet } from 'lucide-react';
import type { PaymentMethod } from '@/types';

const methods: { value: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { value: 'CARD', label: 'Thẻ ngân hàng', icon: CreditCard },
  { value: 'BANK_TRANSFER', label: 'Chuyển khoản', icon: Landmark },
  { value: 'EWALLET', label: 'Ví điện tử', icon: Wallet },
  { value: 'QR', label: 'Quét mã QR', icon: QrCode },
];

interface Props {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export default function PaymentMethodSelector({ value, onChange, disabled }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {methods.map((m) => {
        const active = value === m.value;
        return (
          <button
            key={m.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(m.value)}
            className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
              active
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface-elevated text-text-muted hover:border-primary/50'
            }`}
          >
            <m.icon size={22} />
            {m.label}
          </button>
        );
      })}
    </div>
  );
}
