import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import Movie from '@mui/icons-material/Movie';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { formatDistanceToNow } from 'date-fns';
import React, { type FC, useMemo } from 'react';

import { useFamilyHistory } from 'hooks/api/family/useFamilyHistory';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import type { FamilyHistoryEntryDto } from 'types/family';
import { getLocaleWithSuffix } from 'utils/dateFnsLocale';
import { getHistoryContext, getHistoryProgress, getHistoryTimestamp, sortHistory } from 'utils/familyHistory';

import { useFullScreenDialog } from './useFullScreenDialog';

interface FamilyHistoryDialogProps {
    open: boolean
    familyId?: string
    /** The member whose history is shown; none closes the dialog. */
    userId?: string
    memberName?: string | null
    onClose: () => void
}

const IMAGE_SIZE = 48;
/** Wide enough for the thumbnail at a device pixel ratio of 2 or so. */
const IMAGE_WIDTH = 120;

const getWhen = (entry: FamilyHistoryEntryDto): string => {
    const time = getHistoryTimestamp(entry);
    return time === undefined ? '' : formatDistanceToNow(time, getLocaleWithSuffix());
};

const HistoryRow: FC<{ entry: FamilyHistoryEntryDto }> = ({ entry }) => {
    const { api } = useApi();
    const imageUrl = api && entry.ImageTag ?
        getImageApi(api).getItemImageUrlById(entry.ItemId, ImageType.Primary, { tag: entry.ImageTag, maxWidth: IMAGE_WIDTH }) :
        undefined;
    const context = getHistoryContext(entry);
    const progress = getHistoryProgress(entry);
    const when = getWhen(entry);

    return (
        <ListItem divider sx={{ px: 0, alignItems: 'flex-start' }}>
            <ListItemAvatar sx={{ minWidth: IMAGE_SIZE + 16 }}>
                <Avatar
                    variant='rounded'
                    alt=''
                    src={imageUrl}
                    sx={{ width: IMAGE_SIZE, height: IMAGE_SIZE, bgcolor: 'action.selected', color: 'text.secondary' }}
                >
                    <Movie fontSize='small' />
                </Avatar>
            </ListItemAvatar>
            <ListItemText
                disableTypography
                primary={(
                    <Typography component='span' sx={{ fontWeight: 600, wordBreak: 'break-word' }}>
                        {entry.Name}
                    </Typography>
                )}
                secondary={(
                    <Stack spacing={0.5} sx={{ mt: 0.25 }}>
                        {context && (
                            <Typography variant='body2' color='text.secondary' sx={{ wordBreak: 'break-word' }}>
                                {context}
                            </Typography>
                        )}
                        <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap>
                            {when && (
                                <Typography variant='caption' color='text.secondary'>{when}</Typography>
                            )}
                            {progress.kind === 'completed' && (
                                <Chip size='small' color='success' variant='outlined' label={globalize.translate('Watched')} />
                            )}
                            {progress.kind === 'partial' && (
                                <Chip size='small' variant='outlined' label={`${progress.percentage}%`} />
                            )}
                        </Stack>
                    </Stack>
                )}
            />
        </ListItem>
    );
};

/** "History": the last items a profile played, for a family administrator in manage mode or the dashboard. */
const FamilyHistoryDialog: FC<FamilyHistoryDialogProps> = ({ open, familyId, userId, memberName, onClose }) => {
    const { data, isPending, isError } = useFamilyHistory(open ? familyId : undefined, open ? userId : undefined);
    const entries = useMemo(() => sortHistory(data ?? []), [ data ]);
    const fullScreen = useFullScreenDialog();

    return (
        <Dialog open={open} onClose={onClose} fullWidth fullScreen={fullScreen} maxWidth='sm'>
            <DialogTitle>
                {globalize.translate('WatchHistory')}
                {memberName ? ` · ${memberName}` : ''}
            </DialogTitle>
            <DialogContent>
                {isError && (
                    <Alert severity='error'>{globalize.translate('FamilyHistoryLoadError')}</Alert>
                )}

                {!isError && isPending && (
                    <Stack spacing={1}>
                        <Skeleton variant='rounded' height={IMAGE_SIZE} />
                        <Skeleton variant='rounded' height={IMAGE_SIZE} />
                    </Stack>
                )}

                {!isError && !isPending && entries.length === 0 && (
                    <Typography variant='body2' color='text.secondary'>
                        {globalize.translate('NoWatchHistory')}
                    </Typography>
                )}

                {!isError && entries.length > 0 && (
                    <List disablePadding sx={{ '& .MuiListItem-root:last-child': { borderBottom: 0 } }}>
                        {entries.map(entry => (
                            <HistoryRow key={`${entry.ItemId}-${entry.Date}`} entry={entry} />
                        ))}
                    </List>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit'>
                    {globalize.translate('ButtonClose')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FamilyHistoryDialog;
