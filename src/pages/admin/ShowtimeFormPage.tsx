import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMovieById } from '@/services/movieService';
import { createShowtime } from '@/services/showtimeService';
import { cinemaSystems } from '@/mocks/cinemas';

export default function ShowtimeFormPage() {
  const { id } = useParams();
  const movieId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: movie } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => fetchMovieById(movieId),
    enabled: Number.isFinite(movieId),
  });

  const [cinemaSystemId, setCinemaSystemId] = useState(cinemaSystems[0]?.id ?? 0);
  const cinemasOfSystem = useMemo(
    () => cinemaSystems.find((s) => s.id === cinemaSystemId)?.cinemas ?? [],
    [cinemaSystemId],
  );
  const [cinemaId, setCinemaId] = useState(cinemasOfSystem[0]?.id ?? 0);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('19:00');
  const [price, setPrice] = useState(75000);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: () =>
      createShowtime({
        movieId,
        cinemaSystemId,
        cinemaId: cinemaId || cinemasOfSystem[0]?.id,
        date,
        time,
        price,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['showtimes', movieId] });
      setSuccessMsg('Tạo lịch chiếu thành công.');
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">Tạo lịch chiếu</h1>
      <p className="mb-4 text-sm text-text-muted">Phim: {movie?.name ?? `#${movieId}`}</p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate();
        }}
        className="grid max-w-xl gap-4 rounded border border-border bg-surface p-5"
      >
        <div>
          <label className="mb-1 block text-sm text-text-muted">Hệ thống rạp</label>
          <select
            className="input"
            value={cinemaSystemId}
            onChange={(e) => {
              const val = Number(e.target.value);
              setCinemaSystemId(val);
              const first = cinemaSystems.find((s) => s.id === val)?.cinemas[0]?.id ?? 0;
              setCinemaId(first);
            }}
          >
            {cinemaSystems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-muted">Cụm rạp</label>
          <select className="input" value={cinemaId} onChange={(e) => setCinemaId(Number(e.target.value))}>
            {cinemasOfSystem.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm text-text-muted">Ngày chiếu</label>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-text-muted">Giờ chiếu</label>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-muted">Giá vé cơ bản (đ)</label>
          <input
            type="number"
            className="input"
            value={price}
            min={0}
            step={1000}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </div>

        {successMsg && <p className="text-sm text-emerald-400">{successMsg}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending}
            className="rounded bg-primary px-5 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
          >
            {mutation.isPending ? 'Đang lưu...' : 'Tạo lịch chiếu'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/movies')}
            className="rounded bg-surface-alt px-5 py-2 text-sm hover:text-text"
          >
            Quay lại
          </button>
        </div>
      </form>
    </div>
  );
}
