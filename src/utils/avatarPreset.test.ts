import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
    AVATAR_COLORS,
    AVATAR_GLYPHS,
    AVATAR_IMAGE_SIZE,
    getDefaultAvatarPreset,
    parseDataUrl,
    renderAvatarPreset,
    renderAvatarUpload
} from './avatarPreset';

const PNG_PAYLOAD = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

/** jsdom has no canvas: a fake 2d context records the calls, and toDataURL answers a fixed PNG. */
function mockCanvas() {
    const context = {
        fillStyle: '',
        fillRect: vi.fn(),
        translate: vi.fn(),
        scale: vi.fn(),
        fill: vi.fn()
    };
    const sizes: { width: number, height: number }[] = [];

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (this: HTMLCanvasElement, type?: string) {
        sizes.push({ width: this.width, height: this.height });
        return `data:${type ?? 'image/png'};base64,${PNG_PAYLOAD}`;
    });

    return { context, sizes };
}

class FakePath2D {
    constructor(readonly path: string) {}
}

describe('avatar presets', () => {
    it('offer 8 colours and 12 glyphs with unique ids and label keys', () => {
        expect(AVATAR_COLORS).toHaveLength(8);
        expect(AVATAR_GLYPHS).toHaveLength(12);
        expect(new Set(AVATAR_COLORS.map(color => color.id)).size).toBe(8);
        expect(new Set(AVATAR_GLYPHS.map(glyph => glyph.id)).size).toBe(12);
        expect(new Set([ ...AVATAR_COLORS, ...AVATAR_GLYPHS ].map(option => option.labelKey)).size).toBe(20);
        for (const color of AVATAR_COLORS) {
            expect(color.hex).toMatch(/^#[0-9a-f]{6}$/);
        }
    });

    it('start every profile on a preset picked from its name', () => {
        const parent = getDefaultAvatarPreset('Parent');
        const kid = getDefaultAvatarPreset('Kid');

        expect(AVATAR_COLORS.some(color => color.id === parent.color)).toBe(true);
        expect(AVATAR_GLYPHS.some(glyph => glyph.id === parent.glyph)).toBe(true);
        expect(getDefaultAvatarPreset('Parent')).toEqual(parent);
        expect(kid).not.toEqual(parent);
        expect(getDefaultAvatarPreset()).toEqual({ color: AVATAR_COLORS[0].id, glyph: AVATAR_GLYPHS[0].id });
    });
});

describe('renderAvatarPreset()', () => {
    beforeEach(() => {
        vi.stubGlobal('Path2D', FakePath2D);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('draws a 256×256 PNG with the colour behind a white glyph', () => {
        const { context, sizes } = mockCanvas();
        const glyph = AVATAR_GLYPHS[3];

        const dataUrl = renderAvatarPreset({ color: 'rose', glyph: glyph.id });

        expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);
        expect(sizes).toEqual([ { width: AVATAR_IMAGE_SIZE, height: AVATAR_IMAGE_SIZE } ]);
        expect(context.fillRect).toHaveBeenCalledWith(0, 0, AVATAR_IMAGE_SIZE, AVATAR_IMAGE_SIZE);
        expect(context.fill).toHaveBeenCalledTimes(1);
        expect((context.fill.mock.calls[0][0] as FakePath2D).path).toBe(glyph.path);
        // the colour was set before the square, white before the glyph
        expect(context.fillStyle).toBe('#ffffff');
        expect(context.fillRect).toHaveBeenCalledBefore(context.fill);
    });

    it('centres the glyph by translating before scaling', () => {
        const { context } = mockCanvas();

        renderAvatarPreset({ color: 'teal', glyph: 'star' }, 100);

        expect(context.translate).toHaveBeenCalledBefore(context.scale);
        const [ offsetX, offsetY ] = context.translate.mock.calls[0] as number[];
        const [ scaleX, scaleY ] = context.scale.mock.calls[0] as number[];
        expect(offsetX).toBe(offsetY);
        expect(scaleX).toBe(scaleY);
        // the glyph's 24-unit box, scaled, plus the margin on both sides spans the square
        expect(offsetX * 2 + 24 * scaleX).toBeCloseTo(100);
    });

    it('rejects a preset it does not know', () => {
        mockCanvas();

        expect(() => renderAvatarPreset({ color: 'plaid', glyph: 'star' })).toThrow(/unknown preset/);
        expect(() => renderAvatarPreset({ color: 'teal', glyph: 'unicorn' })).toThrow(/unknown preset/);
    });

    it('fails clearly when the canvas has no 2d context', () => {
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);

        expect(() => renderAvatarPreset({ color: 'teal', glyph: 'star' })).toThrow(/2d context/);
    });
});

describe('parseDataUrl()', () => {
    it('splits the media type from the base64 payload', () => {
        expect(parseDataUrl(`data:image/png;base64,${PNG_PAYLOAD}`)).toEqual({
            contentType: 'image/png',
            data: PNG_PAYLOAD
        });
    });

    it('rejects anything that is not a base64 data URL', () => {
        expect(() => parseDataUrl('https://siren.test/image.png')).toThrow(/data URL/);
        expect(() => parseDataUrl('data:image/png,plain')).toThrow(/data URL/);
    });
});

describe('renderAvatarUpload()', () => {
    beforeEach(() => {
        vi.stubGlobal('Path2D', FakePath2D);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('renders and splits in one go', () => {
        mockCanvas();

        expect(renderAvatarUpload({ color: 'sky', glyph: 'rocket' })).toEqual({
            contentType: 'image/png',
            data: PNG_PAYLOAD
        });
    });
});
