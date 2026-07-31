import { useNavigate } from 'react-router-dom';
import type { CinemaSystemGroup, ShowtimeWithStatus } from '@/services/showtimeService';
import type { ShowtimeStatus } from '@/types';

interface Props {
  systems: CinemaSystemGroup[];
  selectedDate: string;
}

const statusStyle: Record<ShowtimeStatus, string> = {
  AVAILABLE: 'border-border hover:border-primary hover:text-primary',
  ALMOST_FULL: 'border-warning/50 text-warning hover:bg-warning/10',
  SOLD_OUT: 'border-border text-text-muted/50 cursor-not-allowed line-through',
  EXPIRED: 'border-border text-text-muted/30 cursor-not-allowed',
};

function statusLabel(status: ShowtimeStatus) {
  if (status === 'ALMOST_FULL') return 'Gần hết vé';
  if (status === 'SOLD_OUT') return 'Hết vé';
  if (status === 'EXPIRED') return 'Đã qua giờ';
  return '';
}

export default function ShowtimeSelector({ systems, selectedDate }: Props) {
  const navigate = useNavigate();

  const visibleSystems = systems
    .map((system) => ({
      ...system,
      cinemas: system.cinemas
        .map((cinema) => ({
          ...cinema,
          showtimes: cinema.dates.find((d) => d.date === selectedDate)?.showtimes ?? [],
        }))
        .filter((c) => c.showtimes.length > 0),
    }))
    .filter((s) => s.cinemas.length > 0);

  if (visibleSystems.length === 0) {
    return (
      <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
        Không có suất chiếu trong ngày này.
      </p>
    );
  }

  function handleClick(st: ShowtimeWithStatus) {
    if (st.status === 'SOLD_OUT' || st.status === 'EXPIRED') return;
    navigate(`/booking/${st.id}`);
  }

  return (
    <div className="flex flex-col gap-6">
      {visibleSystems.map((system) => (
        <div key={system.id}>
          <div className="mb-2 inline-block rounded bg-surface-elevated px-3 py-1 text-sm font-semibold text-primary">
            {system.shortName}
          </div>
          <div className="flex flex-col gap-3">
            {system.cinemas.map((cinema) => (
              <div key={cinema.id} className="rounded-lg border border-border bg-surface p-3">
                <p className="mb-0.5 text-sm font-medium">{cinema.name}</p>
                <p className="mb-2 text-xs text-text-muted">{cinema.address}</p>
                <div className="flex flex-wrap gap-2">
                  {cinema.showtimes.map((st) => {
                    const disabled = st.status === 'SOLD_OUT' || st.status === 'EXPIRED';
                    return (
                      <button
                        key={st.id}
                        type="button"
                        disabled={disabled}
                        onClick={() => handleClick(st)}
                        title={statusLabel(st.status)}
                        className={`flex flex-col items-center rounded-md border px-3 py-1.5 text-sm transition ${statusStyle[st.status]}`}
                      >
                        <span>{st.time}</span>
                        <span className="text-[10px] uppercase text-text-muted">{st.roomType}</span>
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
