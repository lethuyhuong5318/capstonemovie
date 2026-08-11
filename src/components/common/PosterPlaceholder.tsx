import { useState } from 'react';

interface Props {
  label?: string;
  className?: string;
  rounded?: string;
  src?: string;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}

export default function PosterPlaceholder({
  label = 'Poster phim',
  className = '',
  rounded = 'rounded-lg',
  src,
  loading = 'lazy',
  fetchPriority = 'auto',
}: Props) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={label}
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onError={() => setFailed(true)}
        className={`border border-border object-cover ${rounded} ${className}`}
      />
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden border border-border bg-surface-elevated ${rounded} ${className}`}
      style={{
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 2px, transparent 2px, transparent 14px)',
      }}
    >
      <span className="rounded bg-black/40 px-2 py-1 text-center font-mono text-[10px] uppercase tracking-wider text-text-muted">
        {label}
      </span>
    </div>
  );
}
