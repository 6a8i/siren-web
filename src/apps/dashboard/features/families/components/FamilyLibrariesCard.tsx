import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';

import globalize from 'lib/globalize';
import type { FamilyDto, LibraryOption } from 'types/family';

export interface FamilyLibrariesValues {
    EnableAllFolders: boolean
    EnabledFolders: string[]
}

interface FamilyLibrariesCardProps {
    family: FamilyDto
    /** Every library on the server. */
    libraries: LibraryOption[]
    isSaving?: boolean
    onSave: (values: FamilyLibrariesValues) => void
}

interface LibraryCheckboxProps {
    id: string
    name: string
    checked: boolean
    onToggle: (id: string, checked: boolean) => void
}

const LibraryCheckbox: FC<LibraryCheckboxProps> = ({ id, name, checked, onToggle }) => {
    const onChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, isChecked: boolean) => {
        onToggle(id, isChecked);
    }, [ id, onToggle ]);

    return (
        <FormControlLabel
            control={<Checkbox checked={checked} onChange={onChange} />}
            label={name}
        />
    );
};

const toValues = (family: FamilyDto): FamilyLibrariesValues => ({
    EnableAllFolders: family.EnableAllFolders,
    EnabledFolders: family.EnabledFolders
});

const sameFolders = (a: string[], b: string[]) => (
    a.length === b.length && a.every(id => b.includes(id))
);

/**
 * The libraries a family reaches (server administrators only). Its profiles can only be granted
 * libraries from this list, so narrowing it narrows every profile at once.
 */
const FamilyLibrariesCard: FC<FamilyLibrariesCardProps> = ({ family, libraries, isSaving = false, onSave }) => {
    const [ values, setValues ] = useState<FamilyLibrariesValues>(() => toValues(family));

    // A fresh family (saved here or elsewhere) resets the form; the folder list is compared by content.
    const savedFolders = family.EnabledFolders.join(',');
    useEffect(() => {
        setValues({ EnableAllFolders: family.EnableAllFolders, EnabledFolders: family.EnabledFolders });
    }, [ family.Id, family.EnableAllFolders, family.EnabledFolders, savedFolders ]);

    const isDirty = useMemo(() => (
        values.EnableAllFolders !== family.EnableAllFolders
        || (!values.EnableAllFolders && !sameFolders(values.EnabledFolders, family.EnabledFolders))
    ), [ family.EnableAllFolders, family.EnabledFolders, values ]);

    const onAllChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, EnableAllFolders: boolean) => {
        setValues(current => ({ ...current, EnableAllFolders }));
    }, []);

    const onToggle = useCallback((id: string, checked: boolean) => {
        setValues(current => {
            const others = current.EnabledFolders.filter(folderId => folderId !== id);
            return { ...current, EnabledFolders: checked ? [ ...others, id ] : others };
        });
    }, []);

    const onSaveClick = useCallback(() => {
        onSave(values.EnableAllFolders ? { EnableAllFolders: true, EnabledFolders: [] } : values);
    }, [ onSave, values ]);

    return (
        <Paper variant='outlined' sx={{ borderRadius: 3, p: 2, bgcolor: 'background.paper' }}>
            <Typography variant='h3' component='h2' sx={{ fontSize: '1rem' }}>
                {globalize.translate('FamilyLibraries')}
            </Typography>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                {globalize.translate('FamilyLibrariesHelp')}
            </Typography>

            <FormGroup sx={{ mt: 1 }}>
                <FormControlLabel
                    control={<Switch checked={values.EnableAllFolders} onChange={onAllChange} />}
                    label={globalize.translate('AllLibraries')}
                />
                {!values.EnableAllFolders && (
                    <Stack sx={{ ml: 1 }}>
                        {libraries.map(library => (
                            library.Id ? (
                                <LibraryCheckbox
                                    key={library.Id}
                                    id={library.Id}
                                    name={library.Name ?? ''}
                                    checked={values.EnabledFolders.includes(library.Id)}
                                    onToggle={onToggle}
                                />
                            ) : null
                        ))}
                        {libraries.length === 0 && (
                            <FormHelperText>{globalize.translate('NoLibrariesAvailable')}</FormHelperText>
                        )}
                    </Stack>
                )}
            </FormGroup>

            <Stack direction='row' justifyContent='flex-end' sx={{ mt: 1 }}>
                <Button variant='contained' onClick={onSaveClick} disabled={isSaving || !isDirty}>
                    {globalize.translate('Save')}
                </Button>
            </Stack>
        </Paper>
    );
};

export default FamilyLibrariesCard;
