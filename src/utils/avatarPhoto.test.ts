import { describe, expect, it } from 'vitest';

import { AVATAR_PHOTO_TYPE, getCenterCrop, isImageFile } from './avatarPhoto';

describe('getCenterCrop()', () => {
    it('takes the whole square of a square picture', () => {
        expect(getCenterCrop(300, 300)).toEqual({ x: 0, y: 0, size: 300 });
    });

    it('cuts the sides of a landscape picture', () => {
        expect(getCenterCrop(400, 200)).toEqual({ x: 100, y: 0, size: 200 });
    });

    it('cuts the top and bottom of a portrait picture', () => {
        expect(getCenterCrop(200, 500)).toEqual({ x: 0, y: 150, size: 200 });
    });

    it('rounds an odd margin down so the crop stays inside the picture', () => {
        expect(getCenterCrop(201, 100)).toEqual({ x: 50, y: 0, size: 100 });
    });

    it('is empty for an empty picture', () => {
        expect(getCenterCrop(0, 120).size).toBe(0);
        expect(getCenterCrop(0, 0)).toEqual({ x: 0, y: 0, size: 0 });
    });
});

describe('isImageFile()', () => {
    it('accepts any image type and nothing else', () => {
        expect(isImageFile({ type: 'image/jpeg' })).toBe(true);
        expect(isImageFile({ type: 'image/webp' })).toBe(true);
        expect(isImageFile({ type: 'text/plain' })).toBe(false);
        expect(isImageFile({ type: '' })).toBe(false);
    });
});

describe('AVATAR_PHOTO_TYPE', () => {
    it('uploads photos as JPEG', () => {
        expect(AVATAR_PHOTO_TYPE).toBe('image/jpeg');
    });
});
