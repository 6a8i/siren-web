import React, { FunctionComponent, useCallback, useState } from 'react';
import type { BackupManifestDto } from '@jellyfin/sdk/lib/generated-client/models/backup-manifest-dto';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import Restore from '@mui/icons-material/Restore';
import Schedule from '@mui/icons-material/Schedule';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import format from 'date-fns/format';
import { useLocale } from 'hooks/useLocale';
import globalize from 'lib/globalize';
import BackupInfoDialog from './BackupInfoDialog';
import { getBackupFileName, isScheduledBackup } from '../utils/backupArchive';

type BackupProps = {
    backup: BackupManifestDto;
    onRestore: (backup: BackupManifestDto) => void;
};

const Backup: FunctionComponent<BackupProps> = ({ backup, onRestore }) => {
    const [ isInfoDialogOpen, setIsInfoDialogOpen ] = useState(false);
    const { dateFnsLocale } = useLocale();
    const fileName = getBackupFileName(backup.Path);
    const created = Date.parse(backup.DateCreated);
    const createdLabel = Number.isNaN(created) ? backup.DateCreated : format(created, 'PPpp', { locale: dateFnsLocale });

    const onDialogClose = useCallback(() => {
        setIsInfoDialogOpen(false);
    }, []);

    const openDialog = useCallback(() => {
        setIsInfoDialogOpen(true);
    }, []);

    const restore = useCallback(() => {
        onRestore(backup);
    }, [ backup, onRestore ]);

    return (
        <>
            <BackupInfoDialog
                backup={backup}
                onClose={onDialogClose}
                open={isInfoDialogOpen}
            />
            <ListItem
                disablePadding
                secondaryAction={
                    <Tooltip disableInteractive title={globalize.translate('LabelRestore')}>
                        <IconButton aria-label={`${globalize.translate('LabelRestore')} ${fileName}`} onClick={restore}>
                            <Restore />
                        </IconButton>
                    </Tooltip>
                }
            >
                <ListItemButton onClick={openDialog}>
                    <ListItemText
                        disableTypography
                        primary={(
                            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                                <Typography variant='h3' component='span'>{createdLabel}</Typography>
                                {isScheduledBackup(backup.Path) && (
                                    <Chip
                                        size='small'
                                        color='info'
                                        variant='outlined'
                                        icon={<Schedule />}
                                        label={globalize.translate('LabelScheduledBackup')}
                                    />
                                )}
                            </Stack>
                        )}
                        secondary={(
                            <Typography variant='body1' color='text.secondary' component='span'>
                                {fileName}
                            </Typography>
                        )}
                        sx={{ pr: 4 }}
                    />
                </ListItemButton>
            </ListItem>
        </>
    );
};

export default Backup;
