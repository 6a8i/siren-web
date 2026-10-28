import { isAxiosError } from 'axios';
import { useCallback, useMemo, useState } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import type { FamilyMemberDto } from 'types/family';
import { verifyFamilyAdminPin } from 'utils/sdk/family-api';

import { useFamilyMembers } from './useFamilyMembers';
import { useMyFamily } from './useMyFamily';

const HTTP_UNAUTHORIZED = 401;
const HTTP_FORBIDDEN = 403;

export type AdminPinFailure = 'wrongPin' | 'locked' | 'error';

/** The message to show for a failed check. */
export const getAdminPinFailureMessage = (failure: AdminPinFailure): string => {
    switch (failure) {
        case 'wrongPin':
            return globalize.translate('PinIncorrect');
        case 'locked':
            return globalize.translate('ProfileLockedOut');
        default:
            return globalize.translate('ErrorDefault');
    }
};

/** Why a PIN check failed, from the login endpoint's status. */
export const toAdminPinFailure = (err: unknown): AdminPinFailure => {
    if (isAxiosError(err)) {
        if (err.response?.status === HTTP_UNAUTHORIZED) return 'wrongPin';
        if (err.response?.status === HTTP_FORBIDDEN) return 'locked';
    }
    return 'error';
};

/** The family's administrators a PIN may be asked from: enabled, and not the profile asking. */
export const getPinAdministrators = (members: FamilyMemberDto[], excludeUserId?: string): FamilyMemberDto[] => (
    members.filter(member => member.Policy?.IsFamilyAdministrator && !member.Policy.IsDisabled && member.Id !== excludeUserId)
);

/**
 * Asks a family administrator's PIN before a child profile does something it may not on its own
 * (sign out, open settings). The check is a plain login as that administrator: the token it
 * returns is discarded, nothing about the current session changes.
 */
export const useFamilyAdminPin = () => {
    const { api, user } = useApi();
    const { data: family } = useMyFamily();
    const { data: members, isPending: isMembersPending } = useFamilyMembers(family?.Id);
    const [ isVerifying, setIsVerifying ] = useState(false);
    const [ failure, setFailure ] = useState<AdminPinFailure>();

    const administrators = useMemo(() => getPinAdministrators(members ?? [], user?.Id), [ members, user?.Id ]);

    const reset = useCallback(() => {
        setFailure(undefined);
    }, []);

    /** Resolves to true when the PIN is right; otherwise records why not and resolves to false. */
    const verify = useCallback(async (administrator: FamilyMemberDto, pin: string): Promise<boolean> => {
        if (!api || !administrator.Name) return false;

        setIsVerifying(true);
        setFailure(undefined);
        try {
            await verifyFamilyAdminPin(api, administrator.Name, pin);
            return true;
        } catch (err) {
            setFailure(toAdminPinFailure(err));
            return false;
        } finally {
            setIsVerifying(false);
        }
    }, [ api ]);

    return {
        administrators,
        isLoading: !!family && isMembersPending,
        isVerifying,
        failure,
        errorMessage: failure ? getAdminPinFailureMessage(failure) : undefined,
        verify,
        reset
    };
};
