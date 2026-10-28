import type { Api } from '@jellyfin/sdk';
import React, { type FC, type PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext, type JellyfinApiContext } from 'hooks/useApi';
import { renderHook, waitFor } from 'test-utils/renderHook';
import type { FamilyLibraryDto } from 'types/family';

import { FAMILIES_QUERY_KEY } from './queryKeys';
import { useFamilyLibraries } from './useFamilyLibraries';

// useApi imports the connection manager, which drags in the app host and its webpack-time defines.
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

const BASE_PATH = 'https://siren.test';

const LIBRARIES: FamilyLibraryDto[] = [
    { Id: 'lib-1', Name: 'Movies', CollectionType: 'movies' },
    { Id: 'lib-2', Name: 'Kids', CollectionType: null }
];

function createApi() {
    const get = vi.fn();
    const api = {
        basePath: BASE_PATH,
        authorizationHeader: 'MediaBrowser Token="token-1"',
        axiosInstance: { get }
    } as unknown as Api;

    return { api, get };
}

function renderLibraries(context: JellyfinApiContext, familyId?: string) {
    const ApiProvider: FC<PropsWithChildren> = ({ children }) => (
        <ApiContext.Provider value={context}>{children}</ApiContext.Provider>
    );

    return renderHook(() => useFamilyLibraries(familyId), { wrapper: ApiProvider });
}

describe('useFamilyLibraries()', () => {
    const rendered: { unmount: () => void }[] = [];
    const render = (context: JellyfinApiContext, familyId?: string) => {
        const hook = renderLibraries(context, familyId);
        rendered.push(hook);
        return hook;
    };

    afterEach(() => {
        for (const hook of rendered.splice(0)) {
            hook.unmount();
        }
    });

    it('fetches the libraries the family reaches under the family prefix', async () => {
        const { api, get } = createApi();
        get.mockResolvedValue({ data: LIBRARIES });

        const { result, queryClient } = render({ api }, 'family 1');

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toEqual(LIBRARIES);
        expect(get).toHaveBeenCalledWith(`${BASE_PATH}/Families/family%201/Libraries`, expect.objectContaining({
            headers: { Authorization: 'MediaBrowser Token="token-1"' }
        }));
        expect(queryClient.getQueryData([ FAMILIES_QUERY_KEY, 'family 1', 'Libraries' ])).toEqual(LIBRARIES);
    });

    it('turns the null the cache writes on a 401 into undefined', async () => {
        const { api, get } = createApi();
        get.mockResolvedValue({ data: null });

        const { result } = render({ api }, 'family-1');

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toBeUndefined();
    });

    it('does nothing without an api or a family', async () => {
        const { api, get } = createApi();

        const withoutFamily = render({ api });
        const withoutApi = render({}, 'family-1');

        await waitFor(() => withoutFamily.result.current.fetchStatus === 'idle' && withoutApi.result.current.fetchStatus === 'idle');

        expect(get).not.toHaveBeenCalled();
    });
});
