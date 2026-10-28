import AccountCircle from '@mui/icons-material/AccountCircle';
import AppSettingsAlt from '@mui/icons-material/AppSettingsAlt';
import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Diversity3 from '@mui/icons-material/Diversity3';
import Download from '@mui/icons-material/Download';
import Edit from '@mui/icons-material/Edit';
import Logout from '@mui/icons-material/Logout';
import PhonelinkLock from '@mui/icons-material/PhonelinkLock';
import Settings from '@mui/icons-material/Settings';
import Storage from '@mui/icons-material/Storage';
import SwitchAccount from '@mui/icons-material/SwitchAccount';
import Divider from '@mui/material/Divider';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';
import Menu, { MenuProps } from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import React, { FC, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import { appHost } from 'components/apphost';
import FamilyAdminPinDialog from 'components/family/FamilyAdminPinDialog';
import { THEME_CHOICES, useThemeChoice } from 'components/theme/ThemeQuickSwitch';
import { AppFeature } from 'constants/appFeature';
import { useApi } from 'hooks/useApi';
import { useQuickConnectEnabled } from 'hooks/useQuickConnect';
import globalize from 'lib/globalize';
import shell from 'scripts/shell';
import { getFamilyId, isChildProfile, isFamilyAdministrator } from 'types/family';
import Dashboard from 'utils/dashboard';

export const ID = 'app-user-menu';

interface AppUserMenuProps extends MenuProps {
    onMenuClose: () => void
}

const AppUserMenu: FC<AppUserMenuProps> = ({
    anchorEl,
    open,
    onMenuClose
}) => {
    const { user } = useApi();
    const { data: isQuickConnectEnabled } = useQuickConnectEnabled();
    const { current: currentThemeChoice, apply: applyThemeChoice } = useThemeChoice();
    const familyId = getFamilyId(user);
    const isFamilyAdmin = isFamilyAdministrator(user);
    const isChild = isChildProfile(user);
    const [ isPinDialogOpen, setIsPinDialogOpen ] = useState(false);

    // A child profile signs out only with a family administrator's PIN.
    const onChildLogoutClick = useCallback(() => {
        onMenuClose();
        setIsPinDialogOpen(true);
    }, [ onMenuClose ]);

    const onPinDialogClose = useCallback(() => {
        setIsPinDialogOpen(false);
    }, []);

    const onPinVerified = useCallback(() => {
        setIsPinDialogOpen(false);
        Dashboard.logout();
    }, []);

    const onThemeChoiceClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        const id = e.currentTarget.dataset.theme;
        if (id) {
            applyThemeChoice(id);
        }
        onMenuClose();
    }, [ applyThemeChoice, onMenuClose ]);

    const onDownloadManagerClick = useCallback(() => {
        shell.openDownloadManager();
        onMenuClose();
    }, [ onMenuClose ]);

    const onClientSettingsClick = useCallback(() => {
        shell.openClientSettings();
        onMenuClose();
    }, [ onMenuClose ]);

    const onExitAppClick = useCallback(() => {
        appHost.exit();
        onMenuClose();
    }, [ onMenuClose ]);

    const onLogoutClick = useCallback(() => {
        Dashboard.logout();
        onMenuClose();
    }, [ onMenuClose ]);

    const onSelectServerClick = useCallback(() => {
        Dashboard.selectServer();
        onMenuClose();
    }, [ onMenuClose ]);

    if (isChild) {
        // Switching profiles and signing out: no settings, no dashboard, no theme.
        return (
            <>
                <Menu
                    anchorEl={anchorEl}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                    id={ID}
                    keepMounted
                    open={open}
                    onClose={onMenuClose}
                >
                    {familyId && (
                        <MenuItem component={Link} to='/family' onClick={onMenuClose}>
                            <ListItemIcon>
                                <SwitchAccount />
                            </ListItemIcon>
                            <ListItemText>
                                {globalize.translate('SwitchProfile')}
                            </ListItemText>
                        </MenuItem>
                    )}
                    <MenuItem onClick={onChildLogoutClick}>
                        <ListItemIcon>
                            <Logout />
                        </ListItemIcon>
                        <ListItemText>
                            {globalize.translate('ButtonSignOut')}
                        </ListItemText>
                    </MenuItem>
                </Menu>
                <FamilyAdminPinDialog
                    open={isPinDialogOpen}
                    description={globalize.translate('ChildSignOutNeedsAdminPin')}
                    onClose={onPinDialogClose}
                    onVerified={onPinVerified}
                />
            </>
        );
    }

    return (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right'
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right'
            }}
            id={ID}
            keepMounted
            open={open}
            onClose={onMenuClose}
        >
            <MenuItem
                component={Link}
                to={`/userprofile?userId=${user?.Id}`}
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <AccountCircle />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Profile')}
                </ListItemText>
            </MenuItem>
            <MenuItem
                component={Link}
                to='/mypreferencesmenu'
                onClick={onMenuClose}
            >
                <ListItemIcon>
                    <Settings />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('Settings')}
                </ListItemText>
            </MenuItem>

            {/* FAMILY LINKS */}
            {familyId && ([
                <Divider key='family-links-divider' />,
                <MenuItem
                    key='family-switch-link'
                    component={Link}
                    to='/family'
                    onClick={onMenuClose}
                >
                    <ListItemIcon>
                        <SwitchAccount />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('SwitchProfile')}
                    </ListItemText>
                </MenuItem>,
                isFamilyAdmin && (
                    <MenuItem
                        key='family-manage-link'
                        component={Link}
                        to='/family?manage=1'
                        onClick={onMenuClose}
                    >
                        <ListItemIcon>
                            <Diversity3 />
                        </ListItemIcon>
                        <ListItemText>
                            {globalize.translate('ManageFamily')}
                        </ListItemText>
                    </MenuItem>
                )
            ])}

            <Divider />
            <ListSubheader disableSticky sx={{ bgcolor: 'transparent', lineHeight: '2.4em' }}>
                {globalize.translate('LabelTheme')}
            </ListSubheader>
            {THEME_CHOICES.map(({ id, label, Icon }) => (
                <MenuItem
                    key={id}
                    data-theme={id}
                    selected={currentThemeChoice === id}
                    onClick={onThemeChoiceClick}
                >
                    <ListItemIcon>
                        <Icon />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate(label)}
                    </ListItemText>
                    {currentThemeChoice === id && <Check fontSize='small' />}
                </MenuItem>
            ))}

            {(appHost.supports(AppFeature.DownloadManagement) || appHost.supports(AppFeature.ClientSettings)) && (
                <Divider />
            )}

            {appHost.supports(AppFeature.DownloadManagement) && (
                <MenuItem
                    onClick={onDownloadManagerClick}
                >
                    <ListItemIcon>
                        <Download />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('DownloadManager')}
                    </ListItemText>
                </MenuItem>
            )}

            {appHost.supports(AppFeature.ClientSettings) && (
                <MenuItem
                    onClick={onClientSettingsClick}
                >
                    <ListItemIcon>
                        <AppSettingsAlt />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('ClientSettings')}
                    </ListItemText>
                </MenuItem>
            )}

            {/* ADMIN LINKS */}
            {user?.Policy?.IsAdministrator && ([
                <Divider key='admin-links-divider' />,
                <MenuItem
                    key='admin-dashboard-link'
                    component={Link}
                    to='/dashboard'
                    onClick={onMenuClose}
                >

                    <ListItemIcon>
                        <DashboardIcon />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('TabDashboard')} />
                </MenuItem>,
                <MenuItem
                    key='admin-metadata-link'
                    component={Link}
                    to='/metadata'
                    onClick={onMenuClose}
                >
                    <ListItemIcon>
                        <Edit />
                    </ListItemIcon>
                    <ListItemText primary={globalize.translate('MetadataManager')} />
                </MenuItem>
            ])}

            <Divider />
            {isQuickConnectEnabled && (
                <MenuItem
                    component={Link}
                    to='/quickconnect'
                    onClick={onMenuClose}
                >
                    <ListItemIcon>
                        <PhonelinkLock />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('QuickConnect')}
                    </ListItemText>
                </MenuItem>
            )}

            {appHost.supports(AppFeature.MultiServer) && (
                <MenuItem
                    onClick={onSelectServerClick}
                >
                    <ListItemIcon>
                        <Storage />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('SelectServer')}
                    </ListItemText>
                </MenuItem>
            )}

            <MenuItem
                onClick={onLogoutClick}
            >
                <ListItemIcon>
                    <Logout />
                </ListItemIcon>
                <ListItemText>
                    {globalize.translate('ButtonSignOut')}
                </ListItemText>
            </MenuItem>

            {appHost.supports(AppFeature.ExitMenu) && ([
                <Divider key='exit-menu-divider' />,
                <MenuItem
                    key='exit-menu-button'
                    onClick={onExitAppClick}
                >
                    <ListItemIcon>
                        <Close />
                    </ListItemIcon>
                    <ListItemText>
                        {globalize.translate('ButtonExitApp')}
                    </ListItemText>
                </MenuItem>
            ])}
        </Menu>
    );
};

export default AppUserMenu;
