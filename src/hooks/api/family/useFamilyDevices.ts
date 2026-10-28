import { useQuery } from '@tanstack/react-query';

import { useApi } from 'hooks/useApi';
import { getFamilyDevices } from 'utils/sdk/family-api';

import { FAMILY_DEVICES_QUERY_KEY, nullToUndefined } from './queryKeys';

/** The devices signed in as the family's profiles (family administrators); not fetched without a family. */
export const useFamilyDevices = (familyId?: string) => {
    const { api } = useApi();

    return useQuery({
        queryKey: [ FAMILY_DEVICES_QUERY_KEY, familyId ],
        queryFn: async ({ signal }) => (await getFamilyDevices(api!, familyId!, { signal })).data,
        select: nullToUndefined,
        enabled: !!api && !!familyId
    });
};
