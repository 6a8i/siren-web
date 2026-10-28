import { useMutation } from '@tanstack/react-query';

import { QUERY_KEY as USER_QUERY_KEY } from 'hooks/api/useUser';
import { useApi } from 'hooks/useApi';
import { QUERY_KEY as USERS_QUERY_KEY } from 'hooks/useUsers';
import type {
    CreateFamilyMemberRequest,
    CreateFamilyRequest,
    FamilyMemberPasswordRequest,
    UpdateFamilyMemberRequest,
    UpdateFamilyRequest
} from 'types/family';
import { queryClient } from 'utils/query/queryClient';
import {
    createFamily,
    createFamilyMember,
    deleteFamily,
    linkFamilyMember,
    removeFamilyMember,
    setFamilyMemberPassword,
    updateFamily,
    updateFamilyMember
} from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY } from './queryKeys';

/** Families and users are shown side by side, so a change to one refreshes both. */
const invalidateFamilies = () => {
    void queryClient.invalidateQueries({ queryKey: [ FAMILIES_QUERY_KEY ] });
    void queryClient.invalidateQueries({ queryKey: [ USERS_QUERY_KEY ] });
    void queryClient.invalidateQueries({ queryKey: [ USER_QUERY_KEY ] });
};

export const useCreateFamily = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async (body: CreateFamilyRequest) => (await createFamily(api!, body)).data,
        onSuccess: invalidateFamilies
    });
};

export const useUpdateFamily = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, body }: { familyId: string, body: UpdateFamilyRequest }) => (
            updateFamily(api!, familyId, body)
        ),
        onSuccess: invalidateFamilies
    });
};

export const useDeleteFamily = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, deleteMembers }: { familyId: string, deleteMembers: boolean }) => (
            deleteFamily(api!, familyId, deleteMembers)
        ),
        onSuccess: invalidateFamilies
    });
};

export const useCreateFamilyMember = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async ({ familyId, body }: { familyId: string, body: CreateFamilyMemberRequest }) => (
            (await createFamilyMember(api!, familyId, body)).data
        ),
        onSuccess: invalidateFamilies
    });
};

export const useLinkFamilyMember = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, userId }: { familyId: string, userId: string }) => (
            linkFamilyMember(api!, familyId, userId)
        ),
        onSuccess: invalidateFamilies
    });
};

export const useUpdateFamilyMember = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, userId, body }: { familyId: string, userId: string, body: UpdateFamilyMemberRequest }) => (
            updateFamilyMember(api!, familyId, userId, body)
        ),
        onSuccess: invalidateFamilies
    });
};

export const useSetFamilyMemberPassword = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, userId, body }: { familyId: string, userId: string, body: FamilyMemberPasswordRequest }) => (
            setFamilyMemberPassword(api!, familyId, userId, body)
        ),
        onSuccess: invalidateFamilies
    });
};

export const useRemoveFamilyMember = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, userId, deleteUser }: { familyId: string, userId: string, deleteUser: boolean }) => (
            removeFamilyMember(api!, familyId, userId, deleteUser)
        ),
        onSuccess: invalidateFamilies
    });
};
