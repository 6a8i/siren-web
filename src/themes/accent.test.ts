import { type SupportedColorScheme, getContrastRatio } from '@mui/material/styles';
import { describe, expect, it } from 'vitest';

import {
    ACCENT_PRESETS,
    DEFAULT_ACCENT_ID,
    WCAG_AA_CONTRAST,
    applyAccent,
    getAccentColor,
    getAccentContrastText,
    getAccentPreset,
    resolveAccentId
} from './accent';
import { createAppTheme, getAppTheme } from './index';
import siren from './siren';
import sirenlight from './sirenlight';

const MODES = [ 'dark', 'light' ] as const;

interface PrimaryColor {
    main: string
    contrastText: string
}

const primaryOf = (scheme: { palette?: { primary?: unknown } }) => scheme.palette?.primary as PrimaryColor;

/** The primary palette of one colour scheme of a built theme. */
function primaryIn(theme: ReturnType<typeof createAppTheme>, scheme: SupportedColorScheme) {
    const colorScheme = theme.colorSchemes[scheme];
    if (!colorScheme) {
        throw new Error(`The theme has no "${scheme}" colour scheme`);
    }

    return colorScheme.palette.primary;
}

describe('ACCENT_PRESETS', () => {
    it('offers eight presets with unique ids, the default first', () => {
        expect(ACCENT_PRESETS).toHaveLength(8);
        expect(new Set(ACCENT_PRESETS.map(preset => preset.id)).size).toBe(8);
        expect(ACCENT_PRESETS[0].id).toBe(DEFAULT_ACCENT_ID);
    });

    it.each(ACCENT_PRESETS.flatMap(preset => MODES.map(mode => [ preset.id, mode, getAccentColor(preset, mode) ])))(
        'reads at WCAG AA on a contained button: %s accent, %s mode (%s)',
        (_id, _mode, color) => {
            const text = getAccentContrastText(color);

            expect([ '#ffffff', '#0b0f17' ]).toContain(text);
            expect(getContrastRatio(color, text)).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST);
        }
    );

    it('shows the Siren themes\' own primary colour as the default, and that reads at AA too', () => {
        expect(getAccentColor(ACCENT_PRESETS[0], 'dark')).toBe(primaryOf(siren).main);
        expect(getAccentColor(ACCENT_PRESETS[0], 'light')).toBe(primaryOf(sirenlight).main);

        for (const scheme of [ siren, sirenlight ]) {
            const { main, contrastText } = primaryOf(scheme);
            expect(getContrastRatio(main, contrastText)).toBeGreaterThanOrEqual(WCAG_AA_CONTRAST);
        }
    });
});

describe('getAccentContrastText()', () => {
    it('puts white on dark colours and near-black on light ones', () => {
        expect(getAccentContrastText('#000000')).toBe('#ffffff');
        expect(getAccentContrastText('#1d4ed8')).toBe('#ffffff');
        expect(getAccentContrastText('#ffffff')).toBe('#0b0f17');
        expect(getAccentContrastText('#fbbf24')).toBe('#0b0f17');
    });

    it('does not let white through below AA, unlike the MUI default threshold', () => {
        // 3.75:1 against white: MUI (threshold 3) would pick white, AA needs the dark text
        expect(getContrastRatio('#0d9488', '#ffffff')).toBeLessThan(WCAG_AA_CONTRAST);
        expect(getAccentContrastText('#0d9488')).toBe('#0b0f17');
    });
});

describe('resolveAccentId() / getAccentPreset()', () => {
    it('falls back to the default for anything that is not a preset', () => {
        expect(resolveAccentId()).toBe(DEFAULT_ACCENT_ID);
        expect(resolveAccentId(null)).toBe(DEFAULT_ACCENT_ID);
        expect(resolveAccentId('')).toBe(DEFAULT_ACCENT_ID);
        expect(resolveAccentId('#ff0000')).toBe(DEFAULT_ACCENT_ID);
        expect(getAccentPreset('nope')).toBe(ACCENT_PRESETS[0]);
    });

    it('keeps a known preset', () => {
        expect(resolveAccentId('rose')).toBe('rose');
        expect(getAccentPreset('rose').label).toBe('AccentRose');
    });
});

describe('applyAccent()', () => {
    it('returns the very same scheme for the default accent', () => {
        expect(applyAccent(siren, DEFAULT_ACCENT_ID)).toBe(siren);
        expect(applyAccent(sirenlight)).toBe(sirenlight);
    });

    it('replaces the primary colour with the shade for the scheme mode and tints the focus colour', () => {
        const rose = getAccentPreset('rose');
        const dark = applyAccent(siren, 'rose');
        const light = applyAccent(sirenlight, 'rose');

        expect(primaryOf(dark)).toEqual({ main: rose.dark, contrastText: '#0b0f17' });
        expect(primaryOf(light)).toEqual({ main: rose.light, contrastText: '#ffffff' });
        expect(dark.palette?.action?.focus).toMatch(/^rgba\(244, 114, 182, 0\.18\)$/);
        expect(light.palette?.action?.focus).toMatch(/^rgba\(219, 39, 119, 0\.14\)$/);

        // everything else is left alone
        expect(dark.palette?.secondary).toBe(siren.palette?.secondary);
        expect(dark.palette?.background).toBe(siren.palette?.background);
        expect(siren.palette?.primary).not.toEqual(primaryOf(dark));
    });
});

describe('createAppTheme() / getAppTheme()', () => {
    it('builds every colour scheme with the accent, letting MUI derive the hover and light shades', () => {
        const theme = createAppTheme('sky');
        const sky = getAccentPreset('sky');

        for (const scheme of [ 'siren', 'dark', 'blueradiance' ] as const) {
            const primary = primaryIn(theme, scheme);
            expect(primary.main).toBe(sky.dark);
            expect(primary.contrastText).toBe('#0b0f17');
            expect(primary.dark).not.toBe(sky.dark);
            expect(primary.light).not.toBe(sky.dark);
        }

        for (const scheme of [ 'sirenlight', 'light' ] as const) {
            const primary = primaryIn(theme, scheme);
            expect(primary.main).toBe(sky.light);
            expect(primary.contrastText).toBe('#ffffff');
        }

        // components read the CSS variable, which carries the scheme's value as its fallback
        expect(theme.vars.palette.primary.main).toMatch(/^var\(--jf-palette-primary-main\b/);
    });

    it('keeps each theme\'s own primary colour for the default accent', () => {
        const theme = createAppTheme();

        expect(primaryIn(theme, 'siren').main).toBe(primaryOf(siren).main);
        expect(primaryIn(theme, 'sirenlight').main).toBe(primaryOf(sirenlight).main);
        expect(primaryIn(theme, 'dark').main).toBe('#00a4dc');
    });

    it('builds a theme once per accent and resolves unknown ids to the default', () => {
        expect(getAppTheme('violet')).toBe(getAppTheme('violet'));
        expect(getAppTheme('violet')).not.toBe(getAppTheme());
        expect(getAppTheme('not-a-preset')).toBe(getAppTheme());
    });
});
