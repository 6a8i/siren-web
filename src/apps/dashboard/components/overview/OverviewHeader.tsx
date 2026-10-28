import { getDisplayVersion } from '@jellyfin/sdk/lib/utils/versioning';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import { useSystemInfo } from 'hooks/useSystemInfo';
import globalize from 'lib/globalize';

interface OverviewHeaderProps {
    onScanLibrariesClick: () => void
    onRestartClick: () => void
    onShutdownClick: () => void
    isScanning?: boolean
}

/** The server's name and versions on the left, the three server-wide actions on the right. */
const OverviewHeader: FC<OverviewHeaderProps> = ({
    onScanLibrariesClick,
    onRestartClick,
    onShutdownClick,
    isScanning = false
}) => {
    const { data: systemInfo, isPending } = useSystemInfo();

    return (
        <Stack
            direction={{ xs: 'column', md: 'row' }}
            alignItems={{ xs: 'stretch', md: 'center' }}
            spacing={2}
        >
            <Stack spacing={0.75} flexGrow={1} sx={{ minWidth: 0 }}>
                <Typography
                    variant='h1'
                    component='h1'
                    sx={{ fontSize: '1.6rem', lineHeight: 1.2 }}
                    noWrap
                >
                    {isPending ? <Skeleton width={200} /> : systemInfo?.ServerName}
                </Typography>
                <Stack direction='row' spacing={1} flexWrap='wrap' useFlexGap>
                    <Chip
                        size='small'
                        variant='outlined'
                        label={`${globalize.translate('LabelServerVersion')} ${getDisplayVersion(systemInfo?.Version)}`}
                    />
                    <Chip
                        size='small'
                        variant='outlined'
                        label={`${globalize.translate('LabelWebVersion')} ${getDisplayVersion(__PACKAGE_JSON_VERSION__)}`}
                    />
                    <Chip
                        size='small'
                        variant='outlined'
                        label={`${globalize.translate('LabelBuildVersion')} ${__JF_BUILD_VERSION__}`}
                    />
                </Stack>
            </Stack>

            <Stack
                direction='row'
                spacing={1}
                flexWrap='wrap'
                useFlexGap
                sx={{ flexShrink: 0 }}
            >
                <Button
                    onClick={onScanLibrariesClick}
                    startIcon={<RefreshIcon />}
                    loading={isScanning}
                    loadingPosition='start'
                >
                    {globalize.translate('ButtonScanAllLibraries')}
                </Button>
                <Button
                    onClick={onRestartClick}
                    startIcon={<RestartAltIcon />}
                    variant='outlined'
                    color='error'
                >
                    {globalize.translate('Restart')}
                </Button>
                <Button
                    onClick={onShutdownClick}
                    startIcon={<PowerSettingsNewIcon />}
                    variant='outlined'
                    color='error'
                >
                    {globalize.translate('ButtonShutdown')}
                </Button>
            </Stack>
        </Stack>
    );
};

export default OverviewHeader;
