import { buildCustomColorScheme } from 'themes/utils';

/** The "Siren" colour scheme (default). */
const theme = buildCustomColorScheme({
    palette: {
        mode: 'dark',
        background: {
            default: '#0b0f17',
            paper: '#131a26'
        },
        primary: {
            main: '#2dd4bf',
            dark: '#14b8a6',
            light: '#5eead4',
            contrastText: '#06201d'
        },
        secondary: {
            main: '#38bdf8',
            contrastText: '#06202b'
        },
        error: {
            main: '#f87171'
        },
        text: {
            primary: '#eef2f7',
            secondary: 'rgba(238, 242, 247, 0.66)'
        },
        action: {
            focus: 'rgba(45, 212, 191, 0.18)',
            hover: 'rgba(255, 255, 255, 0.06)',
            selectedOpacity: 0.16
        },
        divider: 'rgba(255, 255, 255, 0.08)',
        Alert: {
            infoFilledBg: '#0f3b4c',
            infoFilledColor: '#d8f3fc'
        },
        AppBar: {
            defaultBg: '#131a26'
        },
        Button: {
            inheritContainedBg: 'rgba(255, 255, 255, 0.08)',
            inheritContainedHoverBg: 'rgba(255, 255, 255, 0.14)'
        },
        FilledInput: {
            bg: 'rgba(255, 255, 255, 0.06)'
        },
        SnackbarContent: {
            bg: '#1b2433',
            color: '#eef2f7'
        }
    }
});

export default theme;
