import Add from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Edit from '@mui/icons-material/Edit';
import Face from '@mui/icons-material/Face';
import History from '@mui/icons-material/History';
import Key from '@mui/icons-material/Key';
import Lock from '@mui/icons-material/Lock';
import LockOpen from '@mui/icons-material/LockOpen';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useRef, useState } from 'react';

import LockedChip from 'components/family/LockedChip';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { type FamilyMemberDto, isChildProfile } from 'types/family';
import { isMemberLockedOut } from 'utils/lockout';
import { getUserImageUrl } from 'utils/userImage';

const AVATAR_SIZE = { xs: 88, sm: 112 };
/** Enough for the biggest tile at a device pixel ratio of 2 or so. */
const AVATAR_IMAGE_WIDTH = 320;

interface ProfileActions {
    /** Switch mode: the profile to switch to. */
    onSelect: (member: FamilyMemberDto) => void
    /** Manage mode (family administrators). */
    onEdit: (member: FamilyMemberDto) => void
    onSetPin: (member: FamilyMemberDto) => void
    onAvatar: (member: FamilyMemberDto) => void
    onHistory: (member: FamilyMemberDto) => void
    onUnlock: (member: FamilyMemberDto) => void
    onRemove: (member: FamilyMemberDto) => void
}

interface ProfileGridProps extends ProfileActions {
    members: FamilyMemberDto[]
    currentUserId?: string
    /** The profile chosen last time on this device, offered as "Continue as X". */
    lastProfileId?: string
    /** The moment the lockout chips count from (see useLockoutClock). */
    now: number
    manage: boolean
    /** Shows the "add profile" tile (manage mode, family not full). */
    canAdd: boolean
    onAdd: () => void
}

interface ProfileTileProps extends ProfileActions {
    member: FamilyMemberDto
    isCurrent: boolean
    /** Highlighted as the profile to continue with, and focused first for keyboard and TV use. */
    isContinue: boolean
    now: number
    manage: boolean
}

/** Every tile is a real button: keyboard and TV remotes reach it with Tab or the arrows and press Enter. */
const tileSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1.25,
    width: '100%',
    minWidth: 0,
    p: 1,
    borderRadius: 3,
    transition: 'transform 150ms ease',
    '&:hover, &:focus-visible': {
        transform: 'translateY(-2px)'
    },
    '&:hover .profileAvatar, &:focus-visible .profileAvatar': {
        boxShadow: '0 0 0 3px var(--siren-focus-ring, var(--jf-palette-primary-main))'
    }
} as const;

const ProfileTile: FC<ProfileTileProps> = ({
    member,
    isCurrent,
    isContinue,
    now,
    manage,
    onSelect,
    onEdit,
    onSetPin,
    onAvatar,
    onHistory,
    onUnlock,
    onRemove
}) => {
    const { api } = useApi();
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const isDisabled = !!member.Policy?.IsDisabled;
    const isChild = isChildProfile(member);
    const isLocked = isMemberLockedOut(member, now);
    const hasPin = member.HasPin;
    const imageUrl = getUserImageUrl(api, member.Id, member.PrimaryImageTag, AVATAR_IMAGE_WIDTH);
    const showContinue = isContinue && !manage;

    // The "continue" tile takes the focus when the page opens, so a remote or keyboard confirms with one press.
    useEffect(() => {
        if (showContinue) buttonRef.current?.focus();
    }, [ showContinue ]);

    const onClick = useCallback((e: React.MouseEvent<HTMLElement>) => {
        if (manage) {
            setAnchorEl(e.currentTarget);
        } else {
            onSelect(member);
        }
    }, [ manage, member, onSelect ]);

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

    const onRemoveClick = useCallback(() => {
        setAnchorEl(null);
        onRemove(member);
    }, [ member, onRemove ]);

    return (
        <Box sx={{ minWidth: 0, opacity: isDisabled && !manage ? 0.45 : 1 }}>
            <ButtonBase
                ref={buttonRef}
                focusRipple
                onClick={onClick}
                disabled={isDisabled && !manage}
                aria-label={showContinue ? globalize.translate('ContinueAs', member.Name ?? '') : (member.Name ?? undefined)}
                aria-haspopup={manage ? 'menu' : undefined}
                sx={tileSx}
            >
                <Box sx={{ position: 'relative' }}>
                    <Avatar
                        className='profileAvatar'
                        alt={member.Name ?? undefined}
                        src={imageUrl}
                        sx={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            fontSize: { xs: '2rem', sm: '2.6rem' },
                            fontWeight: 600,
                            borderRadius: '28%',
                            bgcolor: imageUrl ? 'background.paper' : 'primary.main',
                            color: 'primary.contrastText',
                            ...(showContinue && {
                                boxShadow: '0 0 0 3px var(--siren-focus-ring, var(--jf-palette-primary-main))'
                            })
                        }}
                    />
                    {(hasPin || manage) && (
                        <Box
                            sx={{
                                position: 'absolute',
                                right: -6,
                                bottom: -6,
                                width: 30,
                                height: 30,
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: manage ? 'primary.main' : 'background.paper',
                                color: manage ? 'primary.contrastText' : 'text.secondary',
                                boxShadow: 2
                            }}
                        >
                            {manage ? <Edit sx={{ fontSize: 16 }} /> : <Lock sx={{ fontSize: 16 }} />}
                        </Box>
                    )}
                </Box>
                <Typography
                    variant='subtitle1'
                    component='span'
                    noWrap
                    sx={{ maxWidth: '100%', fontWeight: 600, lineHeight: 1.2 }}
                >
                    {member.Name}
                </Typography>
                {showContinue && (
                    <Chip
                        size='small'
                        color='primary'
                        label={globalize.translate('ContinueAs', member.Name ?? '')}
                        // Let the label wrap on narrow tiles instead of cutting the name off.
                        sx={{ maxWidth: '100%', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'center', py: 0.25 } }}
                    />
                )}
                {isCurrent && !showContinue && (
                    <Chip size='small' color='primary' variant='outlined' label={globalize.translate('YouBadge')} />
                )}
                {isLocked && (
                    <LockedChip member={member} now={now} />
                )}
                {!isCurrent && !isLocked && isDisabled && (
                    <Chip size='small' label={globalize.translate('Disabled')} />
                )}
                {isChild && (
                    <Chip size='small' color='secondary' variant='outlined' label={globalize.translate('ChildProfileBadge')} />
                )}
            </ButtonBase>

            {manage && (
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
                    {!isCurrent && (
                        <MenuItem onClick={onRemoveClick} sx={{ color: 'error.main' }}>
                            <ListItemIcon><DeleteOutline fontSize='small' color='error' /></ListItemIcon>
                            <ListItemText>{globalize.translate('RemoveProfile')}</ListItemText>
                        </MenuItem>
                    )}
                </Menu>
            )}
        </Box>
    );
};

/** The family's profiles as big tiles: pick one to switch, or manage them. */
const ProfileGrid: FC<ProfileGridProps> = ({
    members,
    currentUserId,
    lastProfileId,
    now,
    manage,
    canAdd,
    onAdd,
    ...actions
}) => {
    // "Continue as": the last profile chosen on this device when it is still here, else the current one.
    const continueId = members.some(member => member.Id === lastProfileId) ? lastProfileId : currentUserId;

    return (
        <Box
            sx={{
                display: 'grid',
                gap: { xs: 1.5, sm: 3 },
                justifyContent: 'center',
                gridTemplateColumns: {
                    xs: 'repeat(auto-fit, minmax(110px, 140px))',
                    sm: 'repeat(auto-fit, minmax(140px, 160px))'
                },
                width: '100%',
                maxWidth: '100%',
                minWidth: 0
            }}
        >
            {members.map(member => (
                <ProfileTile
                    key={member.Id}
                    member={member}
                    isCurrent={member.Id === currentUserId}
                    isContinue={!!member.Id && member.Id === continueId}
                    now={now}
                    manage={manage}
                    {...actions}
                />
            ))}
            {manage && canAdd && (
                <ButtonBase focusRipple onClick={onAdd} sx={tileSx} aria-label={globalize.translate('AddFamilyProfile')}>
                    <Box
                        className='profileAvatar'
                        sx={{
                            width: AVATAR_SIZE,
                            height: AVATAR_SIZE,
                            borderRadius: '28%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px dashed',
                            borderColor: 'divider',
                            color: 'text.secondary'
                        }}
                    >
                        <Add sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant='subtitle1' component='span' sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                        {globalize.translate('AddFamilyProfile')}
                    </Typography>
                </ButtonBase>
            )}
        </Box>
    );
};

export default ProfileGrid;
