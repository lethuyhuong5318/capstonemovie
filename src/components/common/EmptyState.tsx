import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';

interface Props {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon: Icon = Inbox, title, description, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border py-14 text-center">
      <Icon size={32} className="text-text-muted" />
      <p className="font-medium">{title}</p>
      {description && <p className="max-w-xs text-sm text-text-muted">{description}</p>}
      {action}
    </div>
  );
}
