import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Tv from '@mui/icons-material/Tv';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, useMemo } from 'react';

import getNowPlayingName from 'apps/dashboard/features/sessions/utils/getNowPlayingName';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { getSessionProgress, sortFamilySessions } from 'utils/familySessions';
import { getUserImageUrl } from 'utils/userImage';

const AVATAR_SIZE = 44;
const AVATAR_IMAGE_WIDTH = 96;

interface FamilySessionsProps {
    sessions?: SessionInfoDto[]
    currentUserId?: string
    isPending: boolean
    isError: boolean
}

interface SessionRowProps {
    session: SessionInfoDto
    isSelf: boolean
}

const SessionRow: FC<SessionRowProps> = ({ session, isSelf }) => {
    const { api } = useApi();
    const nowPlaying = useMemo(() => (session.NowPlayingItem ? getNowPlayingName(session) : undefined), [ session ]);
    const progress = getSessionProgress(session);
    const imageUrl = getUserImageUrl(api, session.UserId, session.UserPrimaryImageTag, AVATAR_IMAGE_WIDTH);
    const device = [ session.Client, session.DeviceName ].filter(Boolean).join(' · ');
    const title = nowPlaying ? [ nowPlaying.topText, nowPlaying.bottomText ].filter(Boolean).join(' · ') : '';

    return (
        <ListItem divider sx={{ alignItems: 'flex-start', px: 2, py: 1.5 }}>
            <ListItemAvatar sx={{ minWidth: AVATAR_SIZE + 16, mt: 0 }}>
                <Avatar
                    alt={session.UserName ?? undefined}
                    src={imageUrl}
                    sx={{
                        width: AVATAR_SIZE,
                        height: AVATAR_SIZE,
                        borderRadius: '28%',
                        fontWeight: 600,
                        bgcolor: imageUrl ? 'background.paper' : 'primary.main',
                        color: 'primary.contrastText'
                    }}
                />
            </ListItemAvatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                    <Typography component='span' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                        {session.UserName}
                    </Typography>
                    {isSelf && (
                        <Chip size='small' color='primary' variant='outlined' label={globalize.translate('YouBadge')} />
                    )}
                </Stack>
                {device && (
                    <Typography variant='body2' color='text.secondary' noWrap>
                        {device}
                    </Typography>
                )}
                {nowPlaying ? (
                    <Stack spacing={0.5} sx={{ mt: 0.75 }}>
                        <Stack direction='row' alignItems='center' spacing={0.75}>
                            {session.PlayState?.IsPaused ?
                                <Pause fontSize='small' color='disabled' /> :
                                <PlayArrow fontSize='small' color='primary' />}
                            <Typography variant='body2' noWrap sx={{ minWidth: 0 }}>
                                {title}
                            </Typography>
                        </Stack>
                        {progress !== undefined && (
                            <LinearProgress
                                variant='determinate'
                                value={progress}
                                aria-label={title}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        )}
                    </Stack>
                ) : (
                    <Chip
                        size='small'
                        variant='outlined'
                        label={globalize.translate('DashboardIdle')}
                        sx={{ mt: 0.75, color: 'text.secondary' }}
                    />
                )}
            </Box>
        </ListItem>
    );
};

/**
 * "Watching now": the family's active sessions, one row per device, with what is playing. Shown
 * to family administrators in manage mode; the server limits the list to the family's profiles.
 */
const FamilySessions: FC<FamilySessionsProps> = ({ sessions, currentUserId, isPending, isError }) => {
    const sorted = useMemo(() => sortFamilySessions(sessions ?? []), [ sessions ]);

    return (
        <Paper
            component='section'
            variant='outlined'
            aria-labelledby='family-sessions-title'
            sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}
        >
            <Stack direction='row' spacing={1} alignItems='center' sx={{ px: 2, pt: 2, pb: 1 }}>
                <Tv fontSize='small' color='primary' />
                <Typography id='family-sessions-title' variant='h3' component='h2' sx={{ fontSize: '1rem', flex: 1 }}>
                    {globalize.translate('WatchingNow')}
                </Typography>
                {sorted.length > 0 && (
                    <Chip size='small' label={sorted.length} sx={{ fontWeight: 600 }} />
                )}
            </Stack>

            {isError && (
                <Alert severity='error' sx={{ mx: 2, mb: 2 }}>{globalize.translate('FamilySessionsLoadError')}</Alert>
            )}

            {!isError && isPending && (
                <Box sx={{ px: 2, pb: 2 }}>
                    <Skeleton variant='rounded' height={AVATAR_SIZE} />
                </Box>
            )}

            {!isError && !isPending && sorted.length === 0 && (
                <Typography variant='body2' color='text.secondary' sx={{ px: 2, pb: 2 }}>
                    {globalize.translate('NoOneWatching')}
                </Typography>
            )}

            {!isError && sorted.length > 0 && (
                <List disablePadding sx={{ '& .MuiListItem-root:last-child': { borderBottom: 0 } }}>
                    {sorted.map(session => (
                        <SessionRow
                            key={session.Id}
                            session={session}
                            isSelf={!!currentUserId && session.UserId === currentUserId}
                        />
                    ))}
                </List>
            )}
        </Paper>
    );
};

export default FamilySessions;
