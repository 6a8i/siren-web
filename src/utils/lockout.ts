/**
 * The PIN lockout as the client sees it. The server answers `IsLockedOut` for the moment of the
 * response and `LockedOutUntil` for when it ends; the pages count down from that end and notice on
 * their own when it passes instead of showing "locked" until the next refetch.
 */

import type { FamilyMemberDto } from 'types/family';

export type LockoutState = Pick<FamilyMemberDto, 'IsLockedOut' | 'LockedOutUntil'>;

const MS_PER_MINUTE = 60_000;

/** When the lockout ends, as epoch milliseconds; undefined when the member carries no (valid) end time. */
export function getLockoutEnd(member: LockoutState): number | undefined {
    if (!member.LockedOutUntil) return undefined;

    const end = Date.parse(member.LockedOutUntil);
    return Number.isNaN(end) ? undefined : end;
}

/**
 * Whether the profile is locked at the given moment: the server said so, and the end time (when
 * there is one) has not passed yet.
 */
export function isMemberLockedOut(member: LockoutState, now = Date.now()): boolean {
    if (!member.IsLockedOut) return false;

    const end = getLockoutEnd(member);
    return end === undefined || end > now;
}

/** Whole minutes left on the lockout, rounded up so it never reads "0 min" while still locked; 0 when not locked or open-ended. */
export function getLockoutRemainingMinutes(member: LockoutState, now = Date.now()): number {
    if (!isMemberLockedOut(member, now)) return 0;

    const end = getLockoutEnd(member);
    return end === undefined ? 0 : Math.max(1, Math.ceil((end - now) / MS_PER_MINUTE));
}

/** The earliest moment one of the members unlocks, as epoch milliseconds; undefined when none is locked with an end time. */
export function getEarliestLockoutEnd(members: LockoutState[], now = Date.now()): number | undefined {
    let earliest: number | undefined;
    for (const member of members) {
        if (!isMemberLockedOut(member, now)) continue;

        const end = getLockoutEnd(member);
        if (end !== undefined && (earliest === undefined || end < earliest)) {
            earliest = end;
        }
    }

    return earliest;
}
