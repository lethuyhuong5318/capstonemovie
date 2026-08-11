import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';

export default function CustomerLayout() {
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-bg text-text">
      <a href="#main-content" className="skip-link">
        Bỏ qua điều hướng
      </a>
      <Header />
      <main id="main-content" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
