import { useMutation } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { QUERY_KEY as USER_QUERY_KEY } from 'hooks/api/useUser';
import { useApi } from 'hooks/useApi';
import { QUERY_KEY as USERS_QUERY_KEY } from 'hooks/useUsers';
import type {
    CreateFamilyMemberRequest,
    CreateFamilyRequest,
    FamilyMemberPasswordRequest,
    ImageUpload,
    UpdateFamilyMemberRequest,
    UpdateFamilyRequest
} from 'types/family';
import { queryClient } from 'utils/query/queryClient';
import {
    createFamily,
    createFamilyMember,
    deleteFamily,
    deleteFamilyMemberImage,
    deleteUserImage,
    disconnectFamilyDevice,
    linkFamilyMember,
    removeFamilyMember,
    setFamilyMemberImage,
    setFamilyMemberPassword,
    setUserImage,
    unlockFamilyMember,
    updateFamily,
    updateFamilyMember
} from 'utils/sdk/family-api';

import { FAMILIES_QUERY_KEY, FAMILY_DEVICES_QUERY_KEY, FAMILY_SESSIONS_QUERY_KEY } from './queryKeys';

const HTTP_NOT_FOUND = 404;
const HTTP_METHOD_NOT_ALLOWED = 405;

/** Families and users are shown side by side, so a change to one refreshes both. */
const invalidateFamilies = () => {
    void queryClient.invalidateQueries({ queryKey: [ FAMILIES_QUERY_KEY ] });
    void queryClient.invalidateQueries({ queryKey: [ USERS_QUERY_KEY ] });
    void queryClient.invalidateQueries({ queryKey: [ USER_QUERY_KEY ] });
};

/** The server has no such route: an older build without the member image endpoint. */
const isMissingEndpoint = (err: unknown) => (
    isAxiosError(err) && (err.response?.status === HTTP_NOT_FOUND || err.response?.status === HTTP_METHOD_NOT_ALLOWED)
);

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

/** Ends a profile's PIN lockout now. */
export const useUnlockFamilyMember = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, userId }: { familyId: string, userId: string }) => (
            unlockFamilyMember(api!, familyId, userId)
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

interface MemberImageTarget {
    familyId: string
    userId: string
    /**
     * The image is the caller's own: when the server has no member image endpoint yet, Jellyfin's
     * own `UserImage` route (which any user may use for themselves) takes over.
     */
    isSelf?: boolean
}

export const useSetFamilyMemberImage = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async ({ familyId, userId, isSelf, image }: MemberImageTarget & { image: ImageUpload }) => {
            try {
                await setFamilyMemberImage(api!, familyId, userId, image.data, image.contentType);
            } catch (err) {
                if (!isSelf || !isMissingEndpoint(err)) throw err;
                await setUserImage(api!, userId, image.data, image.contentType);
            }
        },
        onSuccess: invalidateFamilies
    });
};

/** Signs a device out of the family profile it uses; the device and session lists refresh right after. */
export const useDisconnectFamilyDevice = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: ({ familyId, deviceId }: { familyId: string, deviceId: string }) => (
            disconnectFamilyDevice(api!, familyId, deviceId)
        ),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: [ FAMILY_DEVICES_QUERY_KEY ] });
            void queryClient.invalidateQueries({ queryKey: [ FAMILY_SESSIONS_QUERY_KEY ] });
        }
    });
};

export const useDeleteFamilyMemberImage = () => {
    const { api } = useApi();

    return useMutation({
        mutationFn: async ({ familyId, userId, isSelf }: MemberImageTarget) => {
            try {
                await deleteFamilyMemberImage(api!, familyId, userId);
            } catch (err) {
                if (!isSelf || !isMissingEndpoint(err)) throw err;
                await deleteUserImage(api!, userId);
            }
        },
        onSuccess: invalidateFamilies
    });
};
