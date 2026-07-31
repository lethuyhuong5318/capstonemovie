import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="container-app flex flex-col items-center py-24 text-center">
      <Compass size={40} className="mb-4 text-primary" />
      <h1 className="text-3xl font-bold">404</h1>
      <p className="mt-2 text-text-muted">Trang bạn tìm không tồn tại hoặc đã bị di chuyển.</p>
      <Link to="/" className="mt-6 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold hover:bg-primary-hover">
        Về trang chủ
      </Link>
    </div>
  );
}
