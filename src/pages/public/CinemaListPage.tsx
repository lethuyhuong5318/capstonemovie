import { useQuery } from '@tanstack/react-query';
import { MapPin } from 'lucide-react';
import { fetchCinemaSystems } from '@/services/cinemaService';

export default function CinemaListPage() {
  const { data: systems } = useQuery({ queryKey: ['cinema-systems'], queryFn: fetchCinemaSystems });

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-semibold">Hệ thống rạp</h1>
      <div className="flex flex-col gap-6">
        {(systems ?? []).map((system) => (
          <div key={system.id}>
            <h2 className="mb-3 text-lg font-semibold text-primary">{system.name}</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {system.cinemas.map((cinema) => (
                <div key={cinema.id} className="rounded-lg border border-border bg-surface p-4">
                  <p className="font-medium">{cinema.name}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-muted">
                    <MapPin size={14} /> {cinema.address}, {cinema.city}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
