import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LogOut, Menu, MapPin, Ticket, User as UserIcon, X } from 'lucide-react';
import Logo from '@/components/common/Logo';
import MovieSearchAutocomplete from '@/components/common/MovieSearchAutocomplete';
import { useAuthStore } from '@/store/authStore';
import { cities } from '@/mocks/cinemas';

const navItems = [
  { to: '/', label: 'Phim' },
  { to: '/cinemas', label: 'Rạp chiếu' },
  { to: '/schedule', label: 'Lịch chiếu' },
];

export default function Header() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [city, setCity] = useState(cities[0]);
  const [keyword, setKeyword] = useState(searchParams.get('q') ?? '');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    setKeyword(isHome ? (searchParams.get('q') ?? '') : '');
  }, [isHome, searchParams]);

  useEffect(() => {
    if (!isHome) return;
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [isHome]);

  const transparent = isHome && !scrolled;

  function handleSearch() {
    if (keyword.trim()) navigate(`/?q=${encodeURIComponent(keyword.trim())}`);
  }

  return (
    <header
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        transparent ? 'border-b border-transparent bg-transparent' : 'border-b border-border bg-bg/95 backdrop-blur'
      }`}
    >
      <div className="container-app flex items-center gap-4 py-3">
        <button
          type="button"
          className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-text-muted hover:bg-white/5 lg:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>

        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              aria-current={location.pathname === item.to ? 'page' : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-text-muted transition hover:bg-white/5 hover:text-text"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <MovieSearchAutocomplete
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleSearch}
        />

        <div className="hidden items-center gap-1 text-sm text-text-muted hover:text-text sm:flex">
          <MapPin size={16} aria-hidden="true" />
          <label htmlFor="header-city" className="sr-only">
            Khu vực
          </label>
          <select
            id="header-city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="cursor-pointer rounded bg-transparent text-sm outline-none"
          >
            {cities.map((c) => (
              <option key={c} value={c} className="bg-surface text-text">
                {c}
              </option>
            ))}
          </select>
        </div>

        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              aria-label="Tài khoản"
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              className="flex items-center gap-2 rounded-full border border-border bg-surface-elevated/80 py-1 pl-1 pr-3 text-sm hover:border-primary"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
                {user.fullName.slice(0, 1).toUpperCase()}
              </span>
              <span className="hidden max-w-[8rem] truncate sm:inline">{user.fullName}</span>
            </button>
            {profileOpen && (
              <div
                className="absolute right-0 top-12 w-48 overflow-hidden rounded-lg border border-border bg-surface shadow-xl"
                style={{ animation: 'cw-scale-in 0.15s ease' }}
                onMouseLeave={() => setProfileOpen(false)}
              >
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  <UserIcon size={15} /> Hồ sơ cá nhân
                </Link>
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-white/5"
                >
                  <Ticket size={15} /> Vé của tôi
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="flex w-full items-center gap-2 border-t border-border px-4 py-2.5 text-left text-sm text-error hover:bg-white/5"
                >
                  <LogOut size={15} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm">
            <Link to="/login" className="hidden min-h-11 items-center text-text-muted hover:text-text sm:flex">
              Đăng nhập
            </Link>
            <Link
              to="/register"
              className="flex min-h-11 items-center rounded-full bg-primary px-3 py-2 font-semibold text-white hover:bg-primary-hover sm:px-4"
            >
              Đăng ký
            </Link>
          </div>
        )}
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setDrawerOpen(false)} />
          <div
            className="absolute right-0 top-0 flex h-full w-72 flex-col gap-1 bg-surface p-5"
            style={{ animation: 'cw-slide-in-right 0.2s ease' }}
          >
            <div className="mb-4 flex items-center justify-between">
              <Logo />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Đóng menu"
                className="flex min-h-11 min-w-11 items-center justify-center rounded-lg hover:bg-white/5"
              >
                <X size={20} />
              </button>
            </div>
            <MovieSearchAutocomplete
              mobile
              value={keyword}
              onChange={setKeyword}
              onSubmit={handleSearch}
              onSelect={() => setDrawerOpen(false)}
            />
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={location.pathname === item.to ? 'page' : undefined}
                onClick={() => setDrawerOpen(false)}
                className="rounded-md px-3 py-3 text-sm font-medium text-text-muted hover:bg-white/5 hover:text-text"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-border pt-3">
              {user ? (
                <>
                  <Link
                    to="/profile"
                    onClick={() => setDrawerOpen(false)}
                    className="block rounded-md px-3 py-3 text-sm hover:bg-white/5"
                  >
                    Hồ sơ · {user.fullName}
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setDrawerOpen(false);
                    }}
                    className="block w-full rounded-md px-3 py-3 text-left text-sm text-error hover:bg-white/5"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-md border border-border px-3 py-2.5 text-center text-sm font-medium"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setDrawerOpen(false)}
                    className="rounded-md bg-primary px-3 py-2.5 text-center text-sm font-semibold"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
