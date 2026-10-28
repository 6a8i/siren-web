import Backup from '@mui/icons-material/Backup';
import Lan from '@mui/icons-material/Lan';
import VpnKey from '@mui/icons-material/VpnKey';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

/** The system-level settings that are set once and rarely revisited. */
const AdvancedDrawerSection = () => {
    return (
        <List
            aria-labelledby='system-subheader'
            subheader={
                <ListSubheader component='div' id='system-subheader'>
                    {globalize.translate('LabelSystem')}
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/networking'>
                    <ListItemIcon>
                        <Lan />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabNetworking')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/keys'>
                    <ListItemIcon>
                        <VpnKey />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderApiKeys')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/backups'>
                    <ListItemIcon>
                        <Backup />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderBackups')} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default AdvancedDrawerSection;
