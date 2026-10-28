import type { Api } from '@jellyfin/sdk';
import { queryOptions, useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { useApi } from 'hooks/useApi';
import type { FamilyDto } from 'types/family';
import { getMyFamily } from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, nullToUndefined } from './queryKeys';

const HTTP_NOT_FOUND = 404;

/** The current user's family; `null` when they do not belong to one (the hook turns it into `undefined`). */
export const getMyFamilyQuery = (api?: Api, userId?: string) => queryOptions({
    queryKey: [ FAMILIES_QUERY_KEY, 'Mine', userId ],
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
    enabled: !!api && !!userId,
    retry: false
});

/** The current user's family, or undefined when they do not belong to one. */
export const useMyFamily = () => {
    const { api, user } = useApi();

    return useQuery({
        ...getMyFamilyQuery(api, user?.Id),
        select: nullToUndefined
    });
};
