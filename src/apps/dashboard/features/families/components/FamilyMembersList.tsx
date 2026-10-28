import CheckBox from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Edit from '@mui/icons-material/Edit';
import Face from '@mui/icons-material/Face';
import History from '@mui/icons-material/History';
import Key from '@mui/icons-material/Key';
import LinkOff from '@mui/icons-material/LinkOff';
import LockOpen from '@mui/icons-material/LockOpen';
import MoreVert from '@mui/icons-material/MoreVert';
import OpenInNew from '@mui/icons-material/OpenInNew';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatDistanceToNow } from 'date-fns';
import React, { type FC, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import LockedChip from 'components/family/LockedChip';
import UserAvatar from 'components/UserAvatar';
import globalize from 'lib/globalize';
import { type FamilyMemberDto, isChildProfile } from 'types/family';
import { getLocaleWithSuffix } from 'utils/dateFnsLocale';
import { isMemberLockedOut } from 'utils/lockout';

interface MemberActions {
    onEdit: (member: FamilyMemberDto) => void
    onSetPin: (member: FamilyMemberDto) => void
    onAvatar: (member: FamilyMemberDto) => void
    onHistory: (member: FamilyMemberDto) => void
    onUnlock: (member: FamilyMemberDto) => void
    onToggleFamilyAdmin: (member: FamilyMemberDto) => void
    onUnlink: (member: FamilyMemberDto) => void
    onRemove: (member: FamilyMemberDto) => void
}

interface FamilyMembersListProps extends MemberActions {
    members: FamilyMemberDto[]
    /** The moment the lockout chips count from (see useLockoutClock). */
    now: number
}

interface FamilyMemberRowProps extends MemberActions {
    member: FamilyMemberDto
    now: number
}

const getLastSeen = (lastActivityDate?: string | null) => (
    lastActivityDate ?
        globalize.translate('LastSeen', formatDistanceToNow(Date.parse(lastActivityDate), getLocaleWithSuffix())) :
        ''
);

const FamilyMemberRow: FC<FamilyMemberRowProps> = ({
    member,
    now,
    onEdit,
    onSetPin,
    onAvatar,
    onHistory,
    onUnlock,
    onToggleFamilyAdmin,
    onUnlink,
    onRemove
}) => {
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const isFamilyAdmin = !!member.Policy?.IsFamilyAdministrator;
    const isChild = isChildProfile(member);
    const hasPin = member.HasPin;
    const isLocked = isMemberLockedOut(member, now);
    const lastSeen = getLastSeen(member.LastActivityDate);
    const userPageUrl = `/dashboard/users/${member.Id}/profile`;

    const onMenuOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const onEditClick = useCallback(() => {
        setAnchorEl(null);
        onEdit(member);
    }, [ member, onEdit ]);

    const onPinClick = useCallback(() => {
        setAnchorEl(null);
        onSetPin(member);
    }, [ member, onSetPin ]);

    const onAvatarClick = useCallback(() => {
        setAnchorEl(null);
        onAvatar(member);
    }, [ member, onAvatar ]);

    const onHistoryClick = useCallback(() => {
        setAnchorEl(null);
        onHistory(member);
    }, [ member, onHistory ]);

    const onUnlockClick = useCallback(() => {
        setAnchorEl(null);
        onUnlock(member);
    }, [ member, onUnlock ]);

    const onToggleAdminClick = useCallback(() => {
        setAnchorEl(null);
        onToggleFamilyAdmin(member);
    }, [ member, onToggleFamilyAdmin ]);

    const onUnlinkClick = useCallback(() => {
        setAnchorEl(null);
        onUnlink(member);
    }, [ member, onUnlink ]);

    const onRemoveClick = useCallback(() => {
        setAnchorEl(null);
        onRemove(member);
    }, [ member, onRemove ]);

    return (
        <ListItem
            divider
            secondaryAction={(
                <IconButton edge='end' aria-label={globalize.translate('ButtonMore')} onClick={onMenuOpen}>
                    <MoreVert />
                </IconButton>
            )}
        >
            <ListItemAvatar>
                <UserAvatar user={member} />
            </ListItemAvatar>
            <ListItemText
                disableTypography
                primary={(
                    <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                        <Typography component='span' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                            {member.Name}
                        </Typography>
                        {isFamilyAdmin && (
                            <Chip size='small' color='primary' variant='outlined' label={globalize.translate('FamilyAdministrator')} />
                        )}
                        {isChild && (
                            <Chip size='small' color='secondary' variant='outlined' label={globalize.translate('ChildProfileBadge')} />
                        )}
                        {member.Policy?.IsDisabled && (
                            <Chip size='small' label={globalize.translate('Disabled')} />
                        )}
                        {isLocked && (
                            <LockedChip member={member} now={now} />
                        )}
                    </Stack>
                )}
                secondary={(
                    <Typography variant='body2' color='text.secondary' component='span'>
                        {globalize.translate(hasPin ? 'PinProtected' : 'NoPin')}
                        {lastSeen && ` · ${lastSeen}`}
                    </Typography>
                )}
                sx={{ pr: 4 }}
            />

            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={onMenuClose}>
                <MenuItem onClick={onEditClick}>
                    <ListItemIcon><Edit fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('EditFamilyProfile')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onPinClick}>
                    <ListItemIcon><Key fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate(hasPin ? 'ChangePin' : 'SetPin')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onAvatarClick}>
                    <ListItemIcon><Face fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('ProfileAvatar')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onHistoryClick}>
                    <ListItemIcon><History fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('WatchHistory')}</ListItemText>
                </MenuItem>
                {isLocked && (
                    <MenuItem onClick={onUnlockClick}>
                        <ListItemIcon><LockOpen fontSize='small' color='warning' /></ListItemIcon>
                        <ListItemText>{globalize.translate('UnlockProfile')}</ListItemText>
                    </MenuItem>
                )}
                <MenuItem onClick={onToggleAdminClick} disabled={isChild}>
                    <ListItemIcon>
                        {isFamilyAdmin ? <CheckBox fontSize='small' color='primary' /> : <CheckBoxOutlineBlank fontSize='small' />}
                    </ListItemIcon>
                    <ListItemText>{globalize.translate('FamilyAdministrator')}</ListItemText>
                </MenuItem>
                <MenuItem component={Link} to={userPageUrl} onClick={onMenuClose}>
                    <ListItemIcon><OpenInNew fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('OpenFullUserPage')}</ListItemText>
                </MenuItem>
                <Divider />
                <MenuItem onClick={onUnlinkClick}>
                    <ListItemIcon><LinkOff fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('UnlinkFromFamily')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onRemoveClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteOutline fontSize='small' color='error' /></ListItemIcon>
                    <ListItemText>{globalize.translate('RemoveProfile')}</ListItemText>
                </MenuItem>
            </Menu>
        </ListItem>
    );
};

/** The profiles of one family with a per-row action menu. */
const FamilyMembersList: FC<FamilyMembersListProps> = ({ members, now, ...actions }) => (
    <Paper variant='outlined' sx={{ borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}>
        {members.length > 0 ? (
            <List disablePadding>
                {members.map(member => (
                    <FamilyMemberRow key={member.Id} member={member} now={now} {...actions} />
                ))}
            </List>
        ) : (
            <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
                {globalize.translate('NoFamilyProfiles')}
            </Typography>
        )}
    </Paper>
);

export default FamilyMembersList;
