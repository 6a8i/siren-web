import ExpandMore from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import React, { type FC } from 'react';

import { useSystemStorage } from 'apps/dashboard/features/storage/api/useSystemStorage';
import StorageListItem from 'apps/dashboard/features/storage/components/StorageListItem';
import globalize from 'lib/globalize';

/**
 * The server's folders and how full their disks are. Rarely needed at a glance, so it stays folded
 * until asked for.
 */
const StorageSection: FC = () => {
    const { data: systemStorage } = useSystemStorage();

    return (
        <Accordion
            variant='outlined'
            disableGutters
            sx={{
                borderRadius: 3,
                '&::before': { display: 'none' },
                '&.Mui-expanded': { borderRadius: 3 }
            }}
        >
            <AccordionSummary expandIcon={<ExpandMore />} sx={{ px: 2 }}>
                <Typography variant='h3' component='h2' sx={{ fontSize: '1rem' }}>
                    {globalize.translate('DashboardStorageAndPaths')}
                </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: 0, borderTop: 1, borderColor: 'divider' }}>
                <List disablePadding dense>
                    <StorageListItem label={globalize.translate('LabelCache')} folder={systemStorage?.CacheFolder} />
                    <StorageListItem label={globalize.translate('LabelImageCache')} folder={systemStorage?.ImageCacheFolder} />
                    <StorageListItem label={globalize.translate('LabelProgramData')} folder={systemStorage?.ProgramDataFolder} />
                    <StorageListItem label={globalize.translate('LabelLogs')} folder={systemStorage?.LogFolder} />
                    <StorageListItem label={globalize.translate('LabelMetadata')} folder={systemStorage?.InternalMetadataFolder} />
                    <StorageListItem label={globalize.translate('LabelTranscodes')} folder={systemStorage?.TranscodingTempFolder} />
                    <StorageListItem label={globalize.translate('LabelWeb')} folder={systemStorage?.WebFolder} />
                </List>
            </AccordionDetails>
        </Accordion>
    );
};

export default StorageSection;
