import { useQuery } from '@tanstack/react-query';
import { fetchLiveMovies } from '@/services/movieApiService';
import MovieCard from '@/components/movie/MovieCard';
import { MovieCardSkeleton } from '@/components/common/Skeleton';
import EmptyState from '@/components/common/EmptyState';

export default function SchedulePage() {
  const {
    data: movies,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['live-movies', 'showing'],
    queryFn: () => fetchLiveMovies({ status: 'showing' }),
  });

  return (
    <div className="container-app py-8">
      <h1 className="mb-6 text-2xl font-semibold">Lịch chiếu hôm nay</h1>
      {isError ? (
        <EmptyState
          title="Không tải được lịch chiếu"
          description="Không thể kết nối tới máy chủ phim. Vui lòng thử lại sau."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {isLoading
            ? Array.from({ length: 5 }).map((_, i) => <MovieCardSkeleton key={i} />)
            : (movies ?? []).map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
    </div>
  );
}
