import { Check } from 'lucide-react';

const steps = ['Chọn suất chiếu', 'Chọn ghế', 'Xác nhận', 'Hoàn tất'];

export default function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-center">
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={[
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  done
                    ? 'bg-primary text-white'
                    : active
                      ? 'border-2 border-primary text-primary'
                      : 'border border-border text-text-muted',
                ].join(' ')}
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className={`hidden text-xs sm:block ${active || done ? 'text-text' : 'text-text-muted'}`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && (
              <div className={`mx-2 h-px flex-1 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
