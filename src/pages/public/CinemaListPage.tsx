import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { fetchCinemaSystems } from '@/services/cinemaService';
import { fetchLiveMovies } from '@/services/movieApiService';
import { fetchScheduleByCinema } from '@/services/showtimeService';
import DateSelector from '@/components/cinema/DateSelector';
import AgeBadge from '@/components/movie/AgeBadge';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import type { ShowtimeStatus } from '@/types';

const statusStyle: Record<ShowtimeStatus, string> = {
  AVAILABLE: 'border-border hover:border-primary hover:text-primary',
  ALMOST_FULL: 'border-warning/50 text-warning hover:bg-warning/10',
  SOLD_OUT: 'border-border text-text-muted/50 cursor-not-allowed line-through',
  EXPIRED: 'border-border text-text-muted/30 cursor-not-allowed',
};

function nextDates(count: number) {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

const dates = nextDates(7);

export default function CinemaListPage() {
  const navigate = useNavigate();
  const [systemId, setSystemId] = useState<number | null>(null);
  const [cinemaId, setCinemaId] = useState<number | null>(null);
  const [date, setDate] = useState(dates[0]);

  const { data: systems } = useQuery({ queryKey: ['cinema-systems'], queryFn: fetchCinemaSystems });
  const { data: liveMovies } = useQuery({
    queryKey: ['live-movies', 'showing'],
    queryFn: () => fetchLiveMovies({ status: 'showing' }),
  });

  const activeSystemId = systemId ?? systems?.[0]?.id ?? null;
  const activeSystem = systems?.find((s) => s.id === activeSystemId);
  const activeCinemaId = cinemaId ?? activeSystem?.cinemas[0]?.id ?? null;

  useEffect(() => {
    setCinemaId(null);
  }, [activeSystemId]);

  const movieIds = useMemo(() => (liveMovies ?? []).map((m) => m.id), [liveMovies]);

  const { data: schedule, isLoading } = useQuery({
    queryKey: ['cinema-schedule', activeCinemaId, date, movieIds],
    queryFn: () => fetchScheduleByCinema(activeCinemaId!, date, movieIds),
    enabled: !!activeCinemaId && movieIds.length > 0,
  });

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-semibold">Cụm rạp</h1>

      <div className="mb-6 flex flex-wrap gap-4">
        {(systems ?? []).map((system) => (
          <button
            key={system.id}
            type="button"
            onClick={() => setSystemId(system.id)}
            className={`flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 text-lg font-bold transition ${
              system.id === activeSystemId
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-surface text-text-muted hover:border-primary/50'
            }`}
            title={system.name}
          >
            {system.shortName.slice(0, 2).toUpperCase()}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-2">
          {(activeSystem?.cinemas ?? []).map((cinema) => (
            <button
              key={cinema.id}
              type="button"
              onClick={() => setCinemaId(cinema.id)}
              className={`rounded-lg border p-3 text-left transition ${
                cinema.id === activeCinemaId
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface hover:border-primary/40'
              }`}
            >
              <p className="font-medium">{cinema.name}</p>
              <p className="mt-1 flex items-center gap-1.5 text-xs text-text-muted">
                <MapPin size={12} /> {cinema.address}, {cinema.city}
              </p>
            </button>
          ))}
          {activeSystem && activeSystem.cinemas.length === 0 && (
            <p className="text-sm text-text-muted">Chưa có rạp trong hệ thống này.</p>
          )}
        </div>

        <div>
          <DateSelector dates={dates} activeDate={date} onSelect={setDate} />

          {isLoading && <p className="text-sm text-text-muted">Đang tải lịch chiếu...</p>}

          {!isLoading && (schedule ?? []).length === 0 && (
            <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
              Không có suất chiếu nào tại rạp này trong ngày đã chọn.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {(schedule ?? []).map((entry) => (
              <div key={entry.movieId} className="flex gap-3 rounded-lg border border-border bg-surface p-3">
                <PosterPlaceholder
                  label={entry.movieName}
                  src={entry.posterUrl}
                  className="aspect-[2/3] w-16 shrink-0"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {entry.ageRating && <AgeBadge rating={entry.ageRating} />}
                    <p className="font-medium">{entry.movieName}</p>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {entry.showtimes.map((st) => {
                      const disabled = st.status === 'SOLD_OUT' || st.status === 'EXPIRED';
                      return (
                        <button
                          key={st.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => navigate(`/booking/${st.id}`)}
                          className={`flex flex-col items-center rounded-md border px-3 py-1.5 text-sm transition ${statusStyle[st.status]}`}
                        >
                          <span>{st.time}</span>
                          <span className="text-[10px] uppercase text-text-muted">{st.roomType}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
