import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';
import type { FamilyDto } from 'types/family';
import { getMyFamily } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY } from './queryKeys';

const HTTP_NOT_FOUND = 404;

/** The current user's family, or null when they do not belong to one. */
export const useMyFamily = () => {
    const { api, user } = useApi();

    return useQuery({
        queryKey: [ FAMILIES_QUERY_KEY, 'Mine', user?.Id ],
        queryFn: async ({ signal }): Promise<FamilyDto | null> => {
            try {
                return (await getMyFamily(api!, { signal })).data;
            } catch (err) {
                if (isAxiosError(err) && err.response?.status === HTTP_NOT_FOUND) {
                    return null;
                }
                throw err;
            }
        },
        enabled: !!api && !!user?.Id,
        retry: false
    });
};
