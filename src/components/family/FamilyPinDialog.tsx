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

interface FamilyPinDialogProps {
    open: boolean
    memberName?: string | null
    /** Whether the profile already has a PIN, which adds the option to remove it. */
    hasPin: boolean
    isSaving?: boolean
    errorMessage?: string
    onClose: () => void
    /** A new PIN, or null to remove the current one. */
    onSubmit: (pin: string | null) => void
}

/** Lets an administrator set, change or remove a profile's PIN without knowing the current one. */
const FamilyPinDialog: FC<FamilyPinDialogProps> = ({
    open,
    memberName,
    hasPin,
    isSaving = false,
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

    const onClearClick = useCallback(() => {
        onSubmit(null);
    }, [ onSubmit ]);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (pin) onSubmit(pin);
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
            <DialogTitle>
                {globalize.translate(hasPin ? 'ChangePin' : 'SetPin')}
                {memberName ? ` · ${memberName}` : ''}
            </DialogTitle>
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
                        helperText={globalize.translate('PinHelp')}
                        inputRef={pinRef}
                        fullWidth
                        autoComplete='new-password'
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit'>
                    {globalize.translate('ButtonCancel')}
                </Button>
                {hasPin && (
                    <Button onClick={onClearClick} color='error' disabled={isSaving}>
                        {globalize.translate('ClearPin')}
                    </Button>
                )}
                <Button type='submit' variant='contained' disabled={isSaving || !pin}>
                    {globalize.translate('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FamilyPinDialog;
