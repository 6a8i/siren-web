import { useMemo } from 'react';

import { getAppTheme } from 'themes';

import { useUserSettings } from './useUserSettings';

/** The MUI theme with the user's accent colour as the primary colour of every colour scheme. */
export function useAppTheme() {
    const { accentColor } = useUserSettings();

    return useMemo(() => getAppTheme(accentColor), [ accentColor ]);
}
