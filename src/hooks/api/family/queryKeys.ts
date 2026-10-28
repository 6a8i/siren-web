/** Prefix of every family query, so one invalidation refreshes lists, details and members. */
export const FAMILIES_QUERY_KEY = 'Families';

/**
 * The global query cache writes `null` into any query that fails with a 401 (see
 * utils/query/queryClient). The family hooks pass their data through this so callers only ever
 * see the real shape or `undefined`.
 */
export const nullToUndefined = <T>(data: T | null): T | undefined => data ?? undefined;
