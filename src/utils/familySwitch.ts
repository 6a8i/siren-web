import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client';
import type { ApiClient } from 'jellyfin-apiclient';

import viewContainer from 'components/viewContainer';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { markProfileChosen } from 'utils/profileSelection';
import { queryClient } from 'utils/query/queryClient';

/** The connection manager hooks this onto every ApiClient; the typings do not declare it. */
type AuthenticatingApiClient = ApiClient & {
    onAuthenticated?: (apiClient: ApiClient, result: AuthenticationResult) => Promise<unknown>
};

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export class ProfileSwitchError extends Error {
    readonly status?: number;

    constructor(status?: number) {
        super(status ? `Profile switch failed (${status})` : 'Profile switch failed');
        this.name = 'ProfileSwitchError';
        this.status = status;
    }

    /** A wrong PIN, as opposed to a connection or server problem. */
    get isWrongPin() {
        return this.status === HTTP_UNAUTHORIZED;
    }

    /** The server refused before checking the PIN: the profile is disabled or locked out. */
    get isRefused() {
        return this.status === HTTP_FORBIDDEN;
    }
}

/**
 * Signs this device in as another profile of the current user's family. On success the page reloads
 * on the home screen: settings, theme and home sections are read per user all over the app, and a
 * reload is the one sure way nothing from the previous profile lingers.
 */
export async function switchFamilyProfile(familyId: string, userId: string, pin = ''): Promise<void> {
    const apiClient = ServerConnections.currentApiClient() as AuthenticatingApiClient | undefined;
    if (!apiClient) {
        throw new Error('[familySwitch] no active server connection');
    }

    let result: AuthenticationResult;
    try {
        result = await apiClient.ajax({
            type: 'POST',
            url: apiClient.getUrl(`Families/${encodeURIComponent(familyId)}/Members/${encodeURIComponent(userId)}/Switch`),
            data: JSON.stringify({ Pw: pin }),
            contentType: 'application/json',
            dataType: 'json'
        });
    } catch (err) {
        throw new ProfileSwitchError((err as { status?: number } | undefined)?.status);
    }

    // The same path a login takes: stores the new token and raises 'localusersignedin'.
    if (apiClient.onAuthenticated) {
        await apiClient.onAuthenticated(apiClient, result);
    } else {
        apiClient.setAuthenticationInfo(result.AccessToken ?? undefined, result.User?.Id);
    }

    // An explicit choice: the selector stays out of the way for the rest of the session.
    markProfileChosen(apiClient.serverId(), userId);

    queryClient.clear();
    viewContainer.reset();

    window.location.hash = '#/home';
    window.location.reload();
}
