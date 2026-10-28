import { createTheme } from '@mui/material/styles';

import { DEFAULT_THEME_OPTIONS } from './_base/theme';
import { DEFAULT_ACCENT_ID, applyAccent, resolveAccentId } from './accent';
import appletv from './appletv';
import blueradiance from './blueradiance';
import dark from './dark';
import light from './light';
import purplehaze from './purplehaze';
import siren from './siren';
import sirenlight from './sirenlight';
import wmc from './wmc';

/** Builds the app theme, every colour scheme included, with the accent colour as the primary colour. */
export function createAppTheme(accentId: string = DEFAULT_ACCENT_ID) {
    return createTheme({
        cssVariables: {
            cssVarPrefix: 'jf',
            colorSchemeSelector: '[data-theme="%s"]',
            disableCssColorScheme: true
        },
        defaultColorScheme: 'siren',
        ...DEFAULT_THEME_OPTIONS,
        colorSchemes: {
            appletv: applyAccent(appletv, accentId),
            blueradiance: applyAccent(blueradiance, accentId),
            dark: applyAccent(dark, accentId),
            light: applyAccent(light, accentId),
            purplehaze: applyAccent(purplehaze, accentId),
            siren: applyAccent(siren, accentId),
            sirenlight: applyAccent(sirenlight, accentId),
            wmc: applyAccent(wmc, accentId)
        }
    });
}

type AppTheme = ReturnType<typeof createAppTheme>;

const themesByAccent = new Map<string, AppTheme>();

/** The app theme for an accent colour (the default one for an unknown id), built once per accent. */
export function getAppTheme(accentId?: string | null): AppTheme {
    const id = resolveAccentId(accentId);
    let theme = themesByAccent.get(id);

    if (!theme) {
        theme = createAppTheme(id);
        themesByAccent.set(id, theme);
    }

    return theme;
}

/** The default theme containing all color scheme variants. */
const DEFAULT_THEME = getAppTheme();

export default DEFAULT_THEME;
