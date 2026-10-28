import { useMutation } from '@tanstack/react-query';
import { useApi } from 'hooks/useApi';
import { queryClient } from 'utils/query/queryClient';
import { setApiKeyReadOnly } from './keys-api';
import { QUERY_KEY } from './useApiKeys';

export interface SetKeyReadOnlyParams {
    key: string
    isReadOnly: boolean
}

export const useSetKeyReadOnly = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ key, isReadOnly }: SetKeyReadOnlyParams) => (
            setApiKeyReadOnly(api!, key, isReadOnly)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: [ QUERY_KEY ]
            });
        }
    });
};
