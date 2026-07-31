import { Star } from 'lucide-react';

interface Props {
  value: number;
  onChange: (value: number) => void;
  size?: number;
}

export default function StarRatingInput({ value, onChange, size = 22 }: Props) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`${n} sao`}
          className="text-accent transition hover:scale-110"
        >
          <Star size={size} fill={n <= value ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  );
}
