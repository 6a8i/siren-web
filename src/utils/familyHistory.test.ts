import { describe, expect, it } from 'vitest';

import type { FamilyHistoryEntryDto } from 'types/family';

import { getHistoryContext, getHistoryProgress, getHistoryTimestamp, sortHistory } from './familyHistory';

const entry = (overrides: Partial<FamilyHistoryEntryDto> = {}): FamilyHistoryEntryDto => ({
    ItemId: 'item-1',
    Name: 'Pilot',
    Type: 'Episode',
    Date: '2026-10-27T20:00:00Z',
    Completed: false,
    ...overrides
});

describe('getHistoryContext()', () => {
    it('joins the series and the season', () => {
        expect(getHistoryContext({ SeriesName: 'Bluey', SeasonName: 'Season 2' })).toBe('Bluey · Season 2');
    });

    it('keeps whichever is there', () => {
        expect(getHistoryContext({ SeriesName: 'Bluey' })).toBe('Bluey');
        expect(getHistoryContext({ SeriesName: null, SeasonName: 'Season 2' })).toBe('Season 2');
        expect(getHistoryContext({})).toBe('');
    });
});

describe('getHistoryProgress()', () => {
    it('reports a completed item as such, whatever the percentage says', () => {
        expect(getHistoryProgress({ Completed: true, PlayedPercentage: 42 })).toEqual({ kind: 'completed' });
    });

    it('rounds and clamps a partial percentage', () => {
        expect(getHistoryProgress({ Completed: false, PlayedPercentage: 42.6 })).toEqual({ kind: 'partial', percentage: 43 });
        expect(getHistoryProgress({ Completed: false, PlayedPercentage: 140 })).toEqual({ kind: 'partial', percentage: 100 });
        expect(getHistoryProgress({ Completed: false, PlayedPercentage: -5 })).toEqual({ kind: 'partial', percentage: 0 });
    });

    it('knows nothing without a percentage', () => {
        expect(getHistoryProgress({ Completed: false })).toEqual({ kind: 'unknown' });
        expect(getHistoryProgress({ Completed: false, PlayedPercentage: null })).toEqual({ kind: 'unknown' });
        expect(getHistoryProgress({ Completed: false, PlayedPercentage: Number.NaN })).toEqual({ kind: 'unknown' });
    });
});

describe('getHistoryTimestamp()', () => {
    it('parses the ISO date', () => {
        expect(getHistoryTimestamp({ Date: '2026-10-27T20:00:00Z' })).toBe(Date.UTC(2026, 9, 27, 20));
    });

    it('is undefined for garbage', () => {
        expect(getHistoryTimestamp({ Date: 'yesterday' })).toBeUndefined();
    });
});

describe('sortHistory()', () => {
    it('puts the newest first and does not touch the input', () => {
        const older = entry({ ItemId: 'older', Date: '2026-10-25T10:00:00Z' });
        const newer = entry({ ItemId: 'newer', Date: '2026-10-27T10:00:00Z' });
        const broken = entry({ ItemId: 'broken', Date: 'n/a' });
        const input = [ older, broken, newer ];

        expect(sortHistory(input).map(item => item.ItemId)).toEqual([ 'newer', 'older', 'broken' ]);
        expect(input.map(item => item.ItemId)).toEqual([ 'older', 'broken', 'newer' ]);
    });
});
