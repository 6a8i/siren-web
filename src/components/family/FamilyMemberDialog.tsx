import type { ParentalRating } from '@jellyfin/sdk/lib/generated-client';
import Face from '@mui/icons-material/Face';
import Alert from '@mui/material/Alert';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { type FC, useCallback, useEffect, useMemo, useState } from 'react';

import globalize from 'lib/globalize';
import type { FamilyMemberDto, LibraryOption } from 'types/family';

import { useFocusOnOpen } from './useFocusOnOpen';
import { useFullScreenDialog } from './useFullScreenDialog';

export type { LibraryOption } from 'types/family';

export interface FamilyMemberFormValues {
    Name: string
    /** Only read when creating a profile; an existing profile's PIN has its own dialog. */
    Password: string
    IsFamilyAdministrator: boolean
    IsDisabled: boolean
    MaxParentalRating: number | null
    /** All of the family's libraries (`HasAllFamilyFolders` on the member). */
    EnableAllFolders: boolean
    EnabledFolders: string[]
}

interface FamilyMemberDialogProps {
    open: boolean
    title: string
    /** The profile being edited; none when creating. */
    member?: FamilyMemberDto
    /** The libraries the family reaches: the only ones a profile may be granted. */
    libraries: LibraryOption[]
    parentalRatings: ParentalRating[]
    /** Editing your own profile: you cannot disable or demote yourself. */
    isSelf?: boolean
    /** The profile's current image, shown next to the avatar action when editing. */
    imageUrl?: string
    /** Opens the avatar picker (editing only); the picker stacks on top of this dialog. */
    onAvatarClick?: () => void
    isSaving?: boolean
    errorMessage?: string
    onClose: () => void
    onSubmit: (values: FamilyMemberFormValues) => void
}

const NO_LIMIT = '';
const AVATAR_PREVIEW_SIZE = 56;

/** The highest rating score still suitable for a child profile. */
const CHILD_MAX_SCORE = 10;

const toValues = (member?: FamilyMemberDto): FamilyMemberFormValues => ({
    Name: member?.Name ?? '',
    Password: '',
    IsFamilyAdministrator: !!member?.Policy?.IsFamilyAdministrator,
    IsDisabled: !!member?.Policy?.IsDisabled,
    MaxParentalRating: member?.Policy?.MaxParentalRating ?? null,
    EnableAllFolders: member ? member.HasAllFamilyFolders : true,
    EnabledFolders: member?.Policy?.EnabledFolders ?? []
});

interface RatingOption {
    score: number
    label: string
}

/** One option per score; ratings that share a score (TV-14, 14) are listed together. */
const groupRatings = (ratings: ParentalRating[]): RatingOption[] => {
    const options: RatingOption[] = [];
    for (const rating of ratings) {
        const score = rating.RatingScore?.score;
        if (score == null) continue;

        const existing = options.find(option => option.score === score);
        if (!existing) {
            options.push({ score, label: rating.Name ?? String(score) });
        } else if (rating.Name && !existing.label.split('/').includes(rating.Name)) {
            existing.label += `/${rating.Name}`;
        }
    }

    return options;
};

/** The rating a child profile starts with: the highest one at or under the child cap, else the lowest there is. */
export const getChildRating = (options: RatingOption[]): number | null => {
    if (options.length === 0) return null;

    const scores = options.map(option => option.score);
    const suitable = scores.filter(score => score <= CHILD_MAX_SCORE);
    return suitable.length > 0 ? Math.max(...suitable) : Math.min(...scores);
};

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
            sx={{ ml: 2 }}
        />
    );
};

/**
 * Creates or edits one profile of a family: name, PIN (new profiles), parental rating, library
 * access and the family administrator flag. Shared by the dashboard and the family page.
 */
const FamilyMemberDialog: FC<FamilyMemberDialogProps> = ({
    open,
    title,
    member,
    libraries,
    parentalRatings,
    isSelf = false,
    imageUrl,
    onAvatarClick,
    isSaving = false,
    errorMessage,
    onClose,
    onSubmit
}) => {
    const [ values, setValues ] = useState<FamilyMemberFormValues>(() => toValues(member));
    const [ isChild, setIsChild ] = useState(false);
    const ratingOptions = useMemo(() => groupRatings(parentalRatings), [ parentalRatings ]);
    const nameRef = useFocusOnOpen<HTMLInputElement>(open);
    const fullScreen = useFullScreenDialog();
    const isEdit = !!member;

    useEffect(() => {
        if (open) {
            setValues(toValues(member));
            setIsChild(false);
        }
    }, [ open, member ]);

    const onNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const Name = e.target.value;
        setValues(current => ({ ...current, Name }));
    }, []);

    const onPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const Password = e.target.value;
        setValues(current => ({ ...current, Password }));
    }, []);

    const onChildChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setIsChild(checked);
        const MaxParentalRating = checked ? getChildRating(ratingOptions) : null;
        setValues(current => ({ ...current, MaxParentalRating }));
    }, [ ratingOptions ]);

    const onRatingChange = useCallback((e: SelectChangeEvent) => {
        const value = e.target.value;
        setValues(current => ({ ...current, MaxParentalRating: value === NO_LIMIT ? null : Number(value) }));
    }, []);

    const onAllFoldersChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, EnableAllFolders: boolean) => {
        setValues(current => ({ ...current, EnableAllFolders }));
    }, []);

    const onLibraryToggle = useCallback((id: string, checked: boolean) => {
        setValues(current => {
            const others = current.EnabledFolders.filter(folderId => folderId !== id);
            return { ...current, EnabledFolders: checked ? [ ...others, id ] : others };
        });
    }, []);

    const onFamilyAdminChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, IsFamilyAdministrator: boolean) => {
        setValues(current => ({ ...current, IsFamilyAdministrator }));
    }, []);

    const onDisabledChange = useCallback((_: React.ChangeEvent<HTMLInputElement>, IsDisabled: boolean) => {
        setValues(current => ({ ...current, IsDisabled }));
    }, []);

    const onFormSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onSubmit({ ...values, Name: values.Name.trim() });
    }, [ onSubmit, values ]);

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            fullScreen={fullScreen}
            maxWidth='sm'
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

                    {isEdit && onAvatarClick && (
                        <Stack direction='row' spacing={2} alignItems='center'>
                            <Avatar
                                alt={member.Name ?? undefined}
                                src={imageUrl}
                                sx={{
                                    width: AVATAR_PREVIEW_SIZE,
                                    height: AVATAR_PREVIEW_SIZE,
                                    borderRadius: '28%',
                                    fontWeight: 600,
                                    bgcolor: imageUrl ? 'background.paper' : 'primary.main',
                                    color: 'primary.contrastText'
                                }}
                            />
                            <Button variant='outlined' color='inherit' startIcon={<Face />} onClick={onAvatarClick}>
                                {globalize.translate('ProfileAvatar')}
                            </Button>
                        </Stack>
                    )}

                    <TextField
                        name='Name'
                        label={globalize.translate('LabelName')}
                        value={values.Name}
                        onChange={onNameChange}
                        inputRef={nameRef}
                        required
                        fullWidth
                        autoComplete='off'
                    />

                    {!isEdit && (
                        <TextField
                            name='Password'
                            type='password'
                            label={globalize.translate('LabelPinOptional')}
                            value={values.Password}
                            onChange={onPasswordChange}
                            helperText={globalize.translate('PinHelp')}
                            fullWidth
                            autoComplete='new-password'
                        />
                    )}

                    <FormControl>
                        <FormControlLabel
                            control={<Switch checked={isChild} onChange={onChildChange} />}
                            label={globalize.translate('ChildProfile')}
                        />
                        <FormHelperText>{globalize.translate('ChildProfileHelp')}</FormHelperText>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel id='family-member-rating-label'>
                            {globalize.translate('LabelMaxParentalRating')}
                        </InputLabel>
                        <Select
                            labelId='family-member-rating-label'
                            label={globalize.translate('LabelMaxParentalRating')}
                            value={values.MaxParentalRating == null ? NO_LIMIT : String(values.MaxParentalRating)}
                            onChange={onRatingChange}
                        >
                            <MenuItem value={NO_LIMIT}>{globalize.translate('NoParentalRatingLimit')}</MenuItem>
                            {ratingOptions.map(option => (
                                <MenuItem key={option.score} value={String(option.score)}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <FormControl component='fieldset' variant='standard'>
                        <Typography variant='subtitle2' component='legend' sx={{ mb: 0.5 }}>
                            {globalize.translate('HeaderLibraryAccess')}
                        </Typography>
                        <FormGroup>
                            <FormControlLabel
                                control={<Checkbox checked={values.EnableAllFolders} onChange={onAllFoldersChange} />}
                                label={globalize.translate('AllFamilyLibraries')}
                            />
                            {!values.EnableAllFolders && libraries.map(library => (
                                library.Id ? (
                                    <LibraryCheckbox
                                        key={library.Id}
                                        id={library.Id}
                                        name={library.Name ?? ''}
                                        checked={values.EnabledFolders.includes(library.Id)}
                                        onToggle={onLibraryToggle}
                                    />
                                ) : null
                            ))}
                            {!values.EnableAllFolders && libraries.length === 0 && (
                                <FormHelperText sx={{ ml: 2 }}>{globalize.translate('NoFamilyLibraries')}</FormHelperText>
                            )}
                        </FormGroup>
                    </FormControl>

                    <FormControl>
                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={values.IsFamilyAdministrator}
                                    onChange={onFamilyAdminChange}
                                    disabled={isSelf}
                                />
                            )}
                            label={globalize.translate('FamilyAdministrator')}
                        />
                        <FormHelperText>{globalize.translate('FamilyAdministratorHelp')}</FormHelperText>
                    </FormControl>

                    {isEdit && (
                        <FormControlLabel
                            control={(
                                <Checkbox
                                    checked={values.IsDisabled}
                                    onChange={onDisabledChange}
                                    disabled={isSelf}
                                />
                            )}
                            label={globalize.translate('OptionDisableProfile')}
                        />
                    )}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color='inherit'>
                    {globalize.translate('ButtonCancel')}
                </Button>
                <Button type='submit' variant='contained' disabled={isSaving || !values.Name.trim()}>
                    {globalize.translate('Save')}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default FamilyMemberDialog;
