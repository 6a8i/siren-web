import { useSyncExternalStore } from 'react';

import { prefersDarkScheme, resolveThemeId, subscribeToSchemeChange } from 'utils/theme';

import { useThemes } from './useThemes';
import { useUserSettings } from './useUserSettings';

export const FALLBACK_THEME_ID = 'dark';

const getServerSnapshot = () => true;

export function useUserTheme() {
    const { theme, dashboardTheme } = useUserSettings();
    const { defaultTheme } = useThemes();

    // Re-render when the system scheme flips, so an automatic theme resolves again.
    useSyncExternalStore(subscribeToSchemeChange, prefersDarkScheme, getServerSnapshot);

    return {
        theme: resolveThemeId(theme) || defaultTheme?.id || FALLBACK_THEME_ID,
        dashboardTheme: resolveThemeId(dashboardTheme) || defaultTheme?.id || FALLBACK_THEME_ID
    };
}
