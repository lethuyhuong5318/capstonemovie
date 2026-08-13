import type { PaymentMethod } from '@/types';

export const paymentMethodLabel: Record<PaymentMethod, string> = {
  CARD: 'Thẻ ngân hàng',
  BANK_TRANSFER: 'Chuyển khoản',
  EWALLET: 'Ví điện tử',
  QR: 'Quét mã QR',
};
