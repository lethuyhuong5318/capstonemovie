import Logo from '@/components/common/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="container-app grid grid-cols-2 gap-8 py-10 text-sm text-text-muted sm:grid-cols-4">
        <div className="col-span-2 sm:col-span-1">
          <Logo className="mb-3" />
          <p className="text-xs">Đặt vé xem phim nhanh chóng, chọn ghế trực quan, trải nghiệm điện ảnh trọn vẹn.</p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-text">Khám phá</h4>
          <ul className="flex flex-col gap-2">
            <li>Phim đang chiếu</li>
            <li>Phim sắp chiếu</li>
            <li>Hệ thống rạp</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-text">Hỗ trợ</h4>
          <ul className="flex flex-col gap-2">
            <li>Trung tâm trợ giúp</li>
            <li>Chính sách đổi/hủy vé</li>
            <li>Liên hệ</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-text">Kết nối</h4>
          <ul className="flex flex-col gap-2">
            <li>hotro@cinewave.vn</li>
            <li>1900 6969</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-4 text-center text-xs text-text-muted">
        © {new Date().getFullYear()} CineWave. All rights reserved.
      </div>
    </footer>
  );
}
