import type { Review } from '@/types';

export const reviews: Review[] = [
  {
    id: 1,
    movieId: 1,
    userId: 2,
    userName: 'Lê Thúy Hường',
    rating: 5,
    comment: 'Phim hay, diễn xuất xuất sắc, kịch bản cuốn hút từ đầu đến cuối!',
    verified: true,
    likedBy: [1],
    reportedBy: [],
    createdAt: '2026-07-20T10:00:00.000Z',
  },
  {
    id: 2,
    movieId: 1,
    userId: 1,
    userName: 'Quản trị viên',
    rating: 4,
    comment: 'Nội dung tốt nhưng nhịp phim hơi chậm ở giữa.',
    verified: false,
    likedBy: [],
    reportedBy: [],
    createdAt: '2026-07-21T08:30:00.000Z',
  },
];

let reviewIdCounter = reviews.length + 1;
export function nextReviewId() {
  return reviewIdCounter++;
}
