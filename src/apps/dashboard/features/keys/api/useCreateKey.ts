import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { createApiKey } from './keys-api';
import { QUERY_KEY } from './useApiKeys';

export interface CreateKeyParams {
    app: string
    /** The key may only read: every non-GET request with it answers 403. */
    isReadOnly?: boolean
}

export const useCreateKey = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ app, isReadOnly = false }: CreateKeyParams) => (
            createApiKey(api!, app, isReadOnly)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
