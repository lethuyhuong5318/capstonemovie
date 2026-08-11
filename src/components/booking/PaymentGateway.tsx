import { useState } from 'react';
import { CheckCircle2, Copy, Landmark, Loader2, QrCode, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/utils/format';
import type { PaymentMethod } from '@/types';
import { createVietQrConfig } from '@/services/paymentService';

const banks = ['Vietcombank', 'Techcombank', 'MB Bank', 'VIB', 'BIDV', 'ACB', 'VPBank', 'Sacombank'];

type Stage = 'redirecting' | 'select-bank' | 'otp' | 'qr';

interface Props {
  method: PaymentMethod;
  amount: number;
  orderCode: string;
  onConfirm: () => void;
  onCancel: () => void;
  pending: boolean;
}

export default function PaymentGateway({ method, amount, orderCode, onConfirm, onCancel, pending }: Props) {
  const [stage, setStage] = useState<Stage>(method === 'QR' ? 'qr' : method === 'CARD' || method === 'BANK_TRANSFER' ? 'select-bank' : 'otp');
  const [bank, setBank] = useState<string | null>(null);
  const [otp, setOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const otpValid = otp.trim().length === 6;
  const vietQr = createVietQrConfig(amount, orderCode);

  async function copyTransferContent() {
    await navigator.clipboard.writeText(vietQr.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

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

      {stage === 'qr' && (
        <div className="p-5">
          <div className="mx-auto flex max-w-md flex-col items-center text-center">
            {vietQr.imageUrl ? (
              <img
                src={vietQr.imageUrl}
                alt={`Mã VietQR thanh toán đơn ${orderCode}`}
                width={320}
                height={380}
                className="w-full max-w-[320px] rounded-lg bg-white p-2"
              />
            ) : (
              <div className="flex aspect-square w-full max-w-[260px] flex-col items-center justify-center rounded-lg border border-dashed border-primary/50 bg-primary/5 p-6">
                <QrCode size={72} className="mb-4 text-primary" aria-hidden="true" />
                <p className="font-semibold">VietQR demo chưa cấu hình tài khoản nhận tiền</p>
                <p className="mt-2 text-xs text-text-muted">Thêm thông tin VietQR trong file môi trường để hiển thị mã có thể quét.</p>
              </div>
            )}

            <p className="mt-4 text-sm text-text-muted">Nội dung chuyển khoản</p>
            <button type="button" onClick={copyTransferContent} className="mt-1 flex min-h-11 items-center gap-2 rounded-md border border-border px-4 font-mono text-sm font-semibold hover:border-primary/50">
              {vietQr.transferContent} {copied ? <CheckCircle2 size={16} className="text-success" /> : <Copy size={16} />}
            </button>
            <p className="mt-3 text-xs leading-relaxed text-warning">Chế độ demo không thể kiểm tra tiền về tự động. Chỉ bấm xác nhận sau khi đã thử luồng quét QR.</p>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onCancel} disabled={pending} className="min-h-11 rounded-md bg-surface-elevated px-4 py-2 text-sm hover:text-text disabled:opacity-40">Quay lại</button>
            <button type="button" onClick={onConfirm} disabled={pending} className="min-h-11 rounded-md bg-primary px-5 py-2 text-sm font-semibold hover:bg-primary-hover disabled:opacity-40">
              {pending ? 'Đang xác nhận...' : 'Tôi đã thanh toán (demo)'}
            </button>
          </div>
        </div>
      )}

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
