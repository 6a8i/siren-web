import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import React, { type FC } from 'react';

import { type AccentPreset, getAccentColor } from 'themes/accent';

interface AccentSwatchProps {
    preset: AccentPreset
}

/** A colour dot for an accent preset, in the shade the current colour scheme would use. */
const AccentSwatch: FC<AccentSwatchProps> = ({ preset }) => {
    const { palette } = useTheme();

    return (
        <Box
            component='span'
            aria-hidden
            sx={{
                display: 'inline-block',
                width: 16,
                height: 16,
                marginRight: 1.5,
                verticalAlign: 'middle',
                borderRadius: '50%',
                border: '1px solid',
                borderColor: 'divider',
                bgcolor: getAccentColor(preset, palette.mode)
            }}
        />
    );
};

export default AccentSwatch;
