import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, Pencil, Star, ThumbsUp, Trash2 } from 'lucide-react';
import {
  deleteReview,
  fetchReviewsByMovie,
  reportReview,
  submitReview,
  toggleLikeReview,
  ReviewValidationError,
} from '@/services/reviewService';
import { useAuthStore } from '@/store/authStore';
import StarRatingInput from '@/components/movie/StarRatingInput';

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Hôm nay';
  if (days === 1) return '1 ngày trước';
  if (days < 30) return `${days} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}

export default function ReviewSection({ movieId }: { movieId: number }) {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [editing, setEditing] = useState(false);
  const [reportedIds, setReportedIds] = useState<number[]>([]);

  const { data } = useQuery({
    queryKey: ['reviews', movieId],
    queryFn: () => fetchReviewsByMovie(movieId),
  });

  const myReview = useMemo(
    () => data?.reviews.find((r) => r.userId === user?.id),
    [data, user],
  );

  const submitMutation = useMutation({
    mutationFn: submitReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', movieId] });
      setEditing(false);
      setComment('');
      setRating(5);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteReview(id, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', movieId] }),
  });

  const likeMutation = useMutation({
    mutationFn: (id: number) => toggleLikeReview(id, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', movieId] }),
  });

  function handleReport(id: number) {
    if (!user) return;
    reportReview(id, user.id);
    setReportedIds((prev) => [...prev, id]);
  }

  function startEdit() {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment);
    }
    setEditing(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    submitMutation.mutate({ movieId, userId: user.id, userName: user.fullName, rating, comment });
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-xl font-semibold">Đánh giá & bình luận</h2>
        {data && data.count > 0 && (
          <span className="flex items-center gap-1 text-sm text-accent">
            <Star size={14} fill="currentColor" /> {data.average.toFixed(1)} ({data.count})
          </span>
        )}
      </div>

      {!user ? (
        <p className="mb-6 rounded-lg border border-border bg-surface p-4 text-sm text-text-muted">
          <Link to="/login" className="text-primary hover:underline">
            Đăng nhập
          </Link>{' '}
          để viết đánh giá cho phim này.
        </p>
      ) : myReview && !editing ? (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-text-muted">Bạn đã đánh giá phim này.</p>
          <button type="button" onClick={startEdit} className="flex items-center gap-1.5 text-sm text-primary">
            <Pencil size={14} /> Sửa đánh giá
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-surface p-4">
          <StarRatingInput value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Chia sẻ cảm nhận của bạn về bộ phim..."
            className="input resize-none"
          />
          {submitMutation.isError && (
            <p className="text-sm text-error">
              {submitMutation.error instanceof ReviewValidationError
                ? submitMutation.error.message
                : 'Gửi đánh giá thất bại.'}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={submitMutation.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary-hover disabled:opacity-50"
            >
              {submitMutation.isPending ? 'Đang gửi...' : myReview ? 'Cập nhật' : 'Gửi đánh giá'}
            </button>
            {editing && (
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-md bg-surface-elevated px-4 py-2 text-sm hover:text-text"
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      )}

      <div className="flex flex-col gap-4">
        {(data?.reviews ?? []).map((review) => {
          const liked = user ? review.likedBy.includes(user.id) : false;
          const isMine = user?.id === review.userId;
          const reported = reportedIds.includes(review.id) || (user ? review.reportedBy.includes(user.id) : false);
          return (
            <div key={review.id} className="rounded-lg border border-border bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{review.userName}</p>
                    {review.verified && (
                      <span className="rounded bg-success/20 px-1.5 py-0.5 text-[10px] font-semibold text-success">
                        Đã xem
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-accent">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < review.rating ? 'currentColor' : 'none'} />
                    ))}
                    <span className="ml-2 text-xs text-text-muted">{timeAgo(review.createdAt)}</span>
                  </div>
                </div>
                {isMine && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(review.id)}
                    className="text-text-muted hover:text-error"
                    aria-label="Xóa bình luận"
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm text-text-muted">{review.comment}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-text-muted">
                <button
                  type="button"
                  disabled={!user}
                  onClick={() => likeMutation.mutate(review.id)}
                  className={`flex items-center gap-1 hover:text-primary disabled:cursor-not-allowed ${liked ? 'text-primary' : ''}`}
                >
                  <ThumbsUp size={13} fill={liked ? 'currentColor' : 'none'} /> {review.likedBy.length}
                </button>
                <button
                  type="button"
                  disabled={!user || reported}
                  onClick={() => handleReport(review.id)}
                  className="flex items-center gap-1 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flag size={13} /> {reported ? 'Đã báo cáo' : 'Báo cáo'}
                </button>
              </div>
            </div>
          );
        })}
        {data && data.count === 0 && (
          <p className="text-sm text-text-muted">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
        )}
      </div>
    </div>
  );
}
