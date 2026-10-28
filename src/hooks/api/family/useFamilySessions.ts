import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import { getSessionApi } from '@jellyfin/sdk/lib/utils/api/session-api';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { useApi } from 'hooks/useApi';
import { filterFamilySessions, SESSION_ACTIVE_WITHIN_SECONDS } from 'utils/familySessions';

import { FAMILY_SESSIONS_QUERY_KEY, nullToUndefined } from './queryKeys';

/** The poll keeps the list right even when the socket is down. */
const REFRESH_INTERVAL_MS = 10_000;

export const FAMILY_SESSIONS_QUERY_PARAMS = { activeWithinSeconds: SESSION_ACTIVE_WITHIN_SECONDS };

/**
 * The sessions the server lists for the caller: a family administrator gets the family's profiles.
 * Polled every ten seconds while enabled, and replaced at once by whatever the `Sessions` socket
 * channel pushes.
 */
export const useFamilySessions = (enabled = true) => {
    const { api } = useApi();
    const queryClient = useQueryClient();
    const isEnabled = !!api && enabled;

    const query = useQuery({
        queryKey: [ FAMILY_SESSIONS_QUERY_KEY ],
        queryFn: async ({ signal }) => (
            (await getSessionApi(api!).getSessions(FAMILY_SESSIONS_QUERY_PARAMS, { signal })).data
        ),
        select: nullToUndefined,
        enabled: isEnabled,
        refetchInterval: REFRESH_INTERVAL_MS
    });

    useEffect(() => {
        if (!api || !isEnabled) return;

        // The socket carries every session the caller may see, so the pushed list replaces the cache.
        return api.subscribe([ OutboundWebSocketMessageType.Sessions ], ({ Data }) => {
            queryClient.setQueryData<SessionInfoDto[]>(
                [ FAMILY_SESSIONS_QUERY_KEY ],
                filterFamilySessions(Data ?? [])
            );
        });
    }, [ api, isEnabled, queryClient ]);

    return query;
};
