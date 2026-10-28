import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { describe, expect, it } from 'vitest';

import { filterFamilySessions, getSessionProgress, sortFamilySessions } from './familySessions';

const NOW = Date.parse('2026-10-28T12:00:00Z');
const SECOND = 1000;

const session = (overrides: Partial<SessionInfoDto>, secondsAgo = 0): SessionInfoDto => ({
    Id: `session-${overrides.UserName ?? 'anon'}`,
    UserId: 'user-1',
    UserName: 'Parent',
    LastActivityDate: new Date(NOW - secondsAgo * SECOND).toISOString(),
    ...overrides
});

describe('filterFamilySessions()', () => {
    it('keeps the sessions of profiles seen within the window', () => {
        const recent = session({ UserName: 'Parent' }, 30);
        const old = session({ UserName: 'Kid' }, 961);
        const edge = session({ UserName: 'Teen' }, 960);

        expect(filterFamilySessions([ recent, old, edge ], NOW)).toEqual([ recent, edge ]);
    });

    it('drops device-only sessions and ones without a usable activity date', () => {
        const noUser = session({ UserId: undefined, UserName: null });
        const noDate = session({ LastActivityDate: undefined });
        const badDate = session({ LastActivityDate: 'yesterday' });
        const fine = session({ UserName: 'Parent' });

        expect(filterFamilySessions([ noUser, noDate, badDate, fine ], NOW)).toEqual([ fine ]);
    });

    it('takes a custom window', () => {
        const recent = session({ UserName: 'Parent' }, 30);
        const older = session({ UserName: 'Kid' }, 120);

        expect(filterFamilySessions([ recent, older ], NOW, 60)).toEqual([ recent ]);
    });
});

describe('sortFamilySessions()', () => {
    it('puts playing sessions first, then sorts by profile name', () => {
        const idleZed = session({ UserName: 'Zed' });
        const idleAnn = session({ UserName: 'Ann' });
        const playingTom = session({ UserName: 'Tom', NowPlayingItem: { Name: 'Movie' } });
        const playingBea = session({ UserName: 'Bea', NowPlayingItem: { Name: 'Show' } });

        const sorted = sortFamilySessions([ idleZed, playingTom, idleAnn, playingBea ]);

        expect(sorted.map(s => s.UserName)).toEqual([ 'Bea', 'Tom', 'Ann', 'Zed' ]);
    });

    it('does not change the list it was given', () => {
        const sessions = [ session({ UserName: 'Zed' }), session({ UserName: 'Ann' }) ];
        const copy = [ ...sessions ];

        sortFamilySessions(sessions);

        expect(sessions).toEqual(copy);
    });
});

describe('getSessionProgress()', () => {
    it('is the played share of the item in percent', () => {
        expect(getSessionProgress(session({
            NowPlayingItem: { RunTimeTicks: 2000 },
            PlayState: { PositionTicks: 500 }
        }))).toBe(25);
    });

    it('stays within 0 and 100', () => {
        expect(getSessionProgress(session({
            NowPlayingItem: { RunTimeTicks: 1000 },
            PlayState: { PositionTicks: 1500 }
        }))).toBe(100);
        expect(getSessionProgress(session({
            NowPlayingItem: { RunTimeTicks: 1000 },
            PlayState: { PositionTicks: 0 }
        }))).toBe(0);
    });

    it('is undefined when nothing plays or the length or position is unknown', () => {
        expect(getSessionProgress(session({}))).toBeUndefined();
        expect(getSessionProgress(session({ NowPlayingItem: { Name: 'Live' }, PlayState: { PositionTicks: 10 } }))).toBeUndefined();
        expect(getSessionProgress(session({ NowPlayingItem: { RunTimeTicks: 1000 }, PlayState: {} }))).toBeUndefined();
        expect(getSessionProgress(session({ NowPlayingItem: { RunTimeTicks: 0 }, PlayState: { PositionTicks: 0 } }))).toBeUndefined();
    });
});
