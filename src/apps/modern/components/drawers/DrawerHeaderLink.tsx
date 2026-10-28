import { getDisplayVersion } from '@jellyfin/sdk/lib/utils/versioning';
import Box from '@mui/material/Box';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import React from 'react';

import { useSystemInfo } from 'hooks/useSystemInfo';
import ListItemLink from 'components/ListItemLink';

import appIcon from 'assets/img/siren/icon.svg';

const DrawerHeaderLink = () => {
    const { data: systemInfo } = useSystemInfo();

    return (
        <ListItemLink to='/' sx={{ py: 1.5 }}>
            <ListItemIcon sx={{ minWidth: 48 }}>
                <Box
                    component='img'
                    src={appIcon}
                    alt=''
                    sx={{ height: '2rem' }}
                />
            </ListItemIcon>
            <ListItemText
                primary={systemInfo?.ServerName || 'Siren'}
                secondary={getDisplayVersion(systemInfo?.Version)}
                slotProps={{
                    primary: { variant: 'h6', noWrap: true, sx: { fontSize: '1.05rem', lineHeight: 1.2 } },
                    secondary: { variant: 'caption' }
                }}
            />
        </ListItemLink>);
};

export default DrawerHeaderLink;
