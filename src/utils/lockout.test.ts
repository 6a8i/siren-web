import { describe, expect, it } from 'vitest';

import {
    getEarliestLockoutEnd,
    getLockoutEnd,
    getLockoutRemainingMinutes,
    isMemberLockedOut
} from './lockout';

const NOW = Date.parse('2026-10-28T12:00:00Z');
const MINUTE = 60_000;

const lockedUntil = (minutesFromNow: number) => ({
    IsLockedOut: true,
    LockedOutUntil: new Date(NOW + minutesFromNow * MINUTE).toISOString()
});

describe('getLockoutEnd()', () => {
    it('parses the end time', () => {
        expect(getLockoutEnd(lockedUntil(15))).toBe(NOW + 15 * MINUTE);
    });

    it('is undefined without an end time or with one that does not parse', () => {
        expect(getLockoutEnd({ IsLockedOut: true })).toBeUndefined();
        expect(getLockoutEnd({ IsLockedOut: true, LockedOutUntil: null })).toBeUndefined();
        expect(getLockoutEnd({ IsLockedOut: true, LockedOutUntil: '' })).toBeUndefined();
        expect(getLockoutEnd({ IsLockedOut: true, LockedOutUntil: 'soon' })).toBeUndefined();
    });
});

describe('isMemberLockedOut()', () => {
    it('is locked while the end time is in the future', () => {
        expect(isMemberLockedOut(lockedUntil(15), NOW)).toBe(true);
        expect(isMemberLockedOut(lockedUntil(0.01), NOW)).toBe(true);
    });

    it('unlocks on its own once the end time passes', () => {
        expect(isMemberLockedOut(lockedUntil(0), NOW)).toBe(false);
        expect(isMemberLockedOut(lockedUntil(-1), NOW)).toBe(false);
    });

    it('trusts the server flag when there is no end time (an older server)', () => {
        expect(isMemberLockedOut({ IsLockedOut: true }, NOW)).toBe(true);
        expect(isMemberLockedOut({ IsLockedOut: false }, NOW)).toBe(false);
    });

    it('is never locked when the server says it is not, whatever the end time says', () => {
        expect(isMemberLockedOut({ ...lockedUntil(15), IsLockedOut: false }, NOW)).toBe(false);
    });
});

describe('getLockoutRemainingMinutes()', () => {
    it('rounds the remaining time up to whole minutes', () => {
        expect(getLockoutRemainingMinutes(lockedUntil(15), NOW)).toBe(15);
        expect(getLockoutRemainingMinutes(lockedUntil(14.2), NOW)).toBe(15);
        expect(getLockoutRemainingMinutes(lockedUntil(0.5), NOW)).toBe(1);
    });

    it('never reads zero while still locked', () => {
        expect(getLockoutRemainingMinutes(lockedUntil(0.001), NOW)).toBe(1);
    });

    it('is zero when not locked or when the lockout has no end', () => {
        expect(getLockoutRemainingMinutes(lockedUntil(-1), NOW)).toBe(0);
        expect(getLockoutRemainingMinutes({ IsLockedOut: false }, NOW)).toBe(0);
        expect(getLockoutRemainingMinutes({ IsLockedOut: true }, NOW)).toBe(0);
    });
});

describe('getEarliestLockoutEnd()', () => {
    it('finds the first lockout to end among the locked members', () => {
        const members = [ lockedUntil(15), lockedUntil(3), { IsLockedOut: false }, lockedUntil(9) ];

        expect(getEarliestLockoutEnd(members, NOW)).toBe(NOW + 3 * MINUTE);
    });

    it('skips lockouts that already ended and ones without an end', () => {
        expect(getEarliestLockoutEnd([ lockedUntil(-5), lockedUntil(7) ], NOW)).toBe(NOW + 7 * MINUTE);
        expect(getEarliestLockoutEnd([ { IsLockedOut: true }, lockedUntil(7) ], NOW)).toBe(NOW + 7 * MINUTE);
    });

    it('is undefined when nothing is counting down', () => {
        expect(getEarliestLockoutEnd([], NOW)).toBeUndefined();
        expect(getEarliestLockoutEnd([ { IsLockedOut: false }, { IsLockedOut: true } ], NOW)).toBeUndefined();
        expect(getEarliestLockoutEnd([ lockedUntil(-1) ], NOW)).toBeUndefined();
    });
});
