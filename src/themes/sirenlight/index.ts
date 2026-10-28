import { buildCustomColorScheme } from 'themes/utils';

/** The "Siren Light" colour scheme. */
const theme = buildCustomColorScheme({
    palette: {
        mode: 'light',
        background: {
            default: '#f4f7fb',
            paper: '#ffffff'
        },
        primary: {
            main: '#0d9488',
            dark: '#0f766e',
            light: '#14b8a6',
            contrastText: '#ffffff'
        },
        secondary: {
            main: '#0284c7',
            contrastText: '#ffffff'
        },
        error: {
            main: '#dc2626'
        },
        text: {
            primary: '#0f172a',
            secondary: 'rgba(15, 23, 42, 0.68)'
        },
        action: {
            focus: 'rgba(13, 148, 136, 0.14)',
            hover: 'rgba(15, 23, 42, 0.05)',
            selectedOpacity: 0.12
        },
        divider: 'rgba(15, 23, 42, 0.1)',
        Alert: {
            infoFilledBg: '#dbeffb',
            infoFilledColor: '#0c3d5c'
        },
        AppBar: {
            defaultBg: '#ffffff'
        },
        Button: {
            inheritContainedBg: '#e9eef5',
            inheritContainedHoverBg: '#dde5ee'
        },
        FilledInput: {
            bg: '#ffffff'
        },
        SnackbarContent: {
            bg: '#1e293b',
            color: '#f8fafc'
        }
    }
});

export default theme;
