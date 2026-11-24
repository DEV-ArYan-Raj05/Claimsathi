/** Render a TanStack query through loading → error → empty → data, so no screen forgets one. */
import type { ReactNode } from "react";
import type { UseQueryResult } from "@tanstack/react-query";
import { SkeletonList } from "./Skeleton";
import { ErrorState } from "./StateViews";

interface QueryViewProps<T> {
  query: UseQueryResult<T>;
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}

export function QueryView<T>({ query, isEmpty, empty, loading, children }: QueryViewProps<T>) {
  if (query.isPending) return <>{loading ?? <SkeletonList />}</>;
  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />;
  if (isEmpty?.(query.data) && empty) return <>{empty}</>;
  return <>{children(query.data)}</>;
}
