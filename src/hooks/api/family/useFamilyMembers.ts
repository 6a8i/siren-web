import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getFamilyMembers } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, nullToUndefined } from './queryKeys';

export const useFamilyMembers = (familyId?: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ FAMILIES_QUERY_KEY, familyId, 'Members' ],
        queryFn: async ({ signal }) => (await getFamilyMembers(api!, familyId!, { signal })).data,
        select: nullToUndefined,
        enabled: !!api && !!familyId
    });
};
