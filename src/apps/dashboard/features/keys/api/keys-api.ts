/**
 * Siren's read-only API keys are not in the generated SDK (its `createKey` knows no `isReadOnly`
 * and there is no client for the toggle), so these two calls go through the SDK's axios instance
 * with the same authorization header its generated APIs use, like utils/sdk/family-api.ts.
 */

import type { Api } from '@jellyfin/sdk';
import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';

/** The key as Siren lists it: the SDK's fields plus whether the key may only read. */
export type SirenAuthenticationInfo = AuthenticationInfo & {
    IsReadOnly?: boolean
};

const withAuth = (api: Api) => ({
    headers: { Authorization: api.authorizationHeader }
});

export const createApiKey = (api: Api, app: string, isReadOnly: boolean) => (
    api.axiosInstance.post<void>(
        `${api.basePath}/Auth/Keys?app=${encodeURIComponent(app)}&isReadOnly=${isReadOnly}`,
        undefined,
        withAuth(api)
    )
);

/** Makes a key read-only (every non-GET request answers 403) or lifts the restriction. */
export const setApiKeyReadOnly = (api: Api, key: string, isReadOnly: boolean) => (
    api.axiosInstance.post<void>(
        `${api.basePath}/Auth/Keys/${encodeURIComponent(key)}/ReadOnly?value=${isReadOnly}`,
        undefined,
        withAuth(api)
    )
);
