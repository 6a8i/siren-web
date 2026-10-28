import type { Api } from '@jellyfin/sdk';
import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import { AxiosError, type AxiosResponse } from 'axios';
import React, { act, type FC, type PropsWithChildren } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext, type JellyfinApiContext } from 'hooks/useApi';
import { renderHook, waitFor } from 'test-utils/renderHook';
import type { FamilyDto, FamilyMemberDto, SirenUserPolicy } from 'types/family';

import { getPinAdministrators, toAdminPinFailure, useFamilyAdminPin } from './useFamilyAdminPin';

// useApi imports the connection manager, which drags in the app host and its webpack-time defines.
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

// The messages are looked up by key; the keys are what the test checks.
vi.mock('lib/globalize', () => ({ default: { translate: (key: string) => key } }));

const BASE_PATH = 'https://siren.test';
const PROVIDER_ID = 'default';

const FAMILY: FamilyDto = {
    Id: 'family-1',
    Name: 'Bizzon',
    DateCreated: '2026-01-01T00:00:00Z',
    MemberCount: 3,
    MaxMembers: 6,
    EnableAllFolders: true,
    EnabledFolders: []
};

const member = (id: string, name: string, policy: Partial<SirenUserPolicy> = {}): FamilyMemberDto => ({
    Id: id,
    Name: name,
    // The provider ids are the SDK type's only required fields; they say nothing about the PIN.
    Policy: { AuthenticationProviderId: PROVIDER_ID, PasswordResetProviderId: PROVIDER_ID, ...policy },
    HasPin: true,
    IsLockedOut: false,
    HasAllFamilyFolders: true
});

const PARENT = member('parent', 'Parent', { IsFamilyAdministrator: true });
const OTHER_PARENT = member('other', 'Other parent', { IsFamilyAdministrator: true });
const DISABLED_PARENT = member('disabled', 'Old parent', { IsFamilyAdministrator: true, IsDisabled: true });
const KID = member('kid', 'Kid', { IsChildProfile: true });

const CHILD_USER: UserDto = { Id: 'kid', Name: 'Kid' };

const httpError = (status: number) => new AxiosError('refused', String(status), undefined, undefined, { status } as AxiosResponse);

function createApi() {
    const get = vi.fn((url: string) => {
        if (url === `${BASE_PATH}/Families/Mine`) return Promise.resolve({ data: FAMILY });
        if (url === `${BASE_PATH}/Families/family-1/Members`) return Promise.resolve({ data: [ KID, PARENT, DISABLED_PARENT, OTHER_PARENT ] });
        return Promise.reject(new Error(`unexpected GET ${url}`));
    });
    const post = vi.fn();
    const api = {
        basePath: BASE_PATH,
        authorizationHeader: 'MediaBrowser Token="token-1"',
        axiosInstance: { get, post }
    } as unknown as Api;

    return { api, get, post };
}

function renderPin(context: JellyfinApiContext) {
    const ApiProvider: FC<PropsWithChildren> = ({ children }) => (
        <ApiContext.Provider value={context}>{children}</ApiContext.Provider>
    );

    return renderHook(() => useFamilyAdminPin(), { wrapper: ApiProvider });
}

describe('getPinAdministrators()', () => {
    it('keeps the enabled administrators other than the asking profile', () => {
        expect(getPinAdministrators([ KID, PARENT, DISABLED_PARENT, OTHER_PARENT ], 'kid')).toEqual([ PARENT, OTHER_PARENT ]);
        expect(getPinAdministrators([ KID, PARENT ], 'parent')).toEqual([]);
    });
});

describe('toAdminPinFailure()', () => {
    it('maps the login endpoint statuses', () => {
        expect(toAdminPinFailure(httpError(401))).toBe('wrongPin');
        expect(toAdminPinFailure(httpError(403))).toBe('locked');
        expect(toAdminPinFailure(httpError(500))).toBe('error');
        expect(toAdminPinFailure(new Error('offline'))).toBe('error');
    });
});

describe('useFamilyAdminPin()', () => {
    const rendered: { unmount: () => void }[] = [];
    const render = (context: JellyfinApiContext) => {
        const hook = renderPin(context);
        rendered.push(hook);
        return hook;
    };

    afterEach(() => {
        for (const hook of rendered.splice(0)) {
            hook.unmount();
        }
    });

    it('lists the family administrators a child may ask', async () => {
        const { api } = createApi();

        const { result } = render({ api, user: CHILD_USER });

        await waitFor(() => result.current.administrators.length > 0);

        expect(result.current.administrators.map(admin => admin.Id)).toEqual([ 'parent', 'other' ]);
        expect(result.current.isLoading).toBe(false);
        expect(result.current.errorMessage).toBeUndefined();
    });

    it('verifies through the login endpoint and discards the token', async () => {
        const { api, post } = createApi();
        post.mockResolvedValue({ data: { AccessToken: 'admin-token' } });

        const { result } = render({ api, user: CHILD_USER });
        await waitFor(() => result.current.administrators.length > 0);

        let ok = false;
        await act(async () => {
            ok = await result.current.verify(PARENT, '1234');
        });

        expect(ok).toBe(true);
        expect(post).toHaveBeenCalledWith(
            `${BASE_PATH}/Users/AuthenticateByName`,
            { Username: 'Parent', Pw: '1234' },
            expect.objectContaining({ headers: { Authorization: 'MediaBrowser Token="token-1"' } })
        );
        expect(result.current.failure).toBeUndefined();
        expect(result.current.isVerifying).toBe(false);
    });

    it('says the PIN is wrong on 401 and that the profile is locked on 403', async () => {
        const { api, post } = createApi();
        const { result } = render({ api, user: CHILD_USER });
        await waitFor(() => result.current.administrators.length > 0);

        post.mockRejectedValueOnce(httpError(401));
        let ok = true;
        await act(async () => {
            ok = await result.current.verify(PARENT, '0000');
        });
        expect(ok).toBe(false);
        expect(result.current.failure).toBe('wrongPin');
        expect(result.current.errorMessage).toBe('PinIncorrect');

        post.mockRejectedValueOnce(httpError(403));
        await act(async () => {
            ok = await result.current.verify(PARENT, '0000');
        });
        expect(ok).toBe(false);
        expect(result.current.failure).toBe('locked');
        expect(result.current.errorMessage).toBe('ProfileLockedOut');

        act(() => result.current.reset());
        expect(result.current.errorMessage).toBeUndefined();
    });

    it('refuses without an api', async () => {
        const { result } = render({ user: CHILD_USER });

        let ok = true;
        await act(async () => {
            ok = await result.current.verify(PARENT, '1234');
        });

        expect(ok).toBe(false);
        expect(result.current.administrators).toEqual([]);
    });
});
