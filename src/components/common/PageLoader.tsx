export default function PageLoader() {
  return (
    <div role="status" aria-live="polite" className="flex min-h-[50vh] items-center justify-center">
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      <span className="sr-only">Đang tải...</span>
    </div>
  );
}
