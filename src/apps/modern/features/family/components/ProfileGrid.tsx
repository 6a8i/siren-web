import Add from '@mui/icons-material/Add';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import Edit from '@mui/icons-material/Edit';
import Key from '@mui/icons-material/Key';
import Lock from '@mui/icons-material/Lock';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Chip from '@mui/material/Chip';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useState } from 'react';

import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import type { SirenUserDto } from 'types/family';

const AVATAR_SIZE = { xs: 88, sm: 112 };

interface ProfileActions {
    /** Switch mode: the profile to switch to. */
    onSelect: (member: SirenUserDto) => void
    /** Manage mode (family administrators). */
    onEdit: (member: SirenUserDto) => void
    onSetPin: (member: SirenUserDto) => void
    onRemove: (member: SirenUserDto) => void
}

interface ProfileGridProps extends ProfileActions {
    members: SirenUserDto[]
    currentUserId?: string
    manage: boolean
    /** Shows the "add profile" tile (manage mode, family not full). */
    canAdd: boolean
    onAdd: () => void
}

interface ProfileTileProps extends ProfileActions {
    member: SirenUserDto
    isCurrent: boolean
    manage: boolean
}

const tileSx = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 1.25,
    width: '100%',
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
    manage,
    onSelect,
    onEdit,
    onSetPin,
    onRemove
}) => {
    const { api } = useApi();
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const isDisabled = !!member.Policy?.IsDisabled;
    const hasPin = !!member.HasPassword;
    const imageUrl = api && member.Id && member.PrimaryImageTag ?
        `${api.basePath}/Users/${member.Id}/Images/Primary?tag=${member.PrimaryImageTag}&maxWidth=320` :
        undefined;

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

    const onRemoveClick = useCallback(() => {
        setAnchorEl(null);
        onRemove(member);
    }, [ member, onRemove ]);

    return (
        <Box sx={{ opacity: isDisabled && !manage ? 0.45 : 1 }}>
            <ButtonBase
                focusRipple
                onClick={onClick}
                disabled={isDisabled && !manage}
                aria-label={member.Name ?? undefined}
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
                            color: 'primary.contrastText'
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
                {isCurrent && (
                    <Chip size='small' color='primary' label={globalize.translate('YouBadge')} />
                )}
                {!isCurrent && isDisabled && (
                    <Chip size='small' label={globalize.translate('Disabled')} />
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
    manage,
    canAdd,
    onAdd,
    ...actions
}) => (
    <Box
        sx={{
            display: 'grid',
            gap: { xs: 1.5, sm: 3 },
            justifyContent: 'center',
            gridTemplateColumns: {
                xs: 'repeat(auto-fit, minmax(110px, 140px))',
                sm: 'repeat(auto-fit, minmax(140px, 160px))'
            },
            width: '100%'
        }}
    >
        {members.map(member => (
            <ProfileTile
                key={member.Id}
                member={member}
                isCurrent={member.Id === currentUserId}
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

export default ProfileGrid;
