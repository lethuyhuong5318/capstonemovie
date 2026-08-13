import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Play, Ticket, Star } from 'lucide-react';
import { fetchLiveMovieById } from '@/services/movieApiService';
import { fetchShowtimesForMovie } from '@/services/cinemaApiService';
import TrailerModal from '@/components/movie/TrailerModal';
import ShowtimeSelector from '@/components/cinema/ShowtimeSelector';
import DateSelector from '@/components/cinema/DateSelector';
import LoginMarquee from '@/components/common/LoginMarquee';
import AgeBadge from '@/components/movie/AgeBadge';
import ReviewSection from '@/components/movie/ReviewSection';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';
import { formatDuration, formatFullDate, formatRating } from '@/utils/format';

export default function MovieDetailPage() {
  const { movieId } = useParams();
  const id = Number(movieId);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const {
    data: movie,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['live-movie', id],
    queryFn: () => fetchLiveMovieById(id),
    enabled: Number.isFinite(id),
  });

  const { data: systems, isLoading: showtimesLoading } = useQuery({
    queryKey: ['showtimes', id],
    queryFn: () => fetchShowtimesForMovie(id),
    enabled: Number.isFinite(id),
  });

  const allDates = useMemo(() => {
    const set = new Set<string>();
    for (const system of systems ?? []) {
      for (const cluster of system.clusters) {
        for (const st of cluster.showtimes) set.add(st.date);
      }
    }
    return Array.from(set).sort();
  }, [systems]);

  const activeDate = selectedDate ?? allDates[0] ?? null;

  if (isLoading) {
    return <div className="container-app py-8 text-text-muted">Đang tải...</div>;
  }

  if (isError) {
    return (
      <div className="container-app py-8 text-error">
        Không tải được thông tin phim. Vui lòng thử lại sau.
      </div>
    );
  }

  if (!movie) {
    return <div className="container-app py-8">Không tìm thấy phim.</div>;
  }

  return (
    <div>
      <div className="relative h-64 sm:h-80">
        <PosterPlaceholder
          label={`Backdrop · ${movie.name}`}
          src={movie.backdropUrl}
          className="h-full w-full"
          rounded="rounded-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-bg to-black/10" />
      </div>

      <div className="container-app -mt-20 relative pb-12">
        <div className="flex flex-col gap-6 md:flex-row">
          <PosterPlaceholder
            label={movie.name}
            src={movie.posterUrl}
            className="aspect-[2/3] w-40 shrink-0 shadow-lg shadow-black/40 sm:w-56"
          />
          <div className="flex-1 pt-4 md:pt-16">
            <h1 className="text-2xl font-bold sm:text-3xl">{movie.name}</h1>
            <p className="text-sm text-text-muted">{movie.englishName}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-text-muted">
              <AgeBadge rating={movie.ageRating} />
              <span>{movie.genres.join(', ')}</span>
              <span>·</span>
              <span>{formatDuration(movie.durationMinutes)}</span>
              <span>·</span>
              <span>Khởi chiếu {formatFullDate(movie.releaseDate)}</span>
              <span className="flex items-center gap-1 text-accent">
                <Star size={14} fill="currentColor" /> {formatRating(movie.rating)}
              </span>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm sm:max-w-md">
              <MetaRow label="Đạo diễn" value={movie.director} />
              <MetaRow label="Diễn viên" value={movie.cast.join(', ')} />
              <MetaRow label="Quốc gia" value={movie.country} />
              <MetaRow label="Ngôn ngữ" value={movie.language} />
            </dl>

            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-text-muted">{movie.description}</p>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => setTrailerOpen(true)}
                className="flex items-center gap-2 rounded-md bg-surface-elevated px-4 py-2.5 text-sm font-medium hover:bg-border"
              >
                <Play size={16} fill="currentColor" /> Xem trailer
              </button>
              {movie.isShowing && (
                <a
                  href="#showtimes"
                  className="flex items-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold hover:bg-primary-hover"
                >
                  <Ticket size={16} /> Đặt vé
                </a>
              )}
            </div>
          </div>
        </div>

        {movie.isShowing && (
          <div id="showtimes" className="mt-10 scroll-mt-20">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">Lịch chiếu</h2>
            </div>

            <LoginMarquee />

            {showtimesLoading ? (
              <p className="text-text-muted">Đang tải lịch chiếu...</p>
            ) : allDates.length === 0 ? (
              <p className="rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
                Phim này chưa có lịch chiếu. Vui lòng quay lại sau.
              </p>
            ) : (
              <>
                <DateSelector dates={allDates} activeDate={activeDate} onSelect={setSelectedDate} />
                {activeDate && <ShowtimeSelector systems={systems ?? []} selectedDate={activeDate} />}
              </>
            )}
          </div>
        )}

        <div className="mt-10">
          <ReviewSection movieId={movie.id} />
        </div>
      </div>

      <TrailerModal open={trailerOpen} trailerUrl={movie.trailerUrl} onClose={() => setTrailerOpen(false)} />
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-text-muted">{label}</dt>
      <dd className="line-clamp-1">{value}</dd>
    </>
  );
}
