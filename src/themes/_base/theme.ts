import type { ColorSystemOptions, ThemeOptions } from '@mui/material/styles';
import type {} from '@mui/material/themeCssVarsAugmentation';

const LIST_ICON_WIDTH = 36;

/** The default "Dark" color scheme. */
export const DEFAULT_COLOR_SCHEME: ColorSystemOptions = {
    palette: {
        mode: 'dark',
        primary: {
            main: '#00a4dc'
        },
        secondary: {
            main: '#00a4dc'
        },
        background: {
            default: '#101010',
            paper: '#202020'
        },
        action: {
            selectedOpacity: 0.2
        },
        starIcon: {
            main: '#f2b01e' // Yellow color
        },
        error: {
            main: '#c62828' // Red color
        },
        AppBar: {
            defaultBg: '#202020'
        }
    }
};

/** The default customizations to the default MUI theme. */
export const DEFAULT_THEME_OPTIONS: ThemeOptions = {
    shape: {
        borderRadius: 10
    },
    typography: {
        fontFamily: '"Noto Sans", sans-serif',
        button: {
            textTransform: 'none',
            fontWeight: 600
        },
        h1: {
            fontSize: '1.8rem',
            fontWeight: 600,
            letterSpacing: '-0.015em'
        },
        h2: {
            fontSize: '1.5rem',
            fontWeight: 600,
            letterSpacing: '-0.015em'
        },
        h3: {
            fontSize: '1.17rem',
            fontWeight: 600
        }
    },
    components: {
        MuiAlert: {
            styleOverrides: {
                message: {
                    // NOTE: This seems like a bug. Block content does not fill the container width.
                    flexGrow: 1
                }
            }
        },
        MuiAppBar: {
            styleOverrides: {
                colorTransparent: ({ theme }) => ({
                    color: theme.vars.palette.text.primary
                })
            }
        },
        MuiButton: {
            defaultProps: {
                variant: 'contained'
            },
            styleOverrides: {
                root: {
                    borderRadius: 999,
                    paddingInline: 18
                },
                contained: {
                    boxShadow: 'none'
                }
            },
            variants: [
                {
                    props: {
                        size: 'large'
                    },
                    style: {
                        fontSize: '1rem',
                        fontWeight: 'bold'
                    }
                }
            ]
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: 14
                }
            }
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    fontWeight: 500
                }
            }
        },
        MuiDrawer: {
            styleOverrides: {
                paper: ({ theme }) => ({
                    borderRight: `1px solid ${theme.vars.palette.divider}`,
                    backgroundImage: 'none'
                })
            }
        },
        MuiFormControl: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiFormHelperText: {
            styleOverrides: {
                root: {
                    fontSize: '1rem'
                }
            }
        },
        MuiTextField: {
            defaultProps: {
                variant: 'filled'
            }
        },
        MuiListItemButton: {
            styleOverrides: {
                root: ({ theme }) => ({
                    borderRadius: 8,
                    marginInline: 8,
                    paddingInline: 12,
                    '&.Mui-selected': {
                        color: theme.vars.palette.primary.main
                    },
                    '&.Mui-selected .MuiListItemIcon-root': {
                        color: theme.vars.palette.primary.main
                    },
                    '&.Mui-selected .MuiListItemText-primary': {
                        fontWeight: 600
                    }
                })
            }
        },
        MuiListItemIcon: {
            styleOverrides: {
                root: {
                    minWidth: LIST_ICON_WIDTH
                }
            }
        },
        MuiListSubheader: {
            styleOverrides: {
                root: {
                    // NOTE: Added for drawer subheaders, but maybe it won't work in other cases?
                    backgroundColor: 'inherit',
                    position: 'initial'
                }
            }
        },
        MuiListItemText: {
            styleOverrides: {
                inset: {
                    paddingLeft: LIST_ICON_WIDTH
                }
            }
        },
        MuiPaper: {
            styleOverrides: {
                rounded: {
                    borderRadius: 12
                }
            }
        },
        MuiToolbar: {
            styleOverrides: {
                dense: {
                    minHeight: 52
                }
            }
        }
    }
};
