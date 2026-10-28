import type { Api } from '@jellyfin/sdk';
import React, { type FC, type PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext, type JellyfinApiContext } from 'hooks/useApi';
import { renderHook, waitFor } from 'test-utils/renderHook';
import type { FamilyDeviceDto, FamilyHistoryEntryDto } from 'types/family';

import { FAMILIES_QUERY_KEY, FAMILY_DEVICES_QUERY_KEY } from './queryKeys';
import { useFamilyDevices } from './useFamilyDevices';
import { useFamilyHistory } from './useFamilyHistory';

// useApi imports the connection manager, which drags in the app host and its webpack-time defines.
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

const BASE_PATH = 'https://siren.test';

const HISTORY: FamilyHistoryEntryDto[] = [
    { ItemId: 'ep-1', Name: 'Pilot', SeriesName: 'Bluey', Type: 'Episode', Date: '2026-10-27T20:00:00Z', Completed: true }
];

const DEVICES: FamilyDeviceDto[] = [
    {
        Id: 'tv', Name: 'Living room TV', AppName: 'Siren Web', AppVersion: '1.0',
        UserId: 'kid', UserName: 'Kid', DateLastActivity: '2026-10-27T20:00:00Z', IsCurrent: false
    }
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

function withApi(context: JellyfinApiContext): FC<PropsWithChildren> {
    const ApiProvider: FC<PropsWithChildren> = ({ children }) => (
        <ApiContext.Provider value={context}>{children}</ApiContext.Provider>
    );
    return ApiProvider;
}

describe('useFamilyHistory() and useFamilyDevices()', () => {
    const rendered: { unmount: () => void }[] = [];
    const track = <T, >(hook: T & { unmount: () => void }) => {
        rendered.push(hook);
        return hook;
    };

    afterEach(() => {
        for (const hook of rendered.splice(0)) {
            hook.unmount();
        }
    });

    it('fetches the member history under the family prefix, fifty items at most', async () => {
        const { api, get } = createApi();
        get.mockResolvedValue({ data: HISTORY });

        const { result, queryClient } = track(renderHook(() => useFamilyHistory('family 1', 'kid 1'), { wrapper: withApi({ api }) }));

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toEqual(HISTORY);
        expect(get).toHaveBeenCalledWith(`${BASE_PATH}/Families/family%201/Members/kid%201/History?limit=50`, expect.objectContaining({
            headers: { Authorization: 'MediaBrowser Token="token-1"' }
        }));
        expect(queryClient.getQueryData([ FAMILIES_QUERY_KEY, 'family 1', 'Members', 'kid 1', 'History' ])).toEqual(HISTORY);
    });

    it('fetches the family devices under their own prefix', async () => {
        const { api, get } = createApi();
        get.mockResolvedValue({ data: DEVICES });

        const { result, queryClient } = track(renderHook(() => useFamilyDevices('family-1'), { wrapper: withApi({ api }) }));

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toEqual(DEVICES);
        expect(get).toHaveBeenCalledWith(`${BASE_PATH}/Families/family-1/Devices`, expect.anything());
        expect(queryClient.getQueryData([ FAMILY_DEVICES_QUERY_KEY, 'family-1' ])).toEqual(DEVICES);
    });

    it('does nothing without a family or a member', async () => {
        const { api, get } = createApi();

        const history = track(renderHook(() => useFamilyHistory('family-1'), { wrapper: withApi({ api }) }));
        const devices = track(renderHook(() => useFamilyDevices(), { wrapper: withApi({ api }) }));

        await waitFor(() => history.result.current.fetchStatus === 'idle' && devices.result.current.fetchStatus === 'idle');

        expect(get).not.toHaveBeenCalled();
    });
});
