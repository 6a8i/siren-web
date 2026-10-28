import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import { useFamilyAdminPin } from 'hooks/api/family/useFamilyAdminPin';
import globalize from 'lib/globalize';

import { useFocusOnOpen } from './useFocusOnOpen';
import { useFullScreenDialog } from './useFullScreenDialog';

interface FamilyAdminPinDialogProps {
    open: boolean
    /** Why the PIN is asked, under the title. */
    description?: string
    onClose: () => void
    /** The PIN was right: the caller goes on with what it wanted to do. */
    onVerified: () => void
}

/**
 * "Family administrator's PIN": a child profile picks one of the family's administrators and
 * types their PIN before signing out or opening the settings. The check never switches profiles.
 */
const FamilyAdminPinDialog: FC<FamilyAdminPinDialogProps> = ({ open, description, onClose, onVerified }) => {
    const { administrators, isLoading, isVerifying, errorMessage, verify, reset } = useFamilyAdminPin();
    const [ adminId, setAdminId ] = useState('');
    const [ pin, setPin ] = useState('');
    const pinRef = useFocusOnOpen<HTMLInputElement>(open);
    const fullScreen = useFullScreenDialog();

    useEffect(() => {
        if (open) {
            setPin('');
            reset();
        }
    }, [ open, reset ]);

    // The first administrator is picked for the common one-parent family; the list stays for the others.
    useEffect(() => {
        if (administrators.length > 0 && !administrators.some(admin => admin.Id === adminId)) {
            setAdminId(administrators[0].Id ?? '');
        }
    }, [ administrators, adminId ]);

    const onAdminChange = useCallback((e: SelectChangeEvent) => {
        setAdminId(e.target.value);
    }, []);

    const onPinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setPin(e.target.value);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const administrator = administrators.find(admin => admin.Id === adminId);
        if (!administrator) return;

        void verify(administrator, pin).then(ok => {
            if (ok) onVerified();
        });
    }, [ administrators, adminId, onVerified, pin, verify ]);

    const hasAdministrators = administrators.length > 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            fullScreen={fullScreen}
            maxWidth='xs'
            slotProps={{
                paper: {
                    component: 'form',
                    onSubmit: onFormSubmit
                }
            }}
        >
            <DialogTitle>{globalize.translate('FamilyAdminPin')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    <Typography variant='body2' color='text.secondary'>
                        {description ?? globalize.translate('FamilyAdminPinHelp')}
                    </Typography>

                    {errorMessage && (
                        <Alert severity='error'>{errorMessage}</Alert>
                    )}

                    {isLoading && (
                        <Skeleton variant='rounded' height={56} />
                    )}

                    {!isLoading && !hasAdministrators && (
                        <Alert severity='warning'>{globalize.translate('NoFamilyAdministrators')}</Alert>
                    )}

                    {!isLoading && hasAdministrators && (
                        <FormControl fullWidth>
                            <InputLabel id='family-admin-pin-admin-label'>
                                {globalize.translate('FamilyAdministrator')}
                            </InputLabel>
                            <Select
                                labelId='family-admin-pin-admin-label'
                                label={globalize.translate('FamilyAdministrator')}
                                value={adminId}
                                onChange={onAdminChange}
                            >
                                {administrators.map(admin => (
                                    <MenuItem key={admin.Id} value={admin.Id ?? ''}>{admin.Name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}

                    <TextField
                        name='Pin'
                        type='password'
                        label={globalize.translate('LabelPin')}
                        value={pin}
                        onChange={onPinChange}
                        error={!!errorMessage}
                        disabled={!hasAdministrators}
                        inputRef={pinRef}
                        fullWidth
                        autoComplete='current-password'
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit' disabled={isVerifying}>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' variant='contained' disabled={isVerifying || !hasAdministrators}>
                    {globalize.translate('ButtonOk')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FamilyAdminPinDialog;
