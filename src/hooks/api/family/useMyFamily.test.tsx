import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import React, { type FC, type PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext, type JellyfinApiContext } from 'hooks/useApi';
import { renderHook, waitFor } from 'test-utils/renderHook';
import type { FamilyDto } from 'types/family';

import { FAMILIES_QUERY_KEY } from './queryKeys';
import { useMyFamily } from './useMyFamily';

// useApi imports the connection manager, which drags in the app host and its webpack-time defines.
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

const BASE_PATH = 'https://siren.test';
const USER: UserDto = { Id: 'user-1', Name: 'Parent' };

const FAMILY: FamilyDto = {
    Id: 'family-1',
    Name: 'The Smiths',
    DateCreated: '2026-01-01T00:00:00Z',
    MemberCount: 2,
    MaxMembers: 6
};

/** A fake SDK Api: the family calls only use its base path, authorization header and axios instance. */
function createApi() {
    const get = vi.fn();
    const api = {
        basePath: BASE_PATH,
        authorizationHeader: 'MediaBrowser Token="token-1"',
        axiosInstance: { get }
    } as unknown as Api;

    return { api, get };
}

function httpError(status: number): AxiosError {
    const response = { data: '', status, statusText: '', headers: {}, config: {} } as AxiosResponse;
    return new AxiosError(`Request failed with status code ${status}`, AxiosError.ERR_BAD_RESPONSE, {} as InternalAxiosRequestConfig, undefined, response);
}

function renderMyFamily(context: JellyfinApiContext) {
    const ApiProvider: FC<PropsWithChildren> = ({ children }) => (
        <ApiContext.Provider value={context}>{children}</ApiContext.Provider>
    );

    return renderHook(() => useMyFamily(), { wrapper: ApiProvider });
}

describe('useMyFamily()', () => {
    const rendered: { unmount: () => void }[] = [];
    const render = (context: JellyfinApiContext) => {
        const hook = renderMyFamily(context);
        rendered.push(hook);
        return hook;
    };

    afterEach(() => {
        for (const hook of rendered.splice(0)) {
            hook.unmount();
        }
    });

    it('fetches the family of the signed-in user from Families/Mine', async () => {
        const { api, get } = createApi();
        get.mockResolvedValue({ data: FAMILY });

        const { result, queryClient } = render({ api, user: USER });

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toEqual(FAMILY);
        expect(get).toHaveBeenCalledTimes(1);
        expect(get).toHaveBeenCalledWith(`${BASE_PATH}/Families/Mine`, expect.objectContaining({
            headers: { Authorization: 'MediaBrowser Token="token-1"' }
        }));
        expect(queryClient.getQueryData([ FAMILIES_QUERY_KEY, 'Mine', USER.Id ])).toEqual(FAMILY);
    });

    it('resolves to null when the user has no family (404)', async () => {
        const { api, get } = createApi();
        get.mockRejectedValue(httpError(404));

        const { result } = render({ api, user: USER });

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toBeNull();
        expect(result.current.isError).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('propagates any other HTTP error', async () => {
        const { api, get } = createApi();
        const error = httpError(500);
        get.mockRejectedValue(error);

        const { result } = render({ api, user: USER });

        await waitFor(() => result.current.isError);

        expect(result.current.error).toBe(error);
        expect(result.current.data).toBeUndefined();
        // retry is off for this query, so the one failed request is all there was
        expect(get).toHaveBeenCalledTimes(1);
    });

    it('propagates errors that are not HTTP responses', async () => {
        const { api, get } = createApi();
        const error = new TypeError('Network Error');
        get.mockRejectedValue(error);

        const { result } = render({ api, user: USER });

        await waitFor(() => result.current.isError);

        expect(result.current.error).toBe(error);
    });

    it('does nothing until there is an api and a signed-in user', async () => {
        const { api, get } = createApi();

        const withoutUser = render({ api });
        const withoutApi = render({ user: USER });

        await waitFor(() => withoutUser.result.current.fetchStatus === 'idle' && withoutApi.result.current.fetchStatus === 'idle');

        expect(withoutUser.result.current.isPending).toBe(true);
        expect(withoutApi.result.current.isPending).toBe(true);
        expect(get).not.toHaveBeenCalled();
    });
});
