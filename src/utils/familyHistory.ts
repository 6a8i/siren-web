/**
 * What the history dialog shows of each entry a member played: the title with its series and
 * season, when, and how far it got.
 */

import type { FamilyHistoryEntryDto } from 'types/family';

const PERCENT = 100;

/** The series and season line of an episode ("Series · Season 2"); empty for a movie or a song. */
export function getHistoryContext(entry: Pick<FamilyHistoryEntryDto, 'SeriesName' | 'SeasonName'>): string {
    return [ entry.SeriesName, entry.SeasonName ].filter(Boolean).join(' · ');
}

export type HistoryProgress =
    | { kind: 'completed' }
    | { kind: 'partial', percentage: number }
    | { kind: 'unknown' };

/**
 * How far the member got: completed wins over any percentage, a percentage is rounded and kept
 * within 0 and 100, and anything else is unknown.
 */
export function getHistoryProgress(entry: Pick<FamilyHistoryEntryDto, 'Completed' | 'PlayedPercentage'>): HistoryProgress {
    if (entry.Completed) return { kind: 'completed' };

    const percentage = entry.PlayedPercentage;
    if (percentage == null || Number.isNaN(percentage)) return { kind: 'unknown' };

    return { kind: 'partial', percentage: Math.round(Math.min(Math.max(percentage, 0), PERCENT)) };
}

/** The entry's date as a timestamp, or undefined when the server sent nothing parseable. */
export function getHistoryTimestamp(entry: Pick<FamilyHistoryEntryDto, 'Date'>): number | undefined {
    const time = Date.parse(entry.Date);
    return Number.isNaN(time) ? undefined : time;
}

/** Newest first, whatever order the server used. */
export function sortHistory(entries: FamilyHistoryEntryDto[]): FamilyHistoryEntryDto[] {
    return [ ...entries ].sort((a, b) => (getHistoryTimestamp(b) ?? 0) - (getHistoryTimestamp(a) ?? 0));
}
