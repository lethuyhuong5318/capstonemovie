import { useEffect } from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const RELOAD_FLAG = 'cinewave-chunk-reload';

function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|dynamically imported module|Importing a module script failed/i.test(
    message,
  );
}

export default function RouteErrorBoundary() {
  const error = useRouteError();
  const chunkLoadError = isChunkLoadError(error);

  useEffect(() => {
    if (!chunkLoadError) return;


    if (sessionStorage.getItem(RELOAD_FLAG)) return;
    sessionStorage.setItem(RELOAD_FLAG, '1');
    window.location.reload();
  }, [chunkLoadError]);

  if (chunkLoadError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <RefreshCw size={28} className="animate-spin text-primary" />
        <p className="text-text-muted">Đang tải lại trang với bản cập nhật mới nhất...</p>
      </div>
    );
  }

  const message = isRouteErrorResponse(error)
    ? error.statusText || `Lỗi ${error.status}`
    : error instanceof Error
      ? error.message
      : 'Đã có lỗi không xác định xảy ra.';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Rất tiếc, đã có lỗi xảy ra</h1>
      <p className="max-w-md text-sm text-text-muted">{message}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium hover:bg-primary-hover"
      >
        <RefreshCw size={16} /> Tải lại trang
      </button>
    </div>
  );
}
