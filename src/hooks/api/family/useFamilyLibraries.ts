import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getFamilyLibraries } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, nullToUndefined } from './queryKeys';

/**
 * The libraries the family reaches, by name. Unlike the caller's own views, this names every
 * library of the family, so a family administrator can grant one they cannot see themselves.
 */
export const useFamilyLibraries = (familyId?: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ FAMILIES_QUERY_KEY, familyId, 'Libraries' ],
        queryFn: async ({ signal }) => (await getFamilyLibraries(api!, familyId!, { signal })).data,
        select: nullToUndefined,
        enabled: !!api && !!familyId
    });
};
