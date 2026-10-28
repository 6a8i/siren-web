/**
 * Which family profile this device is using. The app opens on the "Who's watching?" page until a
 * profile is explicitly chosen in the browser session; the last choice is kept per server so the
 * page can offer "Continue as X" the next time.
 */

import type { ApiClient } from 'jellyfin-apiclient';

import { getMyFamilyQuery } from 'hooks/api/family/useMyFamily';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { getFamilyId } from 'types/family';
import { queryClient } from 'utils/query/queryClient';

/** Session storage: the id of the profile chosen in this browser session. */
export const PROFILE_CHOSEN_KEY = 'siren.profileChosen';
/** Local storage: the id of the last profile chosen on a server, per server. */
export const lastProfileKey = (serverId: string) => `siren.lastProfile.${serverId}`;

type StorageArea = 'localStorage' | 'sessionStorage';

const read = (area: StorageArea, key: string): string | undefined => {
    try {
        return window[area].getItem(key) ?? undefined;
    } catch {
        // Storage can be unavailable (private mode, blocked site data); the selector then shows every time.
        return undefined;
    }
};

const write = (area: StorageArea, key: string, value: string) => {
    try {
        window[area].setItem(key, value);
    } catch {
        // See read().
    }
};

/** Records that the user explicitly picked a profile: no selector until the session ends. */
export function markProfileChosen(serverId: string, userId: string): void {
    write('sessionStorage', PROFILE_CHOSEN_KEY, userId);
    write('localStorage', lastProfileKey(serverId), userId);
}

/** Whether the given profile is the one explicitly chosen in this browser session. */
export function wasProfileChosen(userId: string): boolean {
    return read('sessionStorage', PROFILE_CHOSEN_KEY) === userId;
}

/** The profile chosen last time on this server, to offer "Continue as X". */
export function getLastProfileId(serverId: string): string | undefined {
    return read('localStorage', lastProfileKey(serverId)) || undefined;
}

/**
 * Whether the app should open on the profile selector instead of home: the signed-in user belongs
 * to a family with more than one profile and no profile was chosen in this session yet. Any
 * failure answers no, so a family hiccup never keeps the user away from home.
 */
export async function shouldOpenProfileSelector(apiClient: ApiClient): Promise<boolean> {
    try {
        const user = await apiClient.getCurrentUser();
        if (!user?.Id || !getFamilyId(user) || wasProfileChosen(user.Id)) {
            return false;
        }

        const api = ServerConnections.getApi(apiClient.serverId());
        const family = await queryClient.fetchQuery(getMyFamilyQuery(api, user.Id));
        return !!family && family.MemberCount > 1;
    } catch (err) {
        console.warn('[profileSelection] could not decide on the profile selector', err);
        return false;
    }
}
