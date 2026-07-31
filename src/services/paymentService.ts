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
  const result = await delay(null, 1200);
  void result;
  const isSuccess = Math.random() > 0.15;
  return {
    status: isSuccess ? 'PAID' : 'FAILED',
    transactionCode: nextTransactionCode(),
  };
}

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CARD: 'Thẻ ngân hàng',
  BANK_TRANSFER: 'Chuyển khoản',
  EWALLET: 'Ví điện tử',
  QR: 'Quét mã QR',
};
