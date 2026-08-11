import { lazy, Suspense, type ComponentType } from 'react';
import PageLoader from '@/components/common/PageLoader';

export function lazyRoute(loader: () => Promise<{ default: ComponentType }>) {
  const Component = lazy(loader);
  return function LazyRoute() {
    return (
      <Suspense fallback={<PageLoader />}>
        <Component />
      </Suspense>
    );
  };
}
