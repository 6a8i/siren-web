import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getFamilies } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, nullToUndefined } from './queryKeys';

/** Every family on the server; server administrators only. */
export const useFamilies = () => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ FAMILIES_QUERY_KEY ],
        queryFn: async ({ signal }) => (await getFamilies(api!, { signal })).data,
        select: nullToUndefined,
        enabled: !!api
    });
};
