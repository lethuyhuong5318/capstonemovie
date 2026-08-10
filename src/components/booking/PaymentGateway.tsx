import { useState } from 'react';
import { Landmark, Loader2, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { PaymentMethod } from '@/types';

const banks = ['Vietcombank', 'Techcombank', 'MB Bank', 'VIB', 'BIDV', 'ACB', 'VPBank', 'Sacombank'];

type Stage = 'redirecting' | 'select-bank' | 'otp';

interface Props {
  method: PaymentMethod;
  amount: number;
  orderCode: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}

export default function PaymentGateway({ method, amount, orderCode, onConfirm, onCancel, pending }: Props) {
  const [stage, setStage] = useState<Stage>(method === 'CARD' || method === 'BANK_TRANSFER' ? 'select-bank' : 'otp');
  const [bank, setBank] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const otpValid = otp.trim().length === 6;

  if (stage === 'redirecting') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface p-10 text-center">
        <Loader2 size={28} className="animate-spin text-primary" />
        <p className="text-sm text-text-muted">Đang chuyển hướng đến cổng thanh toán...</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border bg-surface-elevated px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={16} className="text-primary" /> Cổng thanh toán an toàn (demo)
        </div>
        <span className="font-mono text-xs text-text-muted">Đơn: {orderCode}</span>
      </div>

      <div className="border-b border-border bg-surface-elevated/50 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-text-muted">Số tiền thanh toán</span>
          <span className="font-semibold text-primary">{formatCurrency(amount)}</span>
        </div>
      </div>

      {stage === 'select-bank' && (
        <div className="p-4">
          <p className="mb-3 text-sm text-text-muted">Chọn ngân hàng phát hành thẻ / tài khoản</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {banks.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setBank(b)}
                className={`flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition ${
                  bank === b
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-muted hover:border-primary/40'
                }`}
              >
                <Landmark size={18} />
                {b}
              </button>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md bg-surface-elevated px-4 py-2 text-sm hover:text-text"
            >
              Hủy giao dịch
            </button>
            <button
              type="button"
              disabled={!bank}
              onClick={() => setStage('otp')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-40"
            >
              Tiếp tục
            </button>
          </div>
        </div>
      )}

      {stage === 'otp' && (
        <div className="p-4">
          <p className="mb-1 text-sm">Nhập mã OTP đã gửi đến số điện thoại đăng ký</p>
          <p className="mb-3 text-xs text-text-muted">
            Đây là môi trường demo — nhập bất kỳ 6 chữ số nào để xác nhận (vd. 123456).
          </p>
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            placeholder="••••••"
            className="input max-w-[180px] text-center tracking-[0.4em]"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={pending}
              className="rounded-md bg-surface-elevated px-4 py-2 text-sm hover:text-text disabled:opacity-40"
            >
              Hủy giao dịch
            </button>
            <button
              type="button"
              disabled={!otpValid || pending}
              onClick={onConfirm}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-40"
            >
              {pending ? 'Đang xác nhận...' : 'Xác nhận thanh toán'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
