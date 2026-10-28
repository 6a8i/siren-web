import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Stack from '@mui/material/Stack';
import React, { type FC, useCallback, useEffect, useState } from 'react';

import globalize from 'lib/globalize';
import type { FamilyDto } from 'types/family';

interface DeleteFamilyDialogProps {
    open: boolean
    family?: FamilyDto
    isDeleting?: boolean
    errorMessage?: string
    onClose: () => void
    onConfirm: (deleteMembers: boolean) => void
}

const KEEP = 'keep';
const DELETE = 'delete';

/** Deletes a family, keeping its profiles as loose users or deleting them too. */
const DeleteFamilyDialog: FC<DeleteFamilyDialogProps> = ({
    open,
    family,
    isDeleting = false,
    errorMessage,
    onClose,
    onConfirm
}) => {
    const [ mode, setMode ] = useState(KEEP);

    useEffect(() => {
        if (open) setMode(KEEP);
    }, [ open ]);

    const onModeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setMode(e.target.value);
    }, []);

    const onConfirmClick = useCallback(() => {
        onConfirm(mode === DELETE);
    }, [ mode, onConfirm ]);

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
            <DialogTitle>{globalize.translate('DeleteFamily')}</DialogTitle>
            <DialogContent>
                <Stack spacing={2}>
                    {errorMessage && (
                        <Alert severity='error'>{errorMessage}</Alert>
                    )}
                    <DialogContentText>
                        {globalize.translate('DeleteFamilyConfirmation', family?.Name ?? '')}
                    </DialogContentText>
                    <RadioGroup value={mode} onChange={onModeChange}>
                        <FormControlLabel
                            value={KEEP}
                            control={<Radio />}
                            label={globalize.translate('DeleteFamilyKeepProfiles')}
                        />
                        <FormControlLabel
                            value={DELETE}
                            control={<Radio color='error' />}
                            label={globalize.translate('DeleteFamilyWithProfiles')}
                        />
                    </RadioGroup>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit'>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button onClick={onConfirmClick} variant='contained' color='error' disabled={isDeleting}>
                    {globalize.translate('Delete')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteFamilyDialog;
