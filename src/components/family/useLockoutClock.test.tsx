import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook } from 'test-utils/renderHook';

import { useLockoutClock } from './useLockoutClock';

const START = Date.parse('2026-10-28T12:00:00Z');
const MINUTE = 60_000;

const lockedUntil = (minutesFromStart: number) => ({
    IsLockedOut: true,
    LockedOutUntil: new Date(START + minutesFromStart * MINUTE).toISOString()
});

describe('useLockoutClock()', () => {
    const rendered: { unmount: () => void }[] = [];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(START);
    });

    afterEach(() => {
        for (const hook of rendered.splice(0)) {
            hook.unmount();
        }
        vi.useRealTimers();
    });

    const render = (members: { IsLockedOut: boolean, LockedOutUntil?: string }[], onExpire?: () => void) => {
        const hook = renderHook(() => useLockoutClock(members, onExpire));
        rendered.push(hook);
        return hook;
    };

    it('stands still while nobody is locked', () => {
        const { result } = render([ { IsLockedOut: false } ]);

        expect(result.current).toBe(START);

        act(() => {
            vi.advanceTimersByTime(5 * MINUTE);
        });

        expect(result.current).toBe(START);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('ticks once a minute while a profile is locked', () => {
        const { result } = render([ lockedUntil(15) ]);

        act(() => {
            vi.advanceTimersByTime(MINUTE - 1);
        });
        expect(result.current).toBe(START);

        act(() => {
            vi.advanceTimersByTime(1);
        });
        expect(result.current).toBe(START + MINUTE);

        act(() => {
            vi.advanceTimersByTime(2 * MINUTE);
        });
        expect(result.current).toBe(START + 3 * MINUTE);
    });

    it('jumps and refetches the moment the earliest lockout ends', () => {
        const onExpire = vi.fn();
        const { result } = render([ lockedUntil(15), lockedUntil(2.5) ], onExpire);

        act(() => {
            vi.advanceTimersByTime(2.5 * MINUTE);
        });
        expect(onExpire).not.toHaveBeenCalled();

        // a second of grace, so the server agrees the lockout is over when asked
        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(onExpire).toHaveBeenCalledTimes(1);
        expect(result.current).toBe(START + 2.5 * MINUTE + 1000);
    });

    it('then waits for the next lockout to end', () => {
        const onExpire = vi.fn();
        render([ lockedUntil(1), lockedUntil(3) ], onExpire);

        act(() => {
            vi.advanceTimersByTime(MINUTE + 1000);
        });
        expect(onExpire).toHaveBeenCalledTimes(1);

        act(() => {
            vi.advanceTimersByTime(2 * MINUTE);
        });
        expect(onExpire).toHaveBeenCalledTimes(2);

        act(() => {
            vi.advanceTimersByTime(60 * MINUTE);
        });
        expect(onExpire).toHaveBeenCalledTimes(2);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('keeps no timers for an open-ended lockout from an older server', () => {
        const { result } = render([ { IsLockedOut: true } ]);

        act(() => {
            vi.advanceTimersByTime(5 * MINUTE);
        });

        expect(result.current).toBe(START);
        expect(vi.getTimerCount()).toBe(0);
    });
});
