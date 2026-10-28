import type { ItemCounts } from '@jellyfin/sdk/lib/generated-client/models/item-counts';
import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Devices from '@mui/icons-material/Devices';
import NotificationsActive from '@mui/icons-material/NotificationsActive';
import Schedule from '@mui/icons-material/Schedule';
import VideoLibrary from '@mui/icons-material/VideoLibrary';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import SvgIcon from '@mui/material/SvgIcon';
import Typography from '@mui/material/Typography';
import subSeconds from 'date-fns/subSeconds';
import React, { type FC, useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import { useItemCounts } from 'apps/dashboard/features/metrics/api/useItemCounts';
import useLiveSessions from 'apps/dashboard/features/sessions/hooks/useLiveSessions';
import { useLocale } from 'hooks/useLocale';
import globalize from 'lib/globalize';
import { toDecimalString } from 'utils/number';

const LIBRARY_KINDS: { key: keyof ItemCounts, i18n: string }[] = [
    { key: 'MovieCount', i18n: 'Movies' },
    { key: 'SeriesCount', i18n: 'Series' },
    { key: 'EpisodeCount', i18n: 'Episodes' },
    { key: 'AlbumCount', i18n: 'Albums' },
    { key: 'SongCount', i18n: 'Songs' },
    { key: 'MusicVideoCount', i18n: 'MusicVideos' },
    { key: 'BookCount', i18n: 'Books' },
    { key: 'BoxSetCount', i18n: 'Collections' }
];

interface TileProps {
    Icon: typeof SvgIcon
    label: string
    value?: number
    detail: string
    to: string
    /** Draws the value in the primary colour, for things that need a glance. */
    highlight?: boolean
}

const Tile: FC<TileProps> = ({ Icon, label, value, detail, to, highlight = false }) => {
    const { dateTimeLocale } = useLocale();

    return (
        <Paper
            variant='outlined'
            sx={{ borderRadius: 3, height: '100%', overflow: 'hidden' }}
        >
            <ButtonBase
                component={RouterLink}
                to={to}
                sx={{
                    display: 'block',
                    width: '100%',
                    height: '100%',
                    textAlign: 'left',
                    p: 2,
                    transition: 'background-color 0.15s ease',
                    '&:hover': { bgcolor: 'action.hover' }
                }}
            >
                <Stack direction='row' spacing={1.5} alignItems='flex-start'>
                    <Box
                        sx={{
                            display: 'flex',
                            p: 1,
                            borderRadius: 2,
                            bgcolor: 'action.selected',
                            color: 'primary.main'
                        }}
                    >
                        <Icon fontSize='small' />
                    </Box>
                    <Stack sx={{ minWidth: 0 }}>
                        <Typography variant='body2' color='text.secondary' noWrap>
                            {label}
                        </Typography>
                        <Typography
                            variant='h5'
                            component='div'
                            sx={{ fontWeight: 600, lineHeight: 1.25, color: highlight ? 'primary.main' : 'text.primary' }}
                        >
                            {typeof value === 'number' ? toDecimalString(value, dateTimeLocale) : <Skeleton width={48} />}
                        </Typography>
                        <Typography variant='caption' color='text.secondary' noWrap>
                            {detail}
                        </Typography>
                    </Stack>
                </Stack>
            </ButtonBase>
        </Paper>
    );
};

interface OverviewTilesProps {
    tasks?: TaskInfo[]
}

/** Four numbers that say how the server is doing right now; each one opens the page behind it. */
const OverviewTiles: FC<OverviewTilesProps> = ({ tasks }) => {
    const { data: sessions } = useLiveSessions();
    const { data: counts } = useItemCounts();

    const weekBefore = useMemo(() => (
        subSeconds(new Date(), 7 * 24 * 60 * 60).toISOString()
    ), []);
    const { data: alerts } = useLogEntries({
        startIndex: 0,
        limit: 1,
        minDate: weekBefore,
        hasUserId: false
    });

    const playingCount = sessions?.filter(session => session.NowPlayingItem).length ?? 0;
    const runningTasks = useMemo(() => (
        tasks?.filter(task => task.State === TaskState.Running) ?? []
    ), [ tasks ]);

    // The two biggest kinds of content, or a plain item count for libraries that have no typed counter
    // (home videos, photos, mixed content).
    const libraryDetail = useMemo(() => {
        if (!counts) return '';

        const kinds = LIBRARY_KINDS
            .map(({ key, i18n }) => ({ value: counts[key] ?? 0, label: globalize.translate(i18n) }))
            .filter(kind => kind.value > 0)
            .sort((a, b) => b.value - a.value)
            .slice(0, 2);

        if (kinds.length === 0) {
            return `${counts.ItemCount ?? 0} ${globalize.translate('Items')}`;
        }

        return kinds.map(kind => `${kind.value} ${kind.label}`).join(' · ');
    }, [ counts ]);

    return (
        <Box
            sx={{
                display: 'grid',
                gap: 2,
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, minmax(0, 1fr))',
                    lg: 'repeat(4, minmax(0, 1fr))'
                }
            }}
        >
            <Tile
                Icon={Devices}
                label={globalize.translate('DashboardActiveSessions')}
                value={sessions?.length}
                detail={playingCount > 0 ?
                    globalize.translate('DashboardNowPlayingCount', playingCount) :
                    globalize.translate('DashboardNothingPlaying')}
                to='/dashboard/devices'
                highlight={playingCount > 0}
            />
            <Tile
                Icon={VideoLibrary}
                label={globalize.translate('HeaderLibraries')}
                value={counts?.ItemCount}
                detail={libraryDetail}
                to='/dashboard/libraries'
            />
            <Tile
                Icon={Schedule}
                label={globalize.translate('HeaderRunningTasks')}
                value={tasks ? runningTasks.length : undefined}
                detail={runningTasks[0]?.Name ?? globalize.translate('DashboardNoRunningTasks')}
                to='/dashboard/tasks'
                highlight={runningTasks.length > 0}
            />
            <Tile
                Icon={NotificationsActive}
                label={globalize.translate('Alerts')}
                value={alerts?.TotalRecordCount}
                detail={alerts?.Items?.[0]?.Name ?? globalize.translate('DashboardNoAlerts')}
                to='/dashboard/activity?useractivity=false'
            />
        </Box>
    );
};

export default OverviewTiles;
