import type { Api } from '@jellyfin/sdk';
import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import React, { act, type FC, type PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext, type JellyfinApiContext } from 'hooks/useApi';
import { renderHook, waitFor } from 'test-utils/renderHook';

import { FAMILY_SESSIONS_QUERY_KEY } from './queryKeys';
import { FAMILY_SESSIONS_QUERY_PARAMS, useFamilySessions } from './useFamilySessions';

// useApi imports the connection manager, which drags in the app host and its webpack-time defines.
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

const { getSessions } = vi.hoisted(() => ({ getSessions: vi.fn() }));

vi.mock('@jellyfin/sdk/lib/utils/api/session-api', () => ({
    getSessionApi: () => ({ getSessions })
}));

type SessionsHandler = (message: { Data?: SessionInfoDto[] }) => void;

const session = (name: string, minutesAgo = 0): SessionInfoDto => ({
    Id: `session-${name}`,
    UserId: `user-${name}`,
    UserName: name,
    LastActivityDate: new Date(Date.now() - minutesAgo * 60_000).toISOString()
});

/** A fake SDK Api that records socket subscriptions so a test can push a message through. */
function createApi() {
    const handlers: SessionsHandler[] = [];
    const unsubscribe = vi.fn();
    const subscribe = vi.fn((_types: unknown[], onMessage: SessionsHandler) => {
        handlers.push(onMessage);
        return unsubscribe;
    });
    const api = { basePath: 'https://siren.test', subscribe } as unknown as Api;

    const push = (sessions: SessionInfoDto[]) => {
        for (const handler of handlers) {
            handler({ Data: sessions });
        }
    };

    return { api, subscribe, unsubscribe, push };
}

function renderSessions(context: JellyfinApiContext, enabled?: boolean) {
    const ApiProvider: FC<PropsWithChildren> = ({ children }) => (
        <ApiContext.Provider value={context}>{children}</ApiContext.Provider>
    );

    return renderHook(() => useFamilySessions(enabled), { wrapper: ApiProvider });
}

describe('useFamilySessions()', () => {
    const rendered: { unmount: () => void }[] = [];
    const render = (context: JellyfinApiContext, enabled?: boolean) => {
        const hook = renderSessions(context, enabled);
        rendered.push(hook);
        return hook;
    };

    afterEach(() => {
        for (const hook of rendered.splice(0)) {
            hook.unmount();
        }
        getSessions.mockReset();
    });

    it('fetches the recent sessions and listens on the Sessions socket channel', async () => {
        const { api, subscribe } = createApi();
        const sessions = [ session('Parent') ];
        getSessions.mockResolvedValue({ data: sessions });

        const { result, queryClient } = render({ api });

        await waitFor(() => result.current.isSuccess);

        expect(result.current.data).toEqual(sessions);
        expect(getSessions).toHaveBeenCalledWith(FAMILY_SESSIONS_QUERY_PARAMS, expect.objectContaining({ signal: expect.any(AbortSignal) }));
        expect(FAMILY_SESSIONS_QUERY_PARAMS).toEqual({ activeWithinSeconds: 960 });
        expect(queryClient.getQueryData([ FAMILY_SESSIONS_QUERY_KEY ])).toEqual(sessions);
        expect(subscribe).toHaveBeenCalledWith([ 'Sessions' ], expect.any(Function));
    });

    it('replaces the list with what the socket pushes, keeping only recent profile sessions', async () => {
        const { api, push } = createApi();
        getSessions.mockResolvedValue({ data: [ session('Parent') ] });

        const { result } = render({ api });

        // read `data` (not just `isSuccess`): the observer only reports changes to properties that were read
        await waitFor(() => result.current.data !== undefined);

        const kid = session('Kid');
        const stale = session('Teen', 20);
        const device: SessionInfoDto = { Id: 'tv', LastActivityDate: new Date().toISOString() };
        act(() => push([ kid, stale, device ]));

        // the query notifies its observers on the next tick
        await waitFor(() => result.current.data?.[0]?.Id === kid.Id);
        expect(result.current.data).toEqual([ kid ]);
    });

    it('stops listening when it unmounts', async () => {
        const { api, unsubscribe } = createApi();
        getSessions.mockResolvedValue({ data: [] });

        const hook = render({ api });

        await waitFor(() => hook.result.current.isSuccess);
        expect(unsubscribe).not.toHaveBeenCalled();

        hook.unmount();
        rendered.splice(0);

        expect(unsubscribe).toHaveBeenCalledTimes(1);
    });

    it('neither fetches nor listens while disabled', async () => {
        const { api, subscribe } = createApi();

        const { result } = render({ api }, false);

        await waitFor(() => result.current.fetchStatus === 'idle');

        expect(getSessions).not.toHaveBeenCalled();
        expect(subscribe).not.toHaveBeenCalled();
    });
});
