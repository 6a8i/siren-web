import type { SessionInfoDto } from '@jellyfin/sdk/lib/generated-client/models/session-info-dto';
import Pause from '@mui/icons-material/Pause';
import PlayArrow from '@mui/icons-material/PlayArrow';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, useMemo } from 'react';

import useLiveSessions from 'apps/dashboard/features/sessions/hooks/useLiveSessions';
import getNowPlayingName from 'apps/dashboard/features/sessions/utils/getNowPlayingName';
import ListItemLink from 'components/ListItemLink';
import globalize from 'lib/globalize';
import { getDeviceIcon } from 'utils/image';

import SectionCard from './SectionCard';

const MAX_SESSIONS = 6;

const SessionRow: FC<{ session: SessionInfoDto }> = ({ session }) => {
    const nowPlaying = useMemo(() => getNowPlayingName(session), [ session ]);
    const icon = useMemo(() => getDeviceIcon(session), [ session ]);
    const progress = (session.PlayState?.PositionTicks != null && session.NowPlayingItem?.RunTimeTicks) ?
        (session.PlayState.PositionTicks / session.NowPlayingItem.RunTimeTicks) * 100 :
        undefined;

    const title = session.UserName || session.DeviceName || '';
    const subtitle = [ session.Client, session.DeviceName ]
        .filter(part => part && part !== title)
        .join(' · ');

    return (
        <ListItem disablePadding divider>
            <ListItemLink to='/dashboard/devices' sx={{ py: 1 }}>
                <ListItemAvatar>
                    <Avatar
                        variant='rounded'
                        src={icon}
                        alt=''
                        sx={{ bgcolor: 'action.selected', '& img': { objectFit: 'contain', p: 0.75 } }}
                    />
                </ListItemAvatar>
                <ListItemText
                    primary={title}
                    secondary={subtitle}
                    slotProps={{
                        primary: { noWrap: true, fontWeight: 500 },
                        secondary: { noWrap: true }
                    }}
                    sx={{ minWidth: 0, flexBasis: '40%' }}
                />
                {session.NowPlayingItem ? (
                    <Stack sx={{ minWidth: 0, flexBasis: '60%', pl: 1 }} spacing={0.5}>
                        <Stack direction='row' alignItems='center' spacing={0.75}>
                            {session.PlayState?.IsPaused ?
                                <Pause fontSize='inherit' color='disabled' /> :
                                <PlayArrow fontSize='inherit' color='primary' />}
                            <Typography variant='body2' noWrap sx={{ minWidth: 0 }}>
                                {[ nowPlaying.topText, nowPlaying.bottomText ].filter(Boolean).join(' · ')}
                            </Typography>
                        </Stack>
                        {progress !== undefined && (
                            <LinearProgress
                                variant='determinate'
                                value={progress}
                                sx={{ height: 4, borderRadius: 2 }}
                            />
                        )}
                    </Stack>
                ) : (
                    <Chip
                        size='small'
                        variant='outlined'
                        label={globalize.translate('DashboardIdle')}
                        sx={{ color: 'text.secondary' }}
                    />
                )}
            </ListItemLink>
        </ListItem>
    );
};

/** Who is connected and what they are playing, one line per session. */
const SessionsWidget: FC = () => {
    const { data: sessions, isPending } = useLiveSessions();

    const visible = useMemo(() => {
        const sorted = [ ...(sessions ?? []) ]
            .sort((a, b) => Number(Boolean(b.NowPlayingItem)) - Number(Boolean(a.NowPlayingItem)));
        return sorted.slice(0, MAX_SESSIONS);
    }, [ sessions ]);

    return (
        <SectionCard
            title={globalize.translate('DashboardNow')}
            href='/dashboard/devices'
            adornment={sessions && sessions.length > 0 ? (
                <Chip size='small' label={sessions.length} sx={{ fontWeight: 600 }} />
            ) : undefined}
            disablePadding
        >
            {!isPending && visible.length === 0 ? (
                <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
                    {globalize.translate('DashboardNoActiveSessions')}
                </Typography>
            ) : (
                <List disablePadding sx={{ '& .MuiListItem-root:last-child': { borderBottom: 0 } }}>
                    {visible.map(session => (
                        <SessionRow key={session.Id} session={session} />
                    ))}
                </List>
            )}
        </SectionCard>
    );
};

export default SessionsWidget;
