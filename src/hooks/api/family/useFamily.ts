import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getFamily } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, nullToUndefined } from './queryKeys';

export const useFamily = (familyId?: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ FAMILIES_QUERY_KEY, familyId ],
        queryFn: async ({ signal }) => (await getFamily(api!, familyId!, { signal })).data,
        select: nullToUndefined,
        enabled: !!api && !!familyId
    });
};
