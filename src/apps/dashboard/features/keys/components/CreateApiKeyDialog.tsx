import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';

export interface CreateApiKeyValues {
    app: string
    isReadOnly: boolean
}

interface CreateApiKeyDialogProps {
    open: boolean
    isSaving?: boolean
    onClose: () => void
    onConfirm: (values: CreateApiKeyValues) => void
}

/** Names the application the key is for and, optionally, restricts the key to reading. */
const CreateApiKeyDialog: FC<CreateApiKeyDialogProps> = ({ open, isSaving = false, onClose, onConfirm }) => {
    const [ app, setApp ] = useState('');
    const [ isReadOnly, setIsReadOnly ] = useState(false);

    useEffect(() => {
        if (open) {
            setApp('');
            setIsReadOnly(false);
        }
    }, [ open ]);

    const onAppChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setApp(e.target.value);
    }, []);

    const onReadOnlyChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setIsReadOnly(checked);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (app.trim()) onConfirm({ app: app.trim(), isReadOnly });
    }, [ app, isReadOnly, onConfirm ]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='xs'
            fullWidth
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit: onFormSubmit
                }
            }}
        >
            <DialogTitle>{globalize.translate('HeaderNewApiKey')}</DialogTitle>
            <DialogContent>
                <Stack spacing={1}>
                    <TextField
                        name='app'
                        label={globalize.translate('LabelAppName')}
                        value={app}
                        helperText={globalize.translate('LabelAppNameExample')}
                        onChange={onAppChange}
                        variant='standard'
                    />
                    <FormControlLabel
                        control={<Checkbox name='isReadOnly' checked={isReadOnly} onChange={onReadOnlyChange} />}
                        label={globalize.translate('LabelReadOnly')}
                    />
                    <FormHelperText sx={{ mt: 0 }}>{globalize.translate('ApiKeyReadOnlyHelp')}</FormHelperText>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isSaving}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' disabled={isSaving || !app.trim()}>
                    {globalize.translate('Create')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default CreateApiKeyDialog;
