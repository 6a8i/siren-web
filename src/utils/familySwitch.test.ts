import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileSwitchError, switchFamilyProfile } from './familySwitch';

const mocks = vi.hoisted(() => ({
    currentApiClient: vi.fn(),
    viewContainerReset: vi.fn(),
    queryClientClear: vi.fn()
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: { currentApiClient: mocks.currentApiClient }
}));

vi.mock('components/viewContainer', () => ({
    default: { reset: mocks.viewContainerReset }
}));

vi.mock('utils/query/queryClient', () => ({
    queryClient: { clear: mocks.queryClientClear }
}));

const SERVER = 'https://siren.test';

const AUTH_RESULT: AuthenticationResult = {
    AccessToken: 'token-2',
    User: { Id: 'user-2', Name: 'Kid' },
    ServerId: 'server-1'
};

/** The pieces of an ApiClient that a profile switch touches. */
function createApiClient(options: { onAuthenticated?: boolean } = {}) {
    return {
        ajax: vi.fn(),
        getUrl: vi.fn((path: string) => `${SERVER}/${path}`),
        serverId: vi.fn(() => 'server-1'),
        setAuthenticationInfo: vi.fn(),
        ...(options.onAuthenticated === false ? {} : { onAuthenticated: vi.fn().mockResolvedValue(undefined) })
    };
}

describe('ProfileSwitchError', () => {
    it('is an Error and a ProfileSwitchError', () => {
        const error = new ProfileSwitchError(401);

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ProfileSwitchError);
        expect(error.name).toBe('ProfileSwitchError');
        expect(error.status).toBe(401);
        expect(error.message).toBe('Profile switch failed (401)');
        expect(new ProfileSwitchError().message).toBe('Profile switch failed');
    });

    it('is a wrong PIN only for a 401', () => {
        expect(new ProfileSwitchError(401).isWrongPin).toBe(true);

        expect(new ProfileSwitchError(400).isWrongPin).toBe(false);
        expect(new ProfileSwitchError(403).isWrongPin).toBe(false);
        expect(new ProfileSwitchError(500).isWrongPin).toBe(false);
        expect(new ProfileSwitchError().isWrongPin).toBe(false);
    });

    it('is refused only for a 403', () => {
        expect(new ProfileSwitchError(403).isRefused).toBe(true);

        expect(new ProfileSwitchError(401).isRefused).toBe(false);
        expect(new ProfileSwitchError(500).isRefused).toBe(false);
        expect(new ProfileSwitchError().isRefused).toBe(false);
    });
});

describe('switchFamilyProfile()', () => {
    const location = { hash: '#/family', reload: vi.fn() };

    beforeEach(() => {
        location.hash = '#/family';
        vi.stubGlobal('location', location);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('posts the PIN to the Switch endpoint, stores the credentials and reloads on the home screen', async () => {
        const apiClient = createApiClient();
        apiClient.ajax.mockResolvedValue(AUTH_RESULT);
        mocks.currentApiClient.mockReturnValue(apiClient);

        await switchFamilyProfile('family-1', 'user-2', '1234');

        expect(apiClient.ajax).toHaveBeenCalledTimes(1);
        expect(apiClient.ajax).toHaveBeenCalledWith({
            type: 'POST',
            url: `${SERVER}/Families/family-1/Members/user-2/Switch`,
            data: JSON.stringify({ Pw: '1234' }),
            contentType: 'application/json',
            dataType: 'json'
        });

        expect(apiClient.onAuthenticated).toHaveBeenCalledWith(apiClient, AUTH_RESULT);
        expect(apiClient.setAuthenticationInfo).not.toHaveBeenCalled();

        expect(mocks.queryClientClear).toHaveBeenCalledTimes(1);
        expect(mocks.viewContainerReset).toHaveBeenCalledTimes(1);
        expect(location.hash).toBe('#/home');
        expect(location.reload).toHaveBeenCalledTimes(1);
    });

    it('sends an empty PIN for a profile without one and escapes the ids', async () => {
        const apiClient = createApiClient();
        apiClient.ajax.mockResolvedValue(AUTH_RESULT);
        mocks.currentApiClient.mockReturnValue(apiClient);

        await switchFamilyProfile('family/1', 'user 2');

        expect(apiClient.ajax).toHaveBeenCalledWith(expect.objectContaining({
            url: `${SERVER}/Families/family%2F1/Members/user%202/Switch`,
            data: JSON.stringify({ Pw: '' })
        }));
    });

    it('falls back to setAuthenticationInfo when the client has no onAuthenticated hook', async () => {
        const apiClient = createApiClient({ onAuthenticated: false });
        apiClient.ajax.mockResolvedValue(AUTH_RESULT);
        mocks.currentApiClient.mockReturnValue(apiClient);

        await switchFamilyProfile('family-1', 'user-2', '1234');

        expect(apiClient.setAuthenticationInfo).toHaveBeenCalledWith('token-2', 'user-2');
        expect(location.reload).toHaveBeenCalledTimes(1);
    });

    it('raises a wrong-PIN ProfileSwitchError on a 401 and changes nothing', async () => {
        const apiClient = createApiClient();
        apiClient.ajax.mockRejectedValue({ status: 401 });
        mocks.currentApiClient.mockReturnValue(apiClient);

        const error = await switchFamilyProfile('family-1', 'user-2', '0000').catch((err: unknown) => err);

        expect(error).toBeInstanceOf(ProfileSwitchError);
        expect((error as ProfileSwitchError).isWrongPin).toBe(true);

        expect(apiClient.onAuthenticated).not.toHaveBeenCalled();
        expect(apiClient.setAuthenticationInfo).not.toHaveBeenCalled();
        expect(mocks.queryClientClear).not.toHaveBeenCalled();
        expect(mocks.viewContainerReset).not.toHaveBeenCalled();
        expect(location.hash).toBe('#/family');
        expect(location.reload).not.toHaveBeenCalled();
    });

    it('raises a ProfileSwitchError that is not a wrong PIN for other failures', async () => {
        const apiClient = createApiClient();
        apiClient.ajax.mockRejectedValue({ status: 503 });
        mocks.currentApiClient.mockReturnValue(apiClient);

        await expect(switchFamilyProfile('family-1', 'user-2')).rejects.toMatchObject({
            name: 'ProfileSwitchError',
            status: 503,
            isWrongPin: false
        });

        apiClient.ajax.mockRejectedValue(new TypeError('Failed to fetch'));

        await expect(switchFamilyProfile('family-1', 'user-2')).rejects.toMatchObject({
            name: 'ProfileSwitchError',
            status: undefined,
            isWrongPin: false
        });
        expect(location.reload).not.toHaveBeenCalled();
    });

    it('fails outright without an active server connection', async () => {
        mocks.currentApiClient.mockReturnValue(undefined);

        const error = await switchFamilyProfile('family-1', 'user-2').catch((err: unknown) => err);

        expect(error).toBeInstanceOf(Error);
        expect(error).not.toBeInstanceOf(ProfileSwitchError);
        expect(location.reload).not.toHaveBeenCalled();
    });
});
