import type { ApiClient } from 'jellyfin-apiclient';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    getLastProfileId,
    lastProfileKey,
    markProfileChosen,
    PROFILE_CHOSEN_KEY,
    shouldOpenProfileSelector,
    wasProfileChosen
} from './profileSelection';

// vi.mock is hoisted above the imports; the mocks keep the app's connection code out of the test.
const { fetchQuery } = vi.hoisted(() => ({ fetchQuery: vi.fn() }));

vi.mock('utils/query/queryClient', () => ({
    queryClient: { fetchQuery: (...args: unknown[]) => fetchQuery(...args) }
}));

vi.mock('lib/jellyfin-apiclient', () => ({
    ServerConnections: { getApi: () => ({}) }
}));

vi.mock('hooks/api/family/useMyFamily', () => ({
    getMyFamilyQuery: () => ({})
}));

const apiClient = (user: object | undefined) => ({
    getCurrentUser: () => Promise.resolve(user),
    serverId: () => 'server-1'
}) as unknown as ApiClient;

describe('profileSelection storage', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
    });

    it('remembers the chosen profile for the session and the server', () => {
        expect(wasProfileChosen('user-1')).toBe(false);
        expect(getLastProfileId('server-1')).toBeUndefined();

        markProfileChosen('server-1', 'user-1');

        expect(wasProfileChosen('user-1')).toBe(true);
        expect(wasProfileChosen('user-2')).toBe(false);
        expect(getLastProfileId('server-1')).toBe('user-1');
        expect(getLastProfileId('server-2')).toBeUndefined();
        expect(window.sessionStorage.getItem(PROFILE_CHOSEN_KEY)).toBe('user-1');
        expect(window.localStorage.getItem(lastProfileKey('server-1'))).toBe('user-1');
    });
});

describe('shouldOpenProfileSelector', () => {
    beforeEach(() => {
        window.sessionStorage.clear();
        window.localStorage.clear();
        fetchQuery.mockReset();
    });

    it('is false for a user without a family', async () => {
        await expect(shouldOpenProfileSelector(apiClient({ Id: 'user-1' }))).resolves.toBe(false);
        expect(fetchQuery).not.toHaveBeenCalled();
    });

    it('is false once a profile was chosen in the session', async () => {
        markProfileChosen('server-1', 'user-1');
        await expect(shouldOpenProfileSelector(apiClient({ Id: 'user-1', FamilyId: 'fam' }))).resolves.toBe(false);
        expect(fetchQuery).not.toHaveBeenCalled();
    });

    it('is true for a family with more than one profile', async () => {
        fetchQuery.mockResolvedValue({ Id: 'fam', MemberCount: 2 });
        await expect(shouldOpenProfileSelector(apiClient({ Id: 'user-1', FamilyId: 'fam' }))).resolves.toBe(true);
    });

    it('is false for a family with a single profile', async () => {
        fetchQuery.mockResolvedValue({ Id: 'fam', MemberCount: 1 });
        await expect(shouldOpenProfileSelector(apiClient({ Id: 'user-1', FamilyId: 'fam' }))).resolves.toBe(false);
    });

    it('is false when the family cannot be loaded', async () => {
        vi.spyOn(console, 'warn').mockImplementation(() => undefined);
        fetchQuery.mockRejectedValue(new Error('boom'));
        await expect(shouldOpenProfileSelector(apiClient({ Id: 'user-1', FamilyId: 'fam' }))).resolves.toBe(false);
    });
});
