import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Pause, Play, RefreshCw, Star, Ticket } from 'lucide-react';
import { fetchLiveMovies } from '@/services/movieApiService';
import { fetchCinemaBrands, fetchShowtimesForMovie } from '@/services/cinemaApiService';
import MovieCard from '@/components/movie/MovieCard';
import TrailerModal from '@/components/movie/TrailerModal';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import { MovieCardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';
import AgeBadge from '@/components/movie/AgeBadge';
import { formatRating } from '@/utils/format';
import { normalizeSearchText } from '@/utils/search';

type Tab = 'showing' | 'upcoming';

export default function HomePage() {
  const [tab, setTab] = useState<Tab>('showing');
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [slide, setSlide] = useState(0);
  const [carouselPlaying, setCarouselPlaying] = useState(true);
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') ?? '';
  const navigate = useNavigate();

  const {
    data: allMovies,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['live-movies', 'all'],
    queryFn: () => fetchLiveMovies(),
  });

  const { data: brands } = useQuery({
    queryKey: ['cinema-brands'],
    queryFn: fetchCinemaBrands,
  });

  const hotMovies = useMemo(() => (allMovies ?? []).filter((m) => m.isHot), [allMovies]);

  useEffect(() => {
    if (hotMovies.length < 2 || !carouselPlaying) return;
    const id = setInterval(() => setSlide((s) => (s + 1) % hotMovies.length), 6000);
    return () => clearInterval(id);
  }, [carouselPlaying, hotMovies.length]);

  const banner = hotMovies[slide % Math.max(hotMovies.length, 1)];

  const filtered = useMemo(() => {
    let list = (allMovies ?? []).filter((m) => (tab === 'showing' ? m.isShowing : m.isUpcoming));
    if (keyword) {
      const kw = normalizeSearchText(keyword);
      list = list.filter((m) => normalizeSearchText(m.name).includes(kw));
    }
    return list;
  }, [allMovies, tab, keyword]);

  const [quickMovie, setQuickMovie] = useState<number | undefined>();
  const [quickCluster, setQuickCluster] = useState<string | undefined>();
  const [quickDate, setQuickDate] = useState<string | undefined>();

  const { data: quickShowtimes } = useQuery({
    queryKey: ['showtimes', quickMovie],
    queryFn: () => fetchShowtimesForMovie(quickMovie!),
    enabled: !!quickMovie,
  });


  const quickClusters = useMemo(() => {
    const list: Array<{ code: string; name: string }> = [];
    for (const s of quickShowtimes ?? []) {
      for (const c of s.clusters) list.push({ code: c.code, name: `${s.name} — ${c.name}` });
    }
    return list;
  }, [quickShowtimes]);

  const quickDates = useMemo(() => {
    if (!quickCluster) return [];
    const set = new Set<string>();
    for (const s of quickShowtimes ?? []) {
      for (const c of s.clusters) {
        if (c.code !== quickCluster) continue;
        for (const st of c.showtimes) set.add(st.date);
      }
    }
    return Array.from(set).sort();
  }, [quickShowtimes, quickCluster]);

  const quickShowtimesForSelection = useMemo(() => {
    if (!quickCluster || !quickDate) return [];
    for (const s of quickShowtimes ?? []) {
      const cluster = s.clusters.find((c) => c.code === quickCluster);
      if (cluster) return cluster.showtimes.filter((st) => st.date === quickDate);
    }
    return [];
  }, [quickShowtimes, quickCluster, quickDate]);

  return (
    <div>
      <section className="relative -mt-16 flex h-[520px] items-end overflow-hidden sm:h-[600px]">
        {banner && (
          <>
            <div className="absolute inset-0">
              <PosterPlaceholder
                label={`Backdrop · ${banner.name}`}
                src={banner.backdropUrl}
                loading="eager"
                fetchPriority="high"
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
                  <Star size={14} fill="currentColor" aria-hidden="true" /> {formatRating(banner.rating)}
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-text-muted line-clamp-2 sm:text-base">
                {banner.description}
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setTrailerOpen(true)}
                  className="flex min-h-11 items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold backdrop-blur transition hover:bg-white/20"
                >
                  <Play size={16} /> Xem trailer
                </button>
                <Link
                  to={`/movies/${banner.id}`}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary/30 transition hover:bg-primary-hover"
                >
                  <Ticket size={16} /> Đặt vé ngay
                </Link>
              </div>
            </div>
            {hotMovies.length > 1 && (
              <div className="absolute bottom-6 right-4 z-10 flex items-center gap-2 sm:right-6">
                <button
                  type="button"
                  aria-label={carouselPlaying ? 'Tạm dừng trình chiếu' : 'Tiếp tục trình chiếu'}
                  aria-pressed={!carouselPlaying}
                  onClick={() => setCarouselPlaying((playing) => !playing)}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                >
                  {carouselPlaying ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <span className="rounded-full bg-black/50 px-3 py-2 text-xs font-medium text-white backdrop-blur sm:hidden">
                  {(slide % hotMovies.length) + 1} / {hotMovies.length}
                </span>
                <div className="hidden items-center gap-1 sm:flex">
                  {hotMovies.map((m, i) => (
                    <button
                      key={m.id}
                      type="button"
                      aria-label={`Slide ${i + 1}`}
                      onClick={() => setSlide(i)}
                      aria-current={i === slide % hotMovies.length}
                      className="flex h-11 w-11 items-center justify-center rounded-full"
                    >
                      <span
                        className={`h-1.5 rounded-full transition-all ${
                          i === slide % hotMovies.length ? 'w-6 bg-primary' : 'w-2.5 bg-white/40'
                        }`}
                      />
                    </button>
                  ))}
                </div>
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
                setQuickCluster(undefined);
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

          <QuickField label="Rạp chiếu">
            <select
              className="input !bg-surface-elevated"
              value={quickCluster ?? ''}
              onChange={(e) => {
                setQuickCluster(e.target.value || undefined);
                setQuickDate(undefined);
              }}
              disabled={!quickMovie}
            >
              <option value="">{quickMovie && quickClusters.length === 0 ? 'Chưa có rạp chiếu' : 'Chọn rạp'}</option>
              {quickClusters.map((c) => (
                <option key={c.code} value={c.code}>
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
              disabled={!quickCluster}
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
                const picked = quickShowtimesForSelection.find((st) => String(st.id) === e.target.value);
                if (picked) navigate(`/booking/${picked.id}`, { state: { startsAt: picked.startsAt } });
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
            action={(
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-2 flex min-h-11 items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                <RefreshCw size={16} /> Thử lại
              </button>
            )}
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
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold">Hệ thống rạp</h2>
            <Link to="/cinemas" className="text-sm text-primary hover:underline">
              Xem lịch chiếu theo rạp →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {(brands ?? []).map((brand) => (
              <Link
                key={brand.code}
                to="/cinemas"
                className="flex flex-col items-center gap-2.5 rounded-xl border border-border bg-surface p-4 transition hover:border-primary/50"
              >
                <img
                  src={brand.logo}
                  alt={brand.name}
                  loading="lazy"
                  className="h-12 w-12 rounded-lg object-contain"
                />
                <p className="text-center text-xs font-medium">{brand.name}</p>
              </Link>
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
      className={`min-h-11 rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}
