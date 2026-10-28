import Devices from '@mui/icons-material/Devices';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatDistanceToNow } from 'date-fns';
import React, { type FC, useCallback, useMemo } from 'react';

import globalize from 'lib/globalize';
import type { FamilyDeviceDto } from 'types/family';
import { getLocaleWithSuffix } from 'utils/dateFnsLocale';

interface FamilyDevicesProps {
    devices?: FamilyDeviceDto[]
    isPending: boolean
    isError: boolean
    /** A disconnect is in flight: the buttons wait for it. */
    isBusy?: boolean
    onDisconnect: (device: FamilyDeviceDto) => void
}

interface DeviceRowProps {
    device: FamilyDeviceDto
    isBusy: boolean
    onDisconnect: (device: FamilyDeviceDto) => void
}

const ROW_HEIGHT = 56;

const getLastActivity = (device: FamilyDeviceDto): string => {
    const time = Date.parse(device.DateLastActivity);
    return Number.isNaN(time) ? '' : globalize.translate('LastSeen', formatDistanceToNow(time, getLocaleWithSuffix()));
};

const DeviceRow: FC<DeviceRowProps> = ({ device, isBusy, onDisconnect }) => {
    const onClick = useCallback(() => onDisconnect(device), [ device, onDisconnect ]);
    const app = [ device.AppName, device.AppVersion ].filter(Boolean).join(' ');
    const lastActivity = getLastActivity(device);

    return (
        <ListItem divider sx={{ px: 2, py: 1.5, gap: 1, alignItems: 'center' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                    <Typography component='span' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                        {device.Name}
                    </Typography>
                    {device.IsCurrent && (
                        <Chip size='small' color='primary' variant='outlined' label={globalize.translate('ThisDevice')} />
                    )}
                </Stack>
                <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-word' }}>
                    {[ app, device.UserName ].filter(Boolean).join(' · ')}
                </Typography>
                {lastActivity && (
                    <Typography variant='caption' color='text.secondary'>{lastActivity}</Typography>
                )}
            </Box>
            {!device.IsCurrent && (
                <Button size='small' color='inherit' variant='outlined' onClick={onClick} disabled={isBusy} sx={{ flexShrink: 0 }}>
                    {globalize.translate('DisconnectDevice')}
                </Button>
            )}
        </ListItem>
    );
};

/** By profile, then by device name, so the list keeps its order between refreshes. */
const sortDevices = (devices: FamilyDeviceDto[]): FamilyDeviceDto[] => (
    [ ...devices ].sort((a, b) => (
        a.UserName.localeCompare(b.UserName) || a.Name.localeCompare(b.Name)
    ))
);

/**
 * "Devices": every device signed in as one of the family's profiles, with a way to sign it out.
 * Shown to family administrators in manage mode, under "Watching now".
 */
const FamilyDevices: FC<FamilyDevicesProps> = ({ devices, isPending, isError, isBusy = false, onDisconnect }) => {
    const sorted = useMemo(() => sortDevices(devices ?? []), [ devices ]);

    return (
        <Paper
            component='section'
            variant='outlined'
            aria-labelledby='family-devices-title'
            sx={{ width: '100%', borderRadius: 3, overflow: 'hidden', bgcolor: 'background.paper' }}
        >
            <Stack direction='row' spacing={1} alignItems='center' sx={{ px: 2, pt: 2, pb: 1 }}>
                <Devices fontSize='small' color='primary' />
                <Typography id='family-devices-title' variant='h3' component='h2' sx={{ fontSize: '1rem', flex: 1 }}>
                    {globalize.translate('HeaderDevices')}
                </Typography>
                {sorted.length > 0 && (
                    <Chip size='small' label={sorted.length} sx={{ fontWeight: 600 }} />
                )}
            </Stack>

            {isError && (
                <Alert severity='error' sx={{ mx: 2, mb: 2 }}>{globalize.translate('FamilyDevicesLoadError')}</Alert>
            )}

            {!isError && isPending && (
                <Box sx={{ px: 2, pb: 2 }}>
                    <Skeleton variant='rounded' height={ROW_HEIGHT} />
                </Box>
            )}

            {!isError && !isPending && sorted.length === 0 && (
                <Typography variant='body2' color='text.secondary' sx={{ px: 2, pb: 2 }}>
                    {globalize.translate('NoFamilyDevices')}
                </Typography>
            )}

            {!isError && sorted.length > 0 && (
                <List disablePadding sx={{ '& .MuiListItem-root:last-child': { borderBottom: 0 } }}>
                    {sorted.map(device => (
                        <DeviceRow key={device.Id} device={device} isBusy={isBusy} onDisconnect={onDisconnect} />
                    ))}
                </List>
            )}
        </Paper>
    );
};

export default FamilyDevices;
