import { Clapperboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
        <Clapperboard size={18} className="text-white" />
      </span>
      <span className="text-lg font-extrabold tracking-tight">
        Cine<span className="text-primary">Wave</span>
      </span>
    </Link>
  );
}
