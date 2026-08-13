import { useNavigate } from 'react-router-dom';
import type { SystemShowtimes, ShowtimeEntry } from '@/services/cinemaApiService';
import { formatCurrency } from '@/utils/format';

interface Props {
  systems: SystemShowtimes[];
  selectedDate: string;
}

export default function ShowtimeSelector({ systems, selectedDate }: Props) {
  const navigate = useNavigate();




  const now = Date.now();
  const hasUpcoming = systems.some((s) =>
    s.clusters.some((c) => c.showtimes.some((st) => new Date(st.startsAt).getTime() >= now)),
  );
  const isExpired = (startsAt: string) =>
    hasUpcoming && new Date(startsAt).getTime() < now;

  const visibleSystems = systems
    .map((system) => ({
      ...system,
      clusters: system.clusters
        .map((cluster) => ({
          ...cluster,
          showtimes: cluster.showtimes.filter((s) => s.date === selectedDate),
        }))
        .filter((c) => c.showtimes.length > 0),
    }))
    .filter((s) => s.clusters.length > 0);

  if (visibleSystems.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        Không có suất chiếu trong ngày này.
      </p>
    );
  }

  function handleClick(showtime: ShowtimeEntry) {

    if (isExpired(showtime.startsAt)) return;


    navigate(`/booking/${showtime.id}`, { state: { startsAt: showtime.startsAt } });
  }

  return (
    <div className="flex flex-col gap-6">
      {visibleSystems.map((system) => (
        <div key={system.code}>
          <div className="mb-2 flex items-center gap-2">
            <img
              src={system.logo}
              alt={system.name}
              loading="lazy"
              className="h-8 w-8 rounded object-contain"
            />
            <span className="text-sm font-semibold">{system.name}</span>
          </div>
          <div className="flex flex-col gap-3">
            {system.clusters.map((cluster) => (
              <div key={cluster.code} className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-0.5 text-sm font-medium">{cluster.name}</p>
                <p className="mb-2 text-xs text-text-muted">{cluster.address}</p>
                <div className="flex flex-wrap gap-2">
                  {cluster.showtimes.map((st) => {
                    const expired = isExpired(st.startsAt);
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={expired}
                        onClick={() => handleClick(st)}
                        title={expired ? 'Suất chiếu đã qua' : `Giá vé ${formatCurrency(st.price)}`}
                        className={`flex flex-col items-center rounded-md border px-3 py-1.5 text-sm transition ${
                          expired
                            ? 'cursor-not-allowed border-border text-text-muted/40'
                            : 'border-border hover:border-primary hover:text-primary'
                        }`}
                      >
                        <span>{st.time}</span>
                        <span className="text-[10px] uppercase text-text-muted">{st.roomName}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
