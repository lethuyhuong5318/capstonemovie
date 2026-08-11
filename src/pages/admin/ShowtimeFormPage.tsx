import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchLiveMovieById } from '@/services/movieApiService';
import { createShowtime } from '@/services/showtimeService';
import { fetchCinemaBrands, fetchClustersBySystem } from '@/services/cinemaApiService';

export default function ShowtimeFormPage() {
  const { id } = useParams();
  const movieId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: movie } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => fetchLiveMovieById(movieId),
    enabled: Number.isFinite(movieId),
  });

  const { data: cinemaSystems = [] } = useQuery({
    queryKey: ['cinema-systems'],
    queryFn: fetchCinemaBrands,
  });
  const [cinemaSystemCode, setCinemaSystemCode] = useState('');
  const { data: cinemaClusters = [] } = useQuery({
    queryKey: ['cinema-clusters', cinemaSystemCode],
    queryFn: () => fetchClustersBySystem(cinemaSystemCode),
    enabled: Boolean(cinemaSystemCode),
  });
  const [clusterCode, setClusterCode] = useState('');
  const selectedCluster = useMemo(
    () => cinemaClusters.find((cluster) => cluster.code === clusterCode),
    [cinemaClusters, clusterCode],
  );
  const [roomId, setRoomId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState('19:00');
  const [price, setPrice] = useState(75000);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!cinemaSystemCode && cinemaSystems[0]) setCinemaSystemCode(cinemaSystems[0].code);
  }, [cinemaSystemCode, cinemaSystems]);

  useEffect(() => {
    const firstCluster = cinemaClusters[0];
    setClusterCode(firstCluster?.code ?? '');
    setRoomId(firstCluster?.rooms?.[0]?.id ?? '');
  }, [cinemaClusters]);

  const mutation = useMutation({
    mutationFn: () =>
      createShowtime({
        movieId,
        roomId,
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
            value={cinemaSystemCode}
            onChange={(e) => {
              setCinemaSystemCode(e.target.value);
              setClusterCode('');
              setRoomId('');
            }}
          >
            {cinemaSystems.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-muted">Cụm rạp</label>
          <select
            className="input"
            value={clusterCode}
            onChange={(e) => {
              const code = e.target.value;
              setClusterCode(code);
              const cluster = cinemaClusters.find((item) => item.code === code);
              setRoomId(cluster?.rooms?.[0]?.id ?? '');
            }}
          >
            {cinemaClusters.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-text-muted">Phòng chiếu</label>
          <select className="input" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
            {(selectedCluster?.rooms ?? []).map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
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
        {mutation.isError && (
          <p role="alert" className="text-sm text-error">
            {mutation.error instanceof Error ? mutation.error.message : 'Tạo lịch chiếu thất bại.'}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={mutation.isPending || !roomId}
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
