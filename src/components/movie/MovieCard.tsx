import { Link } from 'react-router-dom';
import { Clock, Play, Star, Ticket } from 'lucide-react';
import type { Movie } from '@/types';
import { formatDuration, formatRating } from '@/utils/format';
import AgeBadge from '@/components/movie/AgeBadge';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';

export default function MovieCard({ movie }: { movie: Movie }) {
  return (
    <div className="group relative w-full shrink-0">
      <Link to={`/movies/${movie.id}`} className="block">
        <div className="relative">
          <PosterPlaceholder label={movie.name} src={movie.posterUrl} className="aspect-[2/3] w-full" />

          <div className="absolute left-2 top-2 flex items-center gap-1.5">
            <AgeBadge rating={movie.ageRating} />
            {movie.isHot && (
              <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
                HOT
              </span>
            )}
          </div>

          <div className="absolute inset-0 flex items-end justify-center gap-2 bg-black/60 p-3 opacity-0 transition-opacity duration-200 group-focus-within:opacity-100 group-hover:opacity-100">
            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium text-white backdrop-blur">
              <Play size={13} /> Trailer
            </span>
            <span className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white">
              <Ticket size={13} /> Đặt vé
            </span>
          </div>
        </div>

        <h3 className="mt-2.5 line-clamp-1 text-sm font-medium group-hover:text-primary">{movie.name}</h3>
        <p className="mt-0.5 line-clamp-1 text-xs text-text-muted">{movie.genres.join(', ')}</p>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1 text-accent">
            <Star size={12} fill="currentColor" /> {formatRating(movie.rating)}
          </span>
          <span className="flex items-center gap-1">
            <Clock size={12} /> {formatDuration(movie.durationMinutes)}
          </span>
        </div>
      </Link>
    </div>
  );
}
