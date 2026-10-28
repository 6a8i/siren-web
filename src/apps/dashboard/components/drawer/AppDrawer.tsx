import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import ListItem from '@mui/material/ListItem';
import List from '@mui/material/List';
import React, { FC } from 'react';

import DrawerHeaderLink from 'apps/modern/components/drawers/DrawerHeaderLink';
import ResponsiveDrawer, { ResponsiveDrawerProps } from 'components/ResponsiveDrawer';

import ServerDrawerSection from './sections/ServerDrawerSection';
import DevicesDrawerSection from './sections/DevicesDrawerSection';
import LiveTvDrawerSection from './sections/LiveTvDrawerSection';
import AdvancedDrawerSection from './sections/AdvancedDrawerSection';
import PluginDrawerSection from './sections/PluginDrawerSection';

/**
 * The dashboard navigation. Sections go from the everyday (server settings, monitoring) to the
 * rarely touched (system); rows are dense and group labels small so the whole menu fits at once.
 */
const AppDrawer: FC<ResponsiveDrawerProps> = ({
    open = false,
    onClose,
    onOpen
}) => (
    <ResponsiveDrawer
        open={open}
        onClose={onClose}
        onOpen={onOpen}
    >
        <List disablePadding>
            <ListItem disablePadding>
                <DrawerHeaderLink />
            </ListItem>
        </List>
        <Divider />
        <Box
            sx={{
                py: 0.5,
                '& .MuiList-root': { py: 0.5 },
                '& .MuiListSubheader-root': {
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: '2.4em',
                    color: 'text.secondary',
                    paddingInline: 2.5
                },
                '& .MuiListItemButton-root': {
                    minHeight: 38,
                    paddingBlock: 0.5
                },
                '& .MuiListItemIcon-root': {
                    minWidth: 34,
                    '& .MuiSvgIcon-root': { fontSize: '1.3rem' }
                },
                '& .MuiListItemText-primary': {
                    fontSize: '0.92rem'
                },
                '& .MuiListItemText-inset': {
                    paddingLeft: 4.25
                }
            }}
        >
            <ServerDrawerSection />
            <DevicesDrawerSection />
            <LiveTvDrawerSection />
            <PluginDrawerSection />
            <AdvancedDrawerSection />
        </Box>
    </ResponsiveDrawer>
);

export default AppDrawer;
