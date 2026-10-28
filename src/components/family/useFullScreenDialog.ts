import type { Theme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

/** Family dialogs take the whole screen on phones, where a floating card leaves no room to type. */
export const useFullScreenDialog = (): boolean => (
    useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'))
);
