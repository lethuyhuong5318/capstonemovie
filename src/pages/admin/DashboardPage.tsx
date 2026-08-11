import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Film, Clapperboard, Ticket, Wallet } from 'lucide-react';
import { fetchLiveMovies } from '@/services/movieApiService';
import { showtimes } from '@/mocks/showtimes';
import { movies as movieList } from '@/mocks/movies';
import { formatCurrency } from '@/utils/format';
import { fetchAdminBookings } from '@/services/adminBookingService';

export default function DashboardPage() {
  const { data: movies } = useQuery({
    queryKey: ['admin-movies'],
    queryFn: () => fetchLiveMovies({ status: 'all' }),
  });
  const { data: bookings = [] } = useQuery({
    queryKey: ['admin-bookings'],
    queryFn: fetchAdminBookings,
    staleTime: 0,
  });

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayShowtimes = showtimes.filter((s) => s.date === todayStr);
  const totalRevenue = bookings.reduce((sum, b) => sum + b.total, 0);

  const topMovies = useMemo(() => {
    const counts = new Map<string, number>();
    for (const b of bookings) {
      counts.set(b.movieName, (counts.get(b.movieName) ?? 0) + b.seatCodes.length);
    }
    return Array.from(counts.entries())
      .map(([movieName, tickets]) => ({ movieName, tickets }))
      .sort((a, b) => b.tickets - a.tickets)
      .slice(0, 5);
  }, [bookings]);

  const stats = [
    { icon: Film, label: 'Phim đang chiếu', value: (movies ?? []).filter((m) => m.isShowing).length },
    { icon: Clapperboard, label: 'Suất chiếu hôm nay', value: todayShowtimes.length },
    { icon: Ticket, label: 'Vé đã đặt', value: bookings.reduce((s, b) => s + b.seatCodes.length, 0) },
    { icon: Wallet, label: 'Doanh thu', value: formatCurrency(totalRevenue) },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border bg-surface p-4">
            <s.icon size={20} className="mb-2 text-primary" />
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Phim bán chạy</h2>
      {topMovies.length === 0 ? (
        <p className="text-sm text-text-muted">Chưa có dữ liệu đặt vé.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {topMovies.map(({ movieName, tickets }) => {
            const max = topMovies[0].tickets || 1;
            return (
              <div key={movieName} className="flex items-center gap-3">
                <span className="w-40 shrink-0 truncate text-sm">{movieName}</span>
                <div className="h-2 flex-1 rounded-full bg-surface-elevated">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(tickets / max) * 100}%` }}
                  />
                </div>
                <span className="w-10 shrink-0 text-right text-sm text-text-muted">{tickets}</span>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="mb-3 mt-8 text-lg font-semibold">Suất chiếu gần nhất</h2>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-text-muted">
            <tr>
              <th className="px-4 py-2.5">Phim</th>
              <th className="px-4 py-2.5">Ngày</th>
              <th className="px-4 py-2.5">Giờ</th>
            </tr>
          </thead>
          <tbody>
            {showtimes
              .filter((s) => `${s.date}T${s.time}` >= new Date().toISOString().slice(0, 16))
              .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
              .slice(0, 6)
              .map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-2.5">{movieList.find((m) => m.id === s.movieId)?.name}</td>
                  <td className="px-4 py-2.5 text-text-muted">{s.date}</td>
                  <td className="px-4 py-2.5 text-text-muted">{s.time}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
