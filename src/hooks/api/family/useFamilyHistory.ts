import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getFamilyHistory } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, nullToUndefined } from './queryKeys';

export const FAMILY_HISTORY_LIMIT = 50;

/** The last items one member played, newest first; only fetched while a family and a member are given. */
export const useFamilyHistory = (familyId?: string, userId?: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ FAMILIES_QUERY_KEY, familyId, 'Members', userId, 'History' ],
        queryFn: async ({ signal }) => (await getFamilyHistory(api!, familyId!, userId!, FAMILY_HISTORY_LIMIT, { signal })).data,
        select: nullToUndefined,
        enabled: !!api && !!familyId && !!userId
    });
};
