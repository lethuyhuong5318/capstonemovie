import { Check } from 'lucide-react';

const steps = ['Chọn suất chiếu', 'Chọn ghế', 'Xác nhận', 'Hoàn tất'];

export default function ProgressSteps({ current }: { current: number }) {
  return (
    <div className="flex items-start" aria-label={`Bước ${current} trong ${steps.length}`}>
      {steps.map((label, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <div key={label} className="flex flex-1 items-center last:flex-none">
            <div className="flex min-w-16 flex-col items-center gap-2 text-center">
              <div
                className={[
                  'flex h-9 w-9 items-center justify-center rounded-full border text-xs font-bold transition-all duration-300',
                  done
                    ? 'border-primary bg-primary text-white shadow-[0_0_20px_rgba(230,57,70,.22)]'
                    : active
                      ? 'border-primary bg-primary text-white shadow-[0_0_22px_rgba(230,57,70,.35)]'
                      : 'border-white/15 bg-surface-elevated text-text-muted',
                ].join(' ')}
              >
                {done ? <Check size={14} /> : step}
              </div>
              <span
                className={`hidden text-[11px] font-semibold uppercase tracking-[0.08em] sm:block ${active ? 'text-primary' : active || done ? 'text-text' : 'text-text-muted'}`}
              >
                {label}
              </span>
            </div>
            {step < steps.length && (
              <div className={`mx-2 mt-[18px] h-px flex-1 ${done ? 'bg-primary' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
