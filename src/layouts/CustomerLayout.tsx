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

  useEffect(() => {
    const main = mainRef.current;
    if (!main || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );

    const reveal = () => {
      main.querySelectorAll('h1, section, article, [data-scroll-reveal]').forEach((element) => {
        if (!element.classList.contains('scroll-reveal')) {
          element.classList.add('scroll-reveal');
          observer.observe(element);
        }
      });
    };

    reveal();
    const mutationObserver = new MutationObserver(reveal);
    mutationObserver.observe(main, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
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
