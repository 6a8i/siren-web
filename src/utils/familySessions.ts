/**
 * What the "watching now" section needs from the sessions the server lists for a family
 * administrator: the ones that belong to a profile and were seen recently, playing first.
 */

import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';

/** Sessions seen in the last 16 minutes, the same window the dashboard uses. */
export const SESSION_ACTIVE_WITHIN_SECONDS = 960;

const MS_PER_SECOND = 1000;
const PERCENT = 100;

/**
 * The sessions of profiles seen within the window. The socket pushes every session the caller may
 * see, including device-only ones without a user and ones idle for hours; neither is a profile
 * watching anything.
 */
export function filterFamilySessions(
    sessions: SessionInfoDto[],
    now = Date.now(),
    activeWithinSeconds = SESSION_ACTIVE_WITHIN_SECONDS
): SessionInfoDto[] {
    const since = now - activeWithinSeconds * MS_PER_SECOND;

    return sessions.filter(session => {
        if (!session.UserId || !session.LastActivityDate) return false;
        const lastActivity = Date.parse(session.LastActivityDate);
        return !Number.isNaN(lastActivity) && lastActivity >= since;
    });
}

/** Playing sessions first, then by profile name, so the list keeps its order between refreshes. */
export function sortFamilySessions(sessions: SessionInfoDto[]): SessionInfoDto[] {
    return [ ...sessions ].sort((a, b) => {
        const playing = Number(!!b.NowPlayingItem) - Number(!!a.NowPlayingItem);
        if (playing !== 0) return playing;
        return (a.UserName ?? '').localeCompare(b.UserName ?? '');
    });
}

/** How far into the playing item the session is, in percent; undefined when nothing plays or the length is unknown. */
export function getSessionProgress(session: SessionInfoDto): number | undefined {
    const position = session.PlayState?.PositionTicks;
    const runTime = session.NowPlayingItem?.RunTimeTicks;
    if (position == null || !runTime) return undefined;

    return Math.min(Math.max((position / runTime) * PERCENT, 0), PERCENT);
}
