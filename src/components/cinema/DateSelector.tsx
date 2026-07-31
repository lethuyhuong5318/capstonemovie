import { formatShortDate } from '@/utils/format';

interface Props {
  dates: string[];
  activeDate: string | null;
  onSelect: (date: string) => void;
}

export default function DateSelector({ dates, activeDate, onSelect }: Props) {
  return (
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
      {dates.map((d) => {
        const { weekday, day, month } = formatShortDate(d);
        const active = d === activeDate;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            className={`flex shrink-0 flex-col items-center rounded-md px-4 py-2 text-xs transition ${
              active ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surface-elevated'
            }`}
          >
            <span className="capitalize">{weekday}</span>
            <span className="text-sm font-semibold">
              {day}/{month}
            </span>
          </button>
        );
      })}
    </div>
  );
}
