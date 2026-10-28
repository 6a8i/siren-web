import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';

import { useFocusOnOpen } from './useFocusOnOpen';

interface ProfilePinPromptProps {
    open: boolean
    memberName?: string | null
    isBusy?: boolean
    errorMessage?: string
    onClose: () => void
    onSubmit: (pin: string) => void
}

/** Asks for a profile's PIN before switching to it. */
const ProfilePinPrompt: FC<ProfilePinPromptProps> = ({
    open,
    memberName,
    isBusy = false,
    errorMessage,
    onClose,
    onSubmit
}) => {
    const [ pin, setPin ] = useState('');
    const pinRef = useFocusOnOpen<HTMLInputElement>(open);

    useEffect(() => {
        if (open) setPin('');
    }, [ open ]);

    const onPinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPin(e.target.value);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit(pin);
    }, [ onSubmit, pin ]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth='xs'
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit: onFormSubmit
                }
            }}
        >
            <DialogTitle>{globalize.translate('EnterPin', memberName ?? '')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {errorMessage && (
                        <Alert severity='error'>{errorMessage}</Alert>
                    )}
                    <TextField
                        name='Pin'
                        type='password'
                        label={globalize.translate('LabelPin')}
                        value={pin}
                        onChange={onPinChange}
                        error={!!errorMessage}
                        inputRef={pinRef}
                        fullWidth
                        autoComplete='current-password'
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isBusy}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' variant='contained' disabled={isBusy}>
                    {globalize.translate('SwitchProfile')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProfilePinPrompt;
