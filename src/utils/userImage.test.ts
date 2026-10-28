import type { Api } from '@jellyfin/sdk';
import { describe, expect, it } from 'vitest';

import { getUserImageUrl } from './userImage';

const api = { basePath: 'https://siren.test' } as Api;

describe('getUserImageUrl()', () => {
    it('builds the primary image URL with the cache tag', () => {
        expect(getUserImageUrl(api, 'user-1', 'tag-1')).toBe('https://siren.test/Users/user-1/Images/Primary?tag=tag-1');
    });

    it('adds the width when asked', () => {
        expect(getUserImageUrl(api, 'user-1', 'tag-1', 320)).toBe('https://siren.test/Users/user-1/Images/Primary?tag=tag-1&maxWidth=320');
    });

    it('escapes the id and the tag', () => {
        expect(getUserImageUrl(api, 'a/b', 'c&d')).toBe('https://siren.test/Users/a%2Fb/Images/Primary?tag=c%26d');
    });

    it('is undefined without an api, a user or an image', () => {
        expect(getUserImageUrl(undefined, 'user-1', 'tag-1')).toBeUndefined();
        expect(getUserImageUrl(api, undefined, 'tag-1')).toBeUndefined();
        expect(getUserImageUrl(api, 'user-1', null)).toBeUndefined();
        expect(getUserImageUrl(api, 'user-1', '')).toBeUndefined();
    });
});
