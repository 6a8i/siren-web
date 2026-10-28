import BrightnessAuto from '@mui/icons-material/BrightnessAuto';
import DarkMode from '@mui/icons-material/DarkMode';
import LightMode from '@mui/icons-material/LightMode';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import React, { type FC, useCallback } from 'react';

import { useThemes } from 'hooks/useThemes';
import { useUserSettings } from 'hooks/useUserSettings';
import globalize from 'lib/globalize';
import { currentSettings as userSettings } from 'scripts/settings/userSettings';
import { AUTO_DARK_THEME_ID, AUTO_LIGHT_THEME_ID, AUTO_THEME_ID } from 'utils/theme';

/** The three choices offered by the quick switch: dark, light, or whatever the system prefers. */
export const THEME_CHOICES = [
    { id: AUTO_DARK_THEME_ID, label: 'ThemeDark', Icon: DarkMode },
    { id: AUTO_LIGHT_THEME_ID, label: 'ThemeLight', Icon: LightMode },
    { id: AUTO_THEME_ID, label: 'ThemeFollowSystem', Icon: BrightnessAuto }
] as const;

/** Applies a choice to the app and the dashboard alike, so one tap changes the whole interface. */
export function applyThemeChoice(id: string) {
    userSettings.theme(id);
    userSettings.dashboardTheme(id);
}

/** The currently selected quick-switch choice, if the stored theme is one of them. */
export function useThemeChoice() {
    const { theme } = useUserSettings();
    const { defaultTheme } = useThemes();

    // Nothing stored yet means the default theme is in use.
    const effectiveTheme = theme || defaultTheme?.id;
    const current = THEME_CHOICES.find(choice => choice.id === effectiveTheme)?.id;

    return { current, apply: applyThemeChoice };
}

interface ThemeQuickSwitchProps {
    fullWidth?: boolean
}

const ThemeQuickSwitch: FC<ThemeQuickSwitchProps> = ({ fullWidth = true }) => {
    const { current, apply } = useThemeChoice();

    const onChange = useCallback((_e: React.MouseEvent<HTMLElement>, value: string | null) => {
        if (value) {
            apply(value);
        }
    }, [ apply ]);

    return (
        <ToggleButtonGroup
            exclusive
            fullWidth={fullWidth}
            size='small'
            value={current ?? null}
            onChange={onChange}
            aria-label={globalize.translate('LabelTheme')}
        >
            {THEME_CHOICES.map(({ id, label, Icon }) => (
                <ToggleButton
                    key={id}
                    value={id}
                    sx={{ gap: 1, textTransform: 'none', fontWeight: 600 }}
                >
                    <Icon fontSize='small' />
                    {globalize.translate(label)}
                </ToggleButton>
            ))}
        </ToggleButtonGroup>
    );
};

export default ThemeQuickSwitch;
