import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { fetchFullSchedule } from '@/services/cinemaApiService';
import DateSelector from '@/components/cinema/DateSelector';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import EmptyState from '@/components/common/EmptyState';
import LoginMarquee from '@/components/common/LoginMarquee';

export default function CinemaListPage() {
  const navigate = useNavigate();
  const [systemCode, setSystemCode] = useState<string | null>(null);
  const [clusterCode, setClusterCode] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);

  const { data: systems, isLoading, isError } = useQuery({
    queryKey: ['full-schedule'],
    queryFn: fetchFullSchedule,
  });

  const activeSystem = systems?.find((s) => s.code === systemCode) ?? systems?.[0];
  const activeCluster =
    activeSystem?.clusters.find((c) => c.code === clusterCode) ?? activeSystem?.clusters[0];



  useEffect(() => {
    setClusterCode(null);
    setDate(null);
  }, [systemCode]);

  useEffect(() => {
    setDate(null);
  }, [clusterCode]);

  const dates = useMemo(() => {
    const set = new Set<string>();
    for (const movie of activeCluster?.movies ?? []) {
      for (const st of movie.showtimes) set.add(st.date);
    }
    return Array.from(set).sort();
  }, [activeCluster]);

  const activeDate = date ?? dates[0] ?? null;

  const moviesForDate = useMemo(
    () =>
      (activeCluster?.movies ?? [])
        .map((m) => ({ ...m, showtimes: m.showtimes.filter((st) => st.date === activeDate) }))
        .filter((m) => m.showtimes.length > 0),
    [activeCluster, activeDate],
  );

  if (isLoading) {
    return <div className="container-app py-8 text-text-muted">Đang tải hệ thống rạp...</div>;
  }

  if (isError || !systems?.length) {
    return (
      <div className="container-app py-8">
        <EmptyState
          title="Không tải được hệ thống rạp"
          description="Không thể kết nối tới máy chủ. Vui lòng thử lại sau."
        />
      </div>
    );
  }

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-semibold">Cụm rạp</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        {systems.map((system) => (
          <button
            key={system.code}
            type="button"
            onClick={() => setSystemCode(system.code)}
            title={system.name}
            aria-pressed={system.code === activeSystem?.code}
            className={`flex h-16 w-16 items-center justify-center rounded-full border-2 transition ${
              system.code === activeSystem?.code
                ? 'border-primary bg-primary/10'
                : 'border-border bg-surface hover:border-primary/50'
            }`}
          >
            <img src={system.logo} alt={system.name} loading="lazy" className="h-10 w-10 object-contain" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <div className="flex max-h-[560px] flex-col gap-2 overflow-y-auto pr-1">
          {(activeSystem?.clusters ?? []).map((cluster) => (
            <button
              key={cluster.code}
              type="button"
              onClick={() => setClusterCode(cluster.code)}
              className={`rounded-lg border p-3 text-left transition ${
                cluster.code === activeCluster?.code
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface hover:border-primary/40'
              }`}
            >
              <p className="text-sm font-medium">{cluster.name}</p>
              <p className="mt-1 flex items-start gap-1.5 text-xs text-text-muted">
                <MapPin size={12} className="mt-0.5 shrink-0" /> {cluster.address}
              </p>
            </button>
          ))}
        </div>

        <div>
          <LoginMarquee />

          {dates.length > 0 && activeDate && (
            <DateSelector dates={dates} activeDate={activeDate} onSelect={setDate} />
          )}

          {moviesForDate.length === 0 ? (
            <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
              Rạp này chưa có lịch chiếu.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {moviesForDate.map((movie) => (
                <div
                  key={movie.movieId}
                  className="flex gap-3 rounded-lg border border-border bg-surface p-3"
                >
                  <PosterPlaceholder
                    label={movie.movieName}
                    src={movie.posterUrl}
                    className="aspect-[2/3] w-16 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{movie.movieName}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {movie.showtimes.map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() =>
                            navigate(`/booking/${st.id}`, { state: { startsAt: st.startsAt } })
                          }
                          className="flex flex-col items-center rounded-md border border-border px-3 py-1.5 text-sm transition hover:border-primary hover:text-primary"
                        >
                          <span>{st.time}</span>
                          <span className="text-[10px] uppercase text-text-muted">{st.roomName}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
