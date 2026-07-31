import { reviews, nextReviewId } from '@/mocks/reviews';
import { bookings } from '@/mocks/bookings';
import { showtimes } from '@/mocks/showtimes';
import { delay } from '@/services/delay';
import type { Review } from '@/types';

function hasWatched(movieId: number, userId: number) {
  return bookings.some((b) => {
    if (b.userId !== userId) return false;
    const showtime = showtimes.find((s) => s.id === b.showtimeId);
    return showtime?.movieId === movieId;
  });
}

export async function fetchReviewsByMovie(movieId: number) {
  const list = reviews
    .filter((r) => r.movieId === movieId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const average = list.length ? list.reduce((sum, r) => sum + r.rating, 0) / list.length : 0;
  return delay({ reviews: list, average, count: list.length });
}

export interface SubmitReviewPayload {
  movieId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
}

export class ReviewValidationError extends Error {}

export async function submitReview(payload: SubmitReviewPayload) {
  if (payload.rating < 1 || payload.rating > 5) {
    throw new ReviewValidationError('Vui lòng chọn số sao từ 1 đến 5.');
  }
  if (!payload.comment.trim()) {
    throw new ReviewValidationError('Vui lòng nhập nội dung bình luận.');
  }

  const existing = reviews.find((r) => r.movieId === payload.movieId && r.userId === payload.userId);
  if (existing) {
    existing.rating = payload.rating;
    existing.comment = payload.comment.trim();
    existing.updatedAt = new Date().toISOString();
    return delay(existing);
  }

  const review: Review = {
    id: nextReviewId(),
    movieId: payload.movieId,
    userId: payload.userId,
    userName: payload.userName,
    rating: payload.rating,
    comment: payload.comment.trim(),
    verified: hasWatched(payload.movieId, payload.userId),
    likedBy: [],
    reportedBy: [],
    createdAt: new Date().toISOString(),
  };
  reviews.push(review);
  return delay(review);
}

export async function deleteReview(id: number, userId: number) {
  const idx = reviews.findIndex((r) => r.id === id && r.userId === userId);
  if (idx >= 0) reviews.splice(idx, 1);
  return delay(undefined);
}

export async function toggleLikeReview(id: number, userId: number) {
  const review = reviews.find((r) => r.id === id);
  if (review) {
    const idx = review.likedBy.indexOf(userId);
    if (idx >= 0) review.likedBy.splice(idx, 1);
    else review.likedBy.push(userId);
  }
  return delay(review);
}

export async function reportReview(id: number, userId: number) {
  const review = reviews.find((r) => r.id === id);
  if (review && !review.reportedBy.includes(userId)) {
    review.reportedBy.push(userId);
  }
  return delay(review);
}
