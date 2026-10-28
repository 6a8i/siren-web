import { useEffect, useMemo, useState } from 'react';

import { getEarliestLockoutEnd, type LockoutState } from 'utils/lockout';

const MS_PER_MINUTE = 60_000;
/** A moment after the end, so the server agrees the lockout is over when asked again. */
const EXPIRY_GRACE_MS = 1000;
/** The longest delay a timer takes before browsers fire it at once. */
const MAX_TIMEOUT_MS = 0x7fffffff;

/**
 * The clock the lockout chips read. `now` advances once a minute while any profile is locked, so
 * the remaining time stays right, and jumps the moment the earliest lockout ends, when `onExpire`
 * (a refetch) lets the server's own verdict replace the client's countdown.
 */
export function useLockoutClock(members: LockoutState[], onExpire?: () => void): number {
    const [ now, setNow ] = useState(() => Date.now());
    const earliestEnd = useMemo(() => getEarliestLockoutEnd(members, now), [ members, now ]);
    const isAnyLocked = earliestEnd !== undefined;

    useEffect(() => {
        if (!isAnyLocked) return;

        const tick = window.setInterval(() => setNow(Date.now()), MS_PER_MINUTE);
        return () => window.clearInterval(tick);
    }, [ isAnyLocked ]);

    useEffect(() => {
        if (earliestEnd === undefined) return;

        const delay = Math.min(Math.max(earliestEnd - Date.now(), 0) + EXPIRY_GRACE_MS, MAX_TIMEOUT_MS);
        const timer = window.setTimeout(() => {
            setNow(Date.now());
            onExpire?.();
        }, delay);
        return () => window.clearTimeout(timer);
    }, [ earliestEnd, onExpire ]);

    return now;
}
