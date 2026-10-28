import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';
import type { SirenUserDto } from 'types/family';

interface LinkUserDialogProps {
    open: boolean
    /** Users that may join a family: no family yet and not a server administrator. */
    candidates: SirenUserDto[]
    isSaving?: boolean
    errorMessage?: string
    onClose: () => void
    onSubmit: (userId: string) => void
}

/** Moves an existing user into the family. */
const LinkUserDialog: FC<LinkUserDialogProps> = ({
    open,
    candidates,
    isSaving = false,
    errorMessage,
    onClose,
    onSubmit
}) => {
    const [ userId, setUserId ] = useState('');

    useEffect(() => {
        if (open) setUserId('');
    }, [ open ]);

    const onUserChange = useCallback((e: SelectChangeEvent) => {
        setUserId(e.target.value);
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (userId) onSubmit(userId);
    }, [ onSubmit, userId ]);

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
            <DialogTitle>{globalize.translate('LinkExistingUser')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2} sx={{ pt: 1 }}>
                    {errorMessage && (
                        <Alert severity='error'>{errorMessage}</Alert>
                    )}
                    <DialogContentText>
                        {globalize.translate(candidates.length > 0 ? 'LinkExistingUserHelp' : 'NoUsersToLink')}
                    </DialogContentText>
                    {candidates.length > 0 && (
                        <FormControl fullWidth>
                            <InputLabel id='link-user-label'>{globalize.translate('HeaderUser')}</InputLabel>
                            <Select
                                labelId='link-user-label'
                                label={globalize.translate('HeaderUser')}
                                value={userId}
                                onChange={onUserChange}
                            >
                                {candidates.map(candidate => (
                                    <MenuItem key={candidate.Id} value={candidate.Id}>
                                        {candidate.Name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit'>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' variant='contained' disabled={isSaving || !userId}>
                    {globalize.translate('LinkUser')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default LinkUserDialog;
