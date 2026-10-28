import Diversity3 from '@mui/icons-material/Diversity3';
import DriveFileRenameOutline from '@mui/icons-material/DriveFileRenameOutline';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import MoreVert from '@mui/icons-material/MoreVert';
import OpenInNew from '@mui/icons-material/OpenInNew';
import AvatarGroup from '@mui/material/AvatarGroup';
import Box from '@mui/material/Box';
import CardActionArea from '@mui/material/CardActionArea';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useState } from 'react';
import { Link } from 'react-router-dom';

import UserAvatar from 'components/UserAvatar';
import globalize from 'lib/globalize';
import type { FamilyDto, SirenUserDto } from 'types/family';

interface FamilyCardProps {
    family: FamilyDto
    members: SirenUserDto[]
    onRename: (family: FamilyDto) => void
    onDelete: (family: FamilyDto) => void
}

/** One family on the dashboard list: name, how full it is, its members' avatars and a menu. */
const FamilyCard: FC<FamilyCardProps> = ({ family, members, onRename, onDelete }) => {
    const [ anchorEl, setAnchorEl ] = useState<HTMLElement | null>(null);
    const to = `/dashboard/families/${family.Id}`;

    const onMenuOpen = useCallback((e: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(e.currentTarget);
    }, []);

    const onMenuClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const onRenameClick = useCallback(() => {
        setAnchorEl(null);
        onRename(family);
    }, [ family, onRename ]);

    const onDeleteClick = useCallback(() => {
        setAnchorEl(null);
        onDelete(family);
    }, [ family, onDelete ]);

    return (
        <Paper
            variant='outlined'
            sx={{
                position: 'relative',
                borderRadius: 3,
                overflow: 'hidden',
                bgcolor: 'background.paper'
            }}
        >
            <CardActionArea component={Link} to={to} sx={{ p: 2, height: '100%' }}>
                <Stack spacing={2}>
                    <Stack direction='row' spacing={1.5} alignItems='center' sx={{ pr: 5 }}>
                        <Box
                            sx={{
                                width: 44,
                                height: 44,
                                flexShrink: 0,
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: 'primary.main',
                                color: 'primary.contrastText'
                            }}
                        >
                            <Diversity3 />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography variant='h3' component='h2' noWrap sx={{ fontSize: '1.05rem' }}>
                                {family.Name}
                            </Typography>
                            <Typography variant='body2' color='text.secondary'>
                                {globalize.translate('FamilyProfileCount', family.MemberCount, family.MaxMembers)}
                            </Typography>
                        </Box>
                    </Stack>

                    <Stack direction='row' alignItems='center' sx={{ minHeight: 36 }}>
                        {members.length > 0 ? (
                            <AvatarGroup max={6} sx={{ justifyContent: 'flex-end' }}>
                                {members.map(member => (
                                    <UserAvatar key={member.Id} user={member} size={32} />
                                ))}
                            </AvatarGroup>
                        ) : (
                            <Typography variant='body2' color='text.secondary'>
                                {globalize.translate('NoFamilyProfiles')}
                            </Typography>
                        )}
                    </Stack>
                </Stack>
            </CardActionArea>

            <IconButton
                aria-label={globalize.translate('ButtonMore')}
                onClick={onMenuOpen}
                sx={{ position: 'absolute', top: 8, right: 8 }}
            >
                <MoreVert />
            </IconButton>

            <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={onMenuClose}>
                <MenuItem component={Link} to={to} onClick={onMenuClose}>
                    <ListItemIcon><OpenInNew fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('OpenFamily')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onRenameClick}>
                    <ListItemIcon><DriveFileRenameOutline fontSize='small' /></ListItemIcon>
                    <ListItemText>{globalize.translate('ButtonRename')}</ListItemText>
                </MenuItem>
                <MenuItem onClick={onDeleteClick} sx={{ color: 'error.main' }}>
                    <ListItemIcon><DeleteOutline fontSize='small' color='error' /></ListItemIcon>
                    <ListItemText>{globalize.translate('DeleteFamily')}</ListItemText>
                </MenuItem>
            </Menu>
        </Paper>
    );
};

export default FamilyCard;
