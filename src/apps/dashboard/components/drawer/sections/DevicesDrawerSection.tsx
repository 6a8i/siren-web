import Analytics from '@mui/icons-material/Analytics';
import Article from '@mui/icons-material/Article';
import Devices from '@mui/icons-material/Devices';
import Schedule from '@mui/icons-material/Schedule';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import React from 'react';

import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';

/** Everything about watching the server: who is connected, what happened, what is scheduled, what it logged. */
const DevicesDrawerSection = () => {
    return (
        <List
            aria-labelledby='monitoring-subheader'
            subheader={
                <ListSubheader component='div' id='monitoring-subheader'>
                    {globalize.translate('DashboardMonitoring')}
                </ListSubheader>
            }
        >
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/devices'>
                    <ListItemIcon>
                        <Devices />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderDevices')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/activity'>
                    <ListItemIcon>
                        <Analytics />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('HeaderActivity')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/tasks'>
                    <ListItemIcon>
                        <Schedule />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabScheduledTasks')} />
                </ListItemLink>
            </ListItem>
            <ListItem disablePadding>
                <ListItemLink to='/dashboard/logs'>
                    <ListItemIcon>
                        <Article />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabLogs')} />
                </ListItemLink>
            </ListItem>
        </List>
    );
};

export default DevicesDrawerSection;
