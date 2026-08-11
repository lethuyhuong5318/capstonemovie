import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLiveMovies } from '@/services/movieApiService';
import PosterPlaceholder from '@/components/common/PosterPlaceholder';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSelect?: () => void;
  mobile?: boolean;
}

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLocaleLowerCase('vi').trim();
}

export default function MovieSearchAutocomplete({ value, onChange, onSubmit, onSelect, mobile = false }: Props) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const { data: movies = [], isFetching } = useQuery({
    queryKey: ['live-movies', 'all'],
    queryFn: () => fetchLiveMovies(),
    staleTime: 5 * 60 * 1000,
  });
  const normalizedQuery = normalizeSearch(value);
  const suggestions = useMemo(() => {
    if (normalizedQuery.length < 2) return [];
    return movies
      .filter((movie) => normalizeSearch(movie.name).includes(normalizedQuery))
      .sort((a, b) => Number(!normalizeSearch(a.name).startsWith(normalizedQuery)) - Number(!normalizeSearch(b.name).startsWith(normalizedQuery)) || a.name.localeCompare(b.name, 'vi'))
      .slice(0, 6);
  }, [movies, normalizedQuery]);
  const showPanel = open && normalizedQuery.length >= 2;

  function selectMovie(movieId: number) {
    setOpen(false);
    setActiveIndex(-1);
    onSelect?.();
    navigate(`/movies/${movieId}`);
  }

  return (
    <form
      role="search"
      onSubmit={(event) => { event.preventDefault(); setOpen(false); onSubmit(); }}
      onFocus={() => setOpen(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false); }}
      className={mobile ? 'relative mb-3' : 'relative ml-auto hidden max-w-xs flex-1 lg:block'}
    >
      <div className={mobile ? 'relative' : 'flex min-h-11 items-center gap-2 rounded-full border border-border bg-surface-elevated/90 px-3 transition focus-within:border-primary'}>
        <Search size={16} aria-hidden="true" className={mobile ? 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted' : 'shrink-0 text-text-muted'} />
        <input
          value={value}
          onChange={(event) => { onChange(event.target.value); setOpen(true); setActiveIndex(-1); }}
          onKeyDown={(event) => {
            if (!showPanel || suggestions.length === 0) { if (event.key === 'Escape') setOpen(false); return; }
            if (event.key === 'ArrowDown') { event.preventDefault(); setActiveIndex((index) => (index + 1) % suggestions.length); }
            else if (event.key === 'ArrowUp') { event.preventDefault(); setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1)); }
            else if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); selectMovie(suggestions[activeIndex].id); }
            else if (event.key === 'Escape') { setOpen(false); setActiveIndex(-1); }
          }}
          type="search"
          role="combobox"
          aria-label="Tìm phim"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls="movie-search-suggestions"
          aria-activedescendant={activeIndex >= 0 ? `movie-suggestion-${suggestions[activeIndex]?.id}` : undefined}
          placeholder="Tìm phim..."
          className={mobile ? 'min-h-11 w-full rounded-full border border-border bg-surface-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-primary' : 'w-full bg-transparent text-sm outline-none placeholder:text-text-muted'}
        />
      </div>
      {showPanel && (
        <div id="movie-search-suggestions" role="listbox" aria-label="Gợi ý phim" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-[60] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
          {isFetching && suggestions.length === 0 ? <p className="px-4 py-3 text-sm text-text-muted">Đang tìm phim...</p> : suggestions.length > 0 ? suggestions.map((movie, index) => (
            <button
              id={`movie-suggestion-${movie.id}`}
              key={movie.id}
              type="button"
              role="option"
              aria-selected={index === activeIndex}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectMovie(movie.id)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex min-h-16 w-full items-center gap-3 px-3 py-2 text-left transition ${index === activeIndex ? 'bg-primary/15' : 'hover:bg-white/5'}`}
            >
              <PosterPlaceholder src={movie.posterUrl} label={movie.name} className="h-12 w-9 shrink-0" rounded="rounded" />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{movie.name}</span>
                <span className="mt-0.5 block text-xs text-text-muted">{movie.isShowing ? 'Đang chiếu' : 'Sắp chiếu'} · {movie.ageRating}</span>
              </span>
            </button>
          )) : <p className="px-4 py-3 text-sm text-text-muted">Không tìm thấy phim phù hợp.</p>}
        </div>
      )}
    </form>
  );
}
