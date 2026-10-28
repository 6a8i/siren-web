/**
 * Preset avatars for family profiles: a background colour and a white glyph, rendered to a PNG on
 * a canvas and uploaded as the profile image. The glyphs are Material Design icon paths (the same
 * ones MUI ships), inlined so the canvas and the picker draw exactly the same shape.
 */

import type { ImageUpload } from 'types/family';

export interface AvatarColor {
    id: string
    /** The string key of the colour's name, for the picker's labels. */
    labelKey: string
    hex: string
}

export interface AvatarGlyph {
    id: string
    /** The string key of the glyph's name, for the picker's labels. */
    labelKey: string
    /** SVG path data in a 24×24 view box. */
    path: string
}

export interface AvatarPreset {
    color: string
    glyph: string
}

/** The side of the uploaded square, enough for the biggest tile at a device pixel ratio of 2. */
export const AVATAR_IMAGE_SIZE = 256;
export const AVATAR_IMAGE_TYPE = 'image/png';
/** The glyph takes this much of the square, leaving a margin that survives the tiles' rounded corners. */
const GLYPH_RATIO = 0.58;
const GLYPH_VIEW_BOX = 24;
const GLYPH_COLOR = '#ffffff';

export const AVATAR_COLORS: AvatarColor[] = [
    { id: 'teal', labelKey: 'AvatarColorTeal', hex: '#0f766e' },
    { id: 'sky', labelKey: 'AvatarColorSky', hex: '#0369a1' },
    { id: 'violet', labelKey: 'AvatarColorViolet', hex: '#6d28d9' },
    { id: 'rose', labelKey: 'AvatarColorRose', hex: '#be123c' },
    { id: 'coral', labelKey: 'AvatarColorCoral', hex: '#c2410c' },
    { id: 'amber', labelKey: 'AvatarColorAmber', hex: '#b45309' },
    { id: 'emerald', labelKey: 'AvatarColorEmerald', hex: '#15803d' },
    { id: 'slate', labelKey: 'AvatarColorSlate', hex: '#475569' }
];

export const AVATAR_GLYPHS: AvatarGlyph[] = [
    {
        id: 'paw',
        labelKey: 'AvatarGlyphPaw',
        // Four toes (circles of radius 2.5 in the icon) as arcs, then the pad.
        path: 'M2 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M6.5 5.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M12.5 5.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M17 9.5a2.5 2.5 0 1 0 5 0a2.5 2.5 0 1 0-5 0M17.34 14.86c-.87-1.02-1.6-1.89-2.48-2.91-.46-.54-1.05-1.08-1.75-1.32q-.165-.06-.33-.09c-.25-.04-.52-.04-.78-.04s-.53 0-.79.05q-.165.03-.33.09c-.7.24-1.28.78-1.75 1.32-.87 1.02-1.6 1.89-2.48 2.91-1.31 1.31-2.92 2.76-2.62 4.79.29 1.02 1.02 2.03 2.33 2.32.73.15 3.06-.44 5.54-.44h.18c2.48 0 4.81.58 5.54.44 1.31-.29 2.04-1.31 2.33-2.32.31-2.04-1.3-3.49-2.61-4.8'
    },
    {
        id: 'bee',
        labelKey: 'AvatarGlyphBee',
        path: 'M21.94 4.88c-.18-.53-.69-.88-1.26-.88H19.6l-.31-.97C19.15 2.43 18.61 2 18 2s-1.15.43-1.29 1.04L16.4 4h-1.07c-.57 0-1.08.35-1.26.88-.19.56.04 1.17.56 1.48l.87.52-.4 1.24c-.23.58-.04 1.25.45 1.62.23.17.51.26.78.26.31 0 .61-.11.86-.32l.81-.7.81.7c.25.21.55.32.86.32.27 0 .55-.09.78-.26.5-.37.68-1.04.45-1.62l-.39-1.24.87-.52c.51-.31.74-.92.56-1.48M18 7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m-4.51 3.51c-.43-.43-.94-.73-1.49-.93V8h-1v1.38c-.11-.01-.23-.03-.34-.03-1.02 0-2.05.39-2.83 1.17-.16.16-.3.34-.43.53L6 10.52c-1.56-.55-3.28.27-3.83 1.82-.27.75-.23 1.57.12 2.29.23.48.58.87 1 1.16-.38 1.35-.06 2.85 1 3.91s2.57 1.38 3.91 1c.29.42.68.77 1.16 1q.63.3 1.29.3c.34 0 .68-.06 1.01-.17 1.56-.55 2.38-2.27 1.82-3.85l-.52-1.37c.18-.13.36-.27.53-.43.87-.87 1.24-2.04 1.14-3.17H16v-1h-1.59c-.19-.55-.49-1.06-.92-1.5m-8.82 3.78c-.25-.09-.45-.27-.57-.51s-.13-.51-.04-.76c.19-.52.76-.79 1.26-.61l3.16 1.19c-1.15.6-2.63 1.11-3.81.69m6.32 5.65c-.25.09-.52.08-.76-.04-.24-.11-.42-.32-.51-.57-.42-1.18.09-2.65.7-3.8l1.18 3.13c.18.52-.09 1.1-.61 1.28m1.21-5.34-.61-1.61c0-.01-.01-.02-.02-.03l-.06-.12c-.02-.04-.04-.07-.07-.11l-.09-.09-.09-.09c-.03-.03-.07-.05-.11-.07s-.07-.05-.12-.06c-.01 0-.02-.01-.03-.02l-1.6-.6c.36-.29.79-.46 1.26-.46.53 0 1.04.21 1.41.59.73.73.77 1.88.13 2.67'
    },
    {
        id: 'flower',
        labelKey: 'AvatarGlyphFlower',
        path: 'M12 22c4.97 0 9-4.03 9-9-4.97 0-9 4.03-9 9M5.6 10.25c0 1.38 1.12 2.5 2.5 2.5.53 0 1.01-.16 1.42-.44l-.02.19c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5l-.02-.19c.4.28.89.44 1.42.44 1.38 0 2.5-1.12 2.5-2.5 0-1-.59-1.85-1.43-2.25.84-.4 1.43-1.25 1.43-2.25 0-1.38-1.12-2.5-2.5-2.5-.53 0-1.01.16-1.42.44l.02-.19C14.5 2.12 13.38 1 12 1S9.5 2.12 9.5 3.5l.02.19c-.4-.28-.89-.44-1.42-.44-1.38 0-2.5 1.12-2.5 2.5 0 1 .59 1.85 1.43 2.25-.84.4-1.43 1.25-1.43 2.25M12 5.5c1.38 0 2.5 1.12 2.5 2.5s-1.12 2.5-2.5 2.5S9.5 9.38 9.5 8s1.12-2.5 2.5-2.5M3 13c0 4.97 4.03 9 9 9 0-4.97-4.03-9-9-9'
    },
    {
        id: 'star',
        labelKey: 'AvatarGlyphStar',
        path: 'M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z'
    },
    {
        id: 'heart',
        labelKey: 'AvatarGlyphHeart',
        path: 'm12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54z'
    },
    {
        id: 'bolt',
        labelKey: 'AvatarGlyphBolt',
        path: 'M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66s.05-.08.07-.12C8.48 10.94 10.42 7.54 13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.15C12.96 17.55 11 21 11 21'
    },
    {
        id: 'rocket',
        labelKey: 'AvatarGlyphRocket',
        path: 'M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83zm6.48-2.19c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81zM9 18c0 .83-.34 1.58-.88 2.12C6.94 21.3 2 22 2 22s.7-4.94 1.88-6.12C4.42 15.34 5.17 15 6 15c1.66 0 3 1.34 3 3m4-9c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2'
    },
    {
        id: 'gamepad',
        labelKey: 'AvatarGlyphGamepad',
        path: 'm21.58 16.09-1.09-7.66C20.21 6.46 18.52 5 16.53 5H7.47C5.48 5 3.79 6.46 3.51 8.43l-1.09 7.66C2.2 17.63 3.39 19 4.94 19c.68 0 1.32-.27 1.8-.75L9 16h6l2.25 2.25c.48.48 1.13.75 1.8.75 1.56 0 2.75-1.37 2.53-2.91M11 11H9v2H8v-2H6v-1h2V8h1v2h2zm4-1c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1m2 3c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1'
    },
    {
        id: 'music',
        labelKey: 'AvatarGlyphMusic',
        path: 'M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3z'
    },
    {
        id: 'cake',
        labelKey: 'AvatarGlyphCake',
        path: 'M12 6c1.11 0 2-.9 2-2 0-.38-.1-.73-.29-1.03L12 0l-1.71 2.97c-.19.3-.29.65-.29 1.03 0 1.1.9 2 2 2m4.6 9.99-1.07-1.07-1.08 1.07c-1.3 1.3-3.58 1.31-4.89 0l-1.07-1.07-1.09 1.07C6.75 16.64 5.88 17 4.96 17c-.73 0-1.4-.23-1.96-.61V21c0 .55.45 1 1 1h16c.55 0 1-.45 1-1v-4.61c-.56.38-1.23.61-1.96.61-.92 0-1.79-.36-2.44-1.01M18 9h-5V7h-2v2H6c-1.66 0-3 1.34-3 3v1.54c0 1.08.88 1.96 1.96 1.96.52 0 1.02-.2 1.38-.57l2.14-2.13 2.13 2.13c.74.74 2.03.74 2.77 0l2.14-2.13 2.13 2.13c.37.37.86.57 1.38.57 1.08 0 1.96-.88 1.96-1.96V12C21 10.34 19.66 9 18 9'
    },
    {
        id: 'diamond',
        labelKey: 'AvatarGlyphDiamond',
        path: 'M12.16 3h-.32L9.21 8.25h5.58zm4.3 5.25h5.16L19 3h-5.16zm4.92 1.5h-8.63V20.1zM11.25 20.1V9.75H2.62zM7.54 8.25 10.16 3H5L2.38 8.25z'
    },
    {
        id: 'castle',
        labelKey: 'AvatarGlyphCastle',
        path: 'M21 9v2h-2V3h-2v2h-2V3h-2v2h-2V3H9v2H7V3H5v8H3V9H1v12h9v-3c0-1.1.9-2 2-2s2 .9 2 2v3h9V9zm-10 3H9V9h2zm4 0h-2V9h2z'
    }
];

export const getAvatarColor = (id: string): AvatarColor | undefined => AVATAR_COLORS.find(color => color.id === id);
export const getAvatarGlyph = (id: string): AvatarGlyph | undefined => AVATAR_GLYPHS.find(glyph => glyph.id === id);

/** A starting preset that differs from profile to profile, picked from the name. */
export function getDefaultAvatarPreset(name?: string | null): AvatarPreset {
    let hash = 0;
    for (const char of name ?? '') {
        hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    }

    return {
        color: AVATAR_COLORS[hash % AVATAR_COLORS.length].id,
        glyph: AVATAR_GLYPHS[Math.floor(hash / AVATAR_COLORS.length) % AVATAR_GLYPHS.length].id
    };
}

/**
 * Draws the preset on a canvas: the colour fills the whole square (the tiles round the corners
 * themselves) and the glyph sits centred in white. Returns a PNG data URL.
 */
export function renderAvatarPreset(preset: AvatarPreset, size = AVATAR_IMAGE_SIZE): string {
    const color = getAvatarColor(preset.color);
    const glyph = getAvatarGlyph(preset.glyph);
    if (!color || !glyph) {
        throw new Error(`[avatarPreset] unknown preset ${preset.color}/${preset.glyph}`);
    }

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('[avatarPreset] the canvas has no 2d context');
    }

    context.fillStyle = color.hex;
    context.fillRect(0, 0, size, size);

    const scale = (size * GLYPH_RATIO) / GLYPH_VIEW_BOX;
    const offset = (size - GLYPH_VIEW_BOX * scale) / 2;
    context.translate(offset, offset);
    context.scale(scale, scale);
    context.fillStyle = GLYPH_COLOR;
    context.fill(new Path2D(glyph.path));

    return canvas.toDataURL(AVATAR_IMAGE_TYPE);
}

/** Splits a base64 data URL into what the image endpoints take: the media type and the payload. */
export function parseDataUrl(dataUrl: string): ImageUpload {
    const header = dataUrl.indexOf(';base64,');
    if (!dataUrl.startsWith('data:') || header === -1) {
        throw new Error('[avatarPreset] not a base64 data URL');
    }

    return {
        contentType: dataUrl.slice('data:'.length, header),
        data: dataUrl.slice(header + ';base64,'.length)
    };
}

/** The preset rendered and split, ready for an upload. */
export const renderAvatarUpload = (preset: AvatarPreset): ImageUpload => parseDataUrl(renderAvatarPreset(preset));
