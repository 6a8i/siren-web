import { type ColorSystemOptions, type PaletteOptions, alpha, getContrastRatio } from '@mui/material/styles';

/** An accent colour: the primary colour of every colour scheme, with one shade for dark and one for light surfaces. */
export interface AccentPreset {
    id: string
    /** Translation key of the name shown in the picker. */
    label: string
    /** The shade used on dark colour schemes. */
    dark: string
    /** The shade used on light colour schemes. */
    light: string
}

export type AccentMode = 'dark' | 'light';

/** The accent that leaves every colour scheme's own primary colour alone: Siren's teal on the Siren themes. */
export const DEFAULT_ACCENT_ID = 'default';

/**
 * The presets offered in the display settings. The dark-scheme shades are bright enough for near-black
 * text and the light-scheme shades deep enough for white text, so a contained button reads at WCAG AA on
 * both; accent.test.ts checks every one with MUI's contrast ratio.
 */
export const ACCENT_PRESETS: readonly AccentPreset[] = [
    { id: DEFAULT_ACCENT_ID, label: 'AccentDefault', dark: '#2dd4bf', light: '#0f766e' },
    { id: 'sky', label: 'AccentSky', dark: '#60a5fa', light: '#2563eb' },
    { id: 'violet', label: 'AccentViolet', dark: '#a78bfa', light: '#7c3aed' },
    { id: 'rose', label: 'AccentRose', dark: '#f472b6', light: '#db2777' },
    { id: 'amber', label: 'AccentAmber', dark: '#fbbf24', light: '#b45309' },
    { id: 'emerald', label: 'AccentEmerald', dark: '#4ade80', light: '#15803d' },
    { id: 'coral', label: 'AccentCoral', dark: '#fb923c', light: '#c2410c' },
    { id: 'slate', label: 'AccentSlate', dark: '#cbd5e1', light: '#475569' }
];

/** The WCAG 2 AA contrast ratio for normal text. */
export const WCAG_AA_CONTRAST = 4.5;

const LIGHT_TEXT = '#ffffff';
/** The Siren dark surface colour, so dark text on an accent matches the surfaces around it. */
const DARK_TEXT = '#0b0f17';

/** Opacity of the accent tint behind a focused list item, per mode. */
const FOCUS_TINT_OPACITY: Record<AccentMode, number> = { dark: 0.18, light: 0.14 };

/** The preset with the given id, or the default one for anything unknown (an older build, a hand-edited value). */
export function getAccentPreset(id?: string | null): AccentPreset {
    return ACCENT_PRESETS.find(preset => preset.id === id) ?? ACCENT_PRESETS[0];
}

/** A known preset id, or the default. */
export function resolveAccentId(id?: string | null): string {
    return getAccentPreset(id).id;
}

/** The shade of a preset for colour schemes of the given mode. */
export function getAccentColor(preset: AccentPreset, mode: AccentMode): string {
    return mode === 'light' ? preset.light : preset.dark;
}

/**
 * White when it reads on the colour at AA, otherwise near-black. This is MUI's own getContrastText rule with
 * the AA ratio in place of its default threshold of 3, which lets white through on colours it cannot be read on.
 */
export function getAccentContrastText(color: string): string {
    return getContrastRatio(color, LIGHT_TEXT) >= WCAG_AA_CONTRAST ? LIGHT_TEXT : DARK_TEXT;
}

/** The primary palette of a preset for the given mode; MUI derives the hover (dark) and light shades from main. */
export function getAccentPrimary(preset: AccentPreset, mode: AccentMode): PaletteOptions['primary'] {
    const main = getAccentColor(preset, mode);
    return { main, contrastText: getAccentContrastText(main) };
}

/** A colour scheme with the accent as its primary colour. The default accent returns the scheme untouched. */
export function applyAccent(scheme: ColorSystemOptions, accentId?: string | null): ColorSystemOptions {
    const preset = getAccentPreset(accentId);
    if (preset.id === DEFAULT_ACCENT_ID) {
        return scheme;
    }

    const mode: AccentMode = scheme.palette?.mode === 'light' ? 'light' : 'dark';

    return {
        ...scheme,
        palette: {
            ...scheme.palette,
            primary: getAccentPrimary(preset, mode),
            action: {
                ...scheme.palette?.action,
                focus: alpha(getAccentColor(preset, mode), FOCUS_TINT_OPACITY[mode])
            }
        }
    };
}
