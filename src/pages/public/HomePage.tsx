import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Play, Star, Ticket } from 'lucide-react';
import { fetchLiveMovies } from '@/services/movieApiService';
import { fetchCinemaSystems } from '@/services/cinemaService';
import { fetchShowtimesByMovie } from '@/services/showtimeService';
import MovieCard from '@/components/movie/MovieCard';
import TrailerModal from '@/components/movie/TrailerModal';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import { MovieCardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import AgeBadge from '@/components/movie/AgeBadge';

type Tab = 'showing' | 'upcoming';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('showing');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const navigate = useNavigate();

  const {
    data: allMovies,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['live-movies', 'all'],
    queryFn: () => fetchLiveMovies(),
  });

  const { data: systems } = useQuery({
    queryKey: ['cinema-systems'],
    queryFn: fetchCinemaSystems,
  });

  const hotMovies = useMemo(() => (allMovies ?? []).filter((m) => m.isHot), [allMovies]);

  useEffect(() => {
    if (hotMovies.length < 2) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % hotMovies.length), 6000);
    return () => clearInterval(id);
  }, [hotMovies.length]);

  const banner = hotMovies[slide % Math.max(hotMovies.length, 1)];

  const filtered = useMemo(() => {
    let list = (allMovies ?? []).filter((m) => (tab === 'showing' ? m.isShowing : m.isUpcoming));
    if (keyword) {
      const kw = keyword.toLowerCase();
      list = list.filter((m) => m.name.toLowerCase().includes(kw));
    }
    return list;
  }, [allMovies, tab, keyword]);

  const [quickMovie, setQuickMovie] = useState<number | undefined>();
  const [quickCinema, setQuickCinema] = useState<number | undefined>();
  const [quickDate, setQuickDate] = useState<string | undefined>();

  const { data: quickShowtimes } = useQuery({
    queryKey: ['quick-showtimes', quickMovie],
    queryFn: () => fetchShowtimesByMovie(quickMovie!),
    enabled: !!quickMovie,
  });

  const quickDates = useMemo(() => {
    const set = new Set<string>();
    for (const s of quickShowtimes ?? []) for (const c of s.cinemas) for (const d of c.dates) set.add(d.date);
    return Array.from(set).sort();
  }, [quickShowtimes]);

  const quickShowtimesForSelection = useMemo(() => {
    if (!quickCinema || !quickDate) return [];
    for (const s of quickShowtimes ?? []) {
      const cinema = s.cinemas.find((c) => c.id === quickCinema);
      const day = cinema?.dates.find((d) => d.date === quickDate);
      if (day) return day.showtimes;
    }
    return [];
  }, [quickShowtimes, quickCinema, quickDate]);

  return (
    <div>
      <section className="relative -mt-16 flex h-[520px] items-end overflow-hidden sm:h-[600px]">
        {banner && (
          <>
            <div className="absolute inset-0">
              <PosterPlaceholder
                label={`Backdrop · ${banner.name}`}
                src={banner.backdropUrl}
                className="h-full w-full"
                rounded="rounded-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/70 to-bg/10" />
              <div className="absolute inset-0 bg-gradient-to-r from-bg/90 via-bg/30 to-transparent" />
            </div>
            <div className="container-app relative z-10 pb-16">
              <span className="mb-3 inline-block rounded-full bg-primary/90 px-3 py-1 text-xs font-semibold tracking-wide text-white">
                {banner.isShowing ? 'ĐANG CHIẾU' : 'SẮP CHIẾU'}
              </span>
              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight drop-shadow sm:text-5xl">
                {banner.name}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-text-muted">
                <AgeBadge rating={banner.ageRating} />
                <span>{banner.genres.join(', ')}</span>
                <span className="flex items-center gap-1">
                  <Clock size={14} /> {banner.durationMinutes} phút
                </span>
                <span className="flex items-center gap-1 text-accent">
                  <Star size={14} fill="currentColor" aria-hidden="true" /> {banner.rating.toFixed(1)}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted line-clamp-2 sm:text-base">
                {banner.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
                >
                  <Play size={16} /> Xem trailer
                </button>
                <Link
                  to={`/movies/${banner.id}`}
                  className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
                >
                  <Ticket size={16} /> Đặt vé ngay
                </Link>
              </div>
            </div>
            {hotMovies.length > 1 && (
              <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2">
                {hotMovies.map((m, i) => (
                  <button
                    key={m.id}
                    type="button"
                    aria-label={`Slide ${i + 1}`}
                    onClick={() => setSlide(i)}
                    className={`h-1.5 rounded-full transition-all ${
                      i === slide % hotMovies.length ? 'w-6 bg-primary' : 'w-2.5 bg-white/30'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      <div className="container-app relative z-10 -mt-8">
        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4 shadow-xl sm:flex-row sm:items-end">
          <QuickField label="Phim">
            <select
              className="input !bg-surface-elevated"
              value={quickMovie ?? ''}
              onChange={(e) => {
                setQuickMovie(Number(e.target.value) || undefined);
                setQuickCinema(undefined);
                setQuickDate(undefined);
              }}
            >
              <option value="">Chọn phim</option>
              {(allMovies ?? []).filter((m) => m.isShowing).map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </QuickField>

          <QuickField label="Hệ thống rạp">
            <select
              className="input !bg-surface-elevated"
              value={quickCinema ?? ''}
              onChange={(e) => setQuickCinema(Number(e.target.value) || undefined)}
              disabled={!quickMovie}
            >
              <option value="">Chọn rạp</option>
              {(systems ?? []).flatMap((s) => s.cinemas).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </QuickField>

          <QuickField label="Ngày">
            <select
              className="input !bg-surface-elevated"
              value={quickDate ?? ''}
              onChange={(e) => setQuickDate(e.target.value || undefined)}
              disabled={!quickCinema}
            >
              <option value="">Chọn ngày</option>
              {quickDates.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </QuickField>

          <QuickField label="Suất chiếu">
            <select
              className="input !bg-surface-elevated"
              disabled={!quickDate || quickShowtimesForSelection.length === 0}
              onChange={(e) => {
                if (e.target.value) navigate(`/booking/${e.target.value}`);
              }}
            >
              <option value="">Chọn suất & mua vé</option>
              {quickShowtimesForSelection.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.time}
                </option>
              ))}
            </select>
          </QuickField>
        </div>
      </div>

      <div className="container-app py-14">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-2xl font-bold">Danh sách phim</h2>
          <div className="flex gap-2">
            <TabButton active={tab === 'showing'} onClick={() => setTab('showing')}>
              Đang chiếu
            </TabButton>
            <TabButton active={tab === 'upcoming'} onClick={() => setTab('upcoming')}>
              Sắp chiếu
            </TabButton>
          </div>
        </div>

        {isError ? (
          <EmptyState
            title="Không tải được danh sách phim"
            description="Không thể kết nối tới máy chủ phim. Vui lòng thử lại sau."
          />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
              {isLoading && Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)}
              {!isLoading && filtered.map((movie) => <MovieCard key={movie.id} movie={movie} />)}
            </div>
            {!isLoading && filtered.length === 0 && (
              <EmptyState title="Không tìm thấy phim" description="Thử từ khóa khác hoặc chọn tab còn lại." />
            )}
          </>
        )}
      </div>

      <div className="border-t border-border bg-surface/40 py-14" id="cinemas">
        <div className="container-app">
          <h2 className="mb-6 text-2xl font-bold">Hệ thống rạp</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {(systems ?? []).map((system) => (
              <div key={system.id} className="rounded-xl border border-border bg-surface p-5">
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 font-bold text-primary">
                    {system.shortName.slice(0, 1)}
                  </span>
                  <p className="font-semibold">{system.name}</p>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {system.cinemas.map((c) => (
                    <li key={c.id} className="text-sm text-text-muted">
                      <p className="text-text">{c.name}</p>
                      <p className="text-xs">{c.address}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {banner && (
        <TrailerModal open={trailerOpen} trailerUrl={banner.trailerUrl} onClose={() => setTrailerOpen(false)} />
      )}
    </div>
  );
}

function QuickField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-xs text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}
