import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  createLiveMovie,
  fetchLiveMovieById,
  updateLiveMovie,
} from '@/services/movieApiService';
import imageCompression from 'browser-image-compression';

const AGE_RATINGS = ['P', 'K', 'T13', 'T16', 'T18'] as const;

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phim'),
  trailerUrl: z.string().min(1, 'Vui lòng nhập link trailer'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  durationMinutes: z.number().min(1, 'Thời lượng không hợp lệ'),
  releaseDate: z.string().min(1, 'Vui lòng chọn ngày khởi chiếu'),
  ageRating: z.enum(AGE_RATINGS),
  isShowing: z.boolean(),
  isUpcoming: z.boolean(),
  isHot: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function MovieFormPage() {
  const { id } = useParams();
  const movieId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);

  const { data: existing } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => fetchLiveMovieById(movieId!),
    enabled: !!movieId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      trailerUrl: '',
      description: '',
      durationMinutes: 120,
      releaseDate: '',
      ageRating: 'T13',
      isShowing: true,
      isUpcoming: false,
      isHot: false,
    },
  });

  useEffect(() => {
    if (existing) {
      reset({
        name: existing.name,
        trailerUrl: existing.trailerUrl,
        description: existing.description,
        durationMinutes: existing.durationMinutes,
        releaseDate: existing.releaseDate.slice(0, 10),
        ageRating: existing.ageRating,
        isShowing: existing.isShowing,
        isUpcoming: existing.isUpcoming,
        isHot: existing.isHot,
      });
      setPosterPreview(existing.posterUrl || null);
    }
  }, [existing, reset]);

  const [posterError, setPosterError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, posterFile };
      return movieId ? updateLiveMovie(movieId, payload) : createLiveMovie(payload);
    },
    onSuccess: (movie) => {
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['live-movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie', movie.id] });
      toast.success(movieId ? 'Cập nhật phim thành công' : 'Thêm phim thành công');
      navigate('/admin/movies');
    },
  });

  const submitError = mutation.isError
    ? mutation.error instanceof Error
      ? mutation.error.message
      : 'Không thể lưu phim. Vui lòng thử lại.'
    : null;

  async function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setPosterError(null);
      if (file.size > 1 * 1024 * 1024) {
        try {
          setIsCompressing(true);
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 0.9,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
          setPosterFile(compressedFile);
          setPosterPreview(URL.createObjectURL(compressedFile));
        } catch (error) {
          console.error('Error compressing image:', error);
          setPosterError('Lỗi khi nén ảnh. Vui lòng chọn ảnh khác.');
        } finally {
          setIsCompressing(false);
        }
      } else {
        setPosterFile(file);
        setPosterPreview(URL.createObjectURL(file));
      }
    }
  }

  const onSubmit = (values: FormValues) => {
    // The API rejects a create without an image, but an update keeps the
    // existing poster when no new file is attached — so only require it here.
    if (!movieId && !posterFile) {
      setPosterError('Vui lòng chọn ảnh poster');
      return;
    }
    mutation.mutate(values);
  };

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">
        {movieId ? `Sửa phim #${movieId}` : 'Thêm phim mới'}
      </h1>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-5 rounded-lg border border-border bg-surface p-5 md:grid-cols-3"
      >
        <div className="md:col-span-1">
          <label className="block">
            <span className="mb-1 block text-sm text-text-muted">Poster</span>
            <div className="mb-2 flex aspect-[2/3] items-center justify-center overflow-hidden rounded-lg bg-surface-elevated">
              {isCompressing ? (
                <span className="text-xs text-text-muted">Đang nén ảnh...</span>
              ) : posterPreview ? (
                <img src={posterPreview} alt="Poster preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-text-muted">Chưa có ảnh</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handlePosterChange} disabled={isCompressing} className="text-xs" />
            {posterError && (
              <span role="alert" className="mt-1 block text-xs text-error">
                {posterError}
              </span>
            )}
          </label>
        </div>

        <div className="flex flex-col gap-4 md:col-span-2">
          <FormField label="Tên phim" error={errors.name?.message}>
            <input {...register('name')} className="input" />
          </FormField>

          <FormField label="Link trailer (YouTube embed)" error={errors.trailerUrl?.message}>
            <input {...register('trailerUrl')} className="input" placeholder="https://www.youtube.com/embed/..." />
          </FormField>
          <FormField label="Mô tả" error={errors.description?.message}>
            <textarea {...register('description')} rows={4} className="input resize-none" />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Thời lượng (phút)" error={errors.durationMinutes?.message}>
              <input
                type="number"
                {...register('durationMinutes', { valueAsNumber: true })}
                className="input"
              />
            </FormField>
            <FormField label="Phân loại độ tuổi" error={errors.ageRating?.message}>
              <select {...register('ageRating')} className="input">
                {AGE_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Ngày khởi chiếu" error={errors.releaseDate?.message}>
            <input type="date" {...register('releaseDate')} className="input max-w-xs" />
          </FormField>

          <div className="flex flex-wrap gap-6 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isShowing')} /> Đang chiếu
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isUpcoming')} /> Sắp chiếu
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" {...register('isHot')} /> Phim hot
            </label>
          </div>

          {submitError && (
            <p role="alert" className="rounded-md border border-error/40 bg-error/10 px-3 py-2 text-sm text-error">
              {submitError}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending || isCompressing}
              className="rounded-md bg-primary px-5 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              {mutation.isPending ? 'Đang lưu...' : 'Lưu phim'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/movies')}
              className="rounded-md bg-surface-elevated px-5 py-2 text-sm hover:text-text"
            >
              Hủy
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm text-text-muted">{label}</span>
      {children}
      {error && (
        <span role="alert" className="mt-1 block text-xs text-error">
          {error}
        </span>
      )}
    </label>
  );
}
