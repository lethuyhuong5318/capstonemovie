import type { AgeRating } from '@/types';

const styles: Record<AgeRating, string> = {
  P: 'bg-success/20 text-success',
  K: 'bg-sky-500/20 text-sky-400',
  T13: 'bg-warning/20 text-warning',
  T16: 'bg-orange-500/20 text-orange-400',
  T18: 'bg-error/20 text-error',
};

export default function AgeBadge({ rating }: { rating: AgeRating }) {
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${styles[rating]}`}>
      {rating}
    </span>
  );
}
