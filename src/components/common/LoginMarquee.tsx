import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const MESSAGE = 'Đăng nhập để đặt vé xem phim · Chọn ghế trực quan · Thanh toán nhanh chóng · Nhận vé điện tử ngay';






export default function LoginMarquee() {
  const user = useAuthStore((s) => s.user);
  if (user) return null;

  return (
    <Link
      to="/login"
      className="group mb-5 flex items-center gap-3 overflow-hidden rounded-lg border border-primary/40 bg-primary/10 px-4 py-2.5 text-sm text-primary transition hover:bg-primary/15"
      aria-label="Đăng nhập để đặt vé"
    >
      <Ticket size={16} className="shrink-0" aria-hidden="true" />
      <div className="marquee-track flex-1 overflow-hidden whitespace-nowrap">
        <span className="marquee-content inline-block font-medium">
          {MESSAGE}&nbsp;&nbsp;·&nbsp;&nbsp;{MESSAGE}
        </span>
      </div>
      <span className="shrink-0 rounded-md bg-primary px-3 py-1 text-xs font-semibold text-white group-hover:bg-primary-hover">
        Đăng nhập
      </span>
    </Link>
  );
}
