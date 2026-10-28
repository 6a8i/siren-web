import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';

import { useFocusOnOpen } from './useFocusOnOpen';
import { useFullScreenDialog } from './useFullScreenDialog';

export interface FamilyNameFormValues {
    Name: string
    /** Only read when `withFirstProfile` is set. */
    FirstProfileName: string
    FirstProfilePin: string
}

interface FamilyNameDialogProps {
    open: boolean
    title: string
    initialName?: string
    /** Creating a family: also asks for its first profile, which becomes the family administrator. */
    withFirstProfile?: boolean
    isSaving?: boolean
    errorMessage?: string
    onClose: () => void
    onSubmit: (values: FamilyNameFormValues) => void
}

/** Names a new family (with its first profile) or renames an existing one. */
const FamilyNameDialog: FC<FamilyNameDialogProps> = ({
    open,
    title,
    initialName = '',
    withFirstProfile = false,
    isSaving = false,
    errorMessage,
    onClose,
    onSubmit
}) => {
    const [ values, setValues ] = useState<FamilyNameFormValues>({ Name: initialName, FirstProfileName: '', FirstProfilePin: '' });
    const nameRef = useFocusOnOpen<HTMLInputElement>(open);
    const fullScreen = useFullScreenDialog();

    useEffect(() => {
        if (open) setValues({ Name: initialName, FirstProfileName: '', FirstProfilePin: '' });
    }, [ open, initialName ]);

    const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const Name = e.target.value;
        setValues(current => ({ ...current, Name }));
    }, []);

    const onFirstProfileNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const FirstProfileName = e.target.value;
        setValues(current => ({ ...current, FirstProfileName }));
    }, []);

    const onFirstProfilePinChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const FirstProfilePin = e.target.value;
        setValues(current => ({ ...current, FirstProfilePin }));
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({
            ...values,
            Name: values.Name.trim(),
            FirstProfileName: values.FirstProfileName.trim()
        });
    }, [ onSubmit, values ]);

    const isValid = !!values.Name.trim() && (!withFirstProfile || !!values.FirstProfileName.trim());

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
            <DialogTitle>{title}</DialogTitle>
            <DialogContent>
                <Stack spacing={2.5} sx={{ pt: 1 }}>
                    {errorMessage && (
                        <Alert severity='error'>{errorMessage}</Alert>
                    )}
                    <TextField
                        name='Name'
                        label={globalize.translate('FamilyName')}
                        value={values.Name}
                        onChange={onNameChange}
                        inputRef={nameRef}
                        required
                        fullWidth
                        autoComplete='off'
                    />
                    {withFirstProfile && (
                        <>
                            <DialogContentText>
                                {globalize.translate('FirstProfileHelp')}
                            </DialogContentText>
                            <TextField
                                name='FirstProfileName'
                                label={globalize.translate('FirstProfileName')}
                                value={values.FirstProfileName}
                                onChange={onFirstProfileNameChange}
                                required
                                fullWidth
                                autoComplete='off'
                            />
                            <TextField
                                name='FirstProfilePin'
                                type='password'
                                label={globalize.translate('LabelPinOptional')}
                                value={values.FirstProfilePin}
                                onChange={onFirstProfilePinChange}
                                helperText={globalize.translate('PinHelp')}
                                fullWidth
                                autoComplete='new-password'
                            />
                        </>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit'>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' variant='contained' disabled={isSaving || !isValid}>
                    {globalize.translate('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FamilyNameDialog;
