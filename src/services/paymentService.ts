import { delay } from '@/services/delay';
import type { PaymentMethod } from '@/types';

export interface PaymentResult {
  status: 'PAID' | 'FAILED';
  transactionCode: string;
}

function nextTransactionCode() {
  return `TXN${Date.now().toString().slice(-8)}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function processPayment(_method: PaymentMethod): Promise<PaymentResult> {
  await delay(null, 900);
  return {
    status: 'PAID',
    transactionCode: nextTransactionCode(),
  };
}

export interface VietQrConfig {
  imageUrl: string | null;
  bankId: string;
  accountNo: string;
  accountName: string;
  transferContent: string;
}

export function createVietQrConfig(amount: number, orderCode: string): VietQrConfig {
  const bankId = (import.meta.env.VITE_VIETQR_BANK_ID ?? '').trim();
  const accountNo = (import.meta.env.VITE_VIETQR_ACCOUNT_NO ?? '').trim();
  const accountName = (import.meta.env.VITE_VIETQR_ACCOUNT_NAME ?? '').trim();
  const transferContent = `CINEWAVE ${orderCode}`.replace(/[^A-Z0-9 ]/gi, '').slice(0, 25);

  if (!bankId || !accountNo || !accountName) {
    return { imageUrl: null, bankId, accountNo, accountName, transferContent };
  }

  const query = new URLSearchParams({
    amount: String(Math.max(0, Math.round(amount))),
    addInfo: transferContent,
    accountName,
  });
  return {
    imageUrl: `https://img.vietqr.io/image/${encodeURIComponent(bankId)}-${encodeURIComponent(accountNo)}-compact2.png?${query}`,
    bankId,
    accountNo,
    accountName,
    transferContent,
  };
}

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CARD: 'Thẻ ngân hàng',
  BANK_TRANSFER: 'Chuyển khoản',
  EWALLET: 'Ví điện tử',
  QR: 'Quét mã QR',
};
