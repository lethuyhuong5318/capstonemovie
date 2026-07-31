import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createMovie,
  fetchMovieById,
  updateMovie,
  type MovieFormValues,
} from '@/services/movieService';

const AGE_RATINGS = ['P', 'K', 'T13', 'T16', 'T18'] as const;

const schema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên phim'),
  englishName: z.string().min(1, 'Vui lòng nhập tên tiếng Anh'),
  trailerUrl: z.string().min(1, 'Vui lòng nhập link trailer'),
  description: z.string().min(1, 'Vui lòng nhập mô tả'),
  genres: z.string().min(1, 'Vui lòng nhập ít nhất một thể loại'),
  durationMinutes: z.number().min(1, 'Thời lượng không hợp lệ'),
  releaseDate: z.string().min(1, 'Vui lòng chọn ngày khởi chiếu'),
  ageRating: z.enum(AGE_RATINGS),
  isShowing: z.boolean(),
  isUpcoming: z.boolean(),
  isHot: z.boolean(),
});

export default function MovieFormPage() {
  const { id } = useParams();
  const movieId = id ? Number(id) : undefined;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [posterPreview, setPosterPreview] = useState<string | null>(null);

  const { data: existing } = useQuery({
    queryKey: ['movie', movieId],
    queryFn: () => fetchMovieById(movieId!),
    enabled: !!movieId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MovieFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      englishName: '',
      trailerUrl: '',
      description: '',
      genres: '',
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
        englishName: existing.englishName,
        trailerUrl: existing.trailerUrl,
        description: existing.description,
        genres: existing.genres.join(', '),
        durationMinutes: existing.durationMinutes,
        releaseDate: existing.releaseDate.slice(0, 10),
        ageRating: existing.ageRating,
        isShowing: existing.isShowing,
        isUpcoming: existing.isUpcoming,
        isHot: existing.isHot,
      });
    }
  }, [existing, reset]);

  const mutation = useMutation({
    mutationFn: (values: MovieFormValues) =>
      movieId ? updateMovie(movieId, values) : createMovie(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-movies'] });
      queryClient.invalidateQueries({ queryKey: ['movies', 'all'] });
      navigate('/admin/movies');
    },
  });

  function handlePosterChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Gửi lên backend thật sẽ dùng FormData: formData.append('poster', file)
    const file = e.target.files?.[0];
    if (file) setPosterPreview(URL.createObjectURL(file));
  }

  const onSubmit = (values: MovieFormValues) => mutation.mutate(values);

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
              {posterPreview ? (
                <img src={posterPreview} alt="Poster preview" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-text-muted">Chưa có ảnh</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handlePosterChange} className="text-xs" />
          </label>
        </div>

        <div className="flex flex-col gap-4 md:col-span-2">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tên phim" error={errors.name?.message}>
              <input {...register('name')} className="input" />
            </FormField>
            <FormField label="Tên tiếng Anh" error={errors.englishName?.message}>
              <input {...register('englishName')} className="input" />
            </FormField>
          </div>

          <FormField label="Link trailer (YouTube embed)" error={errors.trailerUrl?.message}>
            <input {...register('trailerUrl')} className="input" placeholder="https://www.youtube.com/embed/..." />
          </FormField>
          <FormField label="Mô tả" error={errors.description?.message}>
            <textarea {...register('description')} rows={4} className="input resize-none" />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Thể loại (cách nhau bởi dấu phẩy)" error={errors.genres?.message}>
              <input {...register('genres')} className="input" placeholder="Hành động, Viễn tưởng" />
            </FormField>
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

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={mutation.isPending}
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
