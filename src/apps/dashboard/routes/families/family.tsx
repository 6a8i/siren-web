import ArrowBack from '@mui/icons-material/ArrowBack';
import DeleteOutline from '@mui/icons-material/DeleteOutline';
import DriveFileRenameOutline from '@mui/icons-material/DriveFileRenameOutline';
import LinkIcon from '@mui/icons-material/Link';
import PersonAdd from '@mui/icons-material/PersonAdd';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import Toast from 'apps/dashboard/components/Toast';
import DeleteFamilyDialog from 'apps/dashboard/features/families/components/DeleteFamilyDialog';
import FamilyLibrariesCard, { type FamilyLibrariesValues } from 'apps/dashboard/features/families/components/FamilyLibrariesCard';
import FamilyMembersList from 'apps/dashboard/features/families/components/FamilyMembersList';
import LinkUserDialog from 'apps/dashboard/features/families/components/LinkUserDialog';
import { useLibraryMediaFolders } from 'apps/dashboard/features/users/api/useLibraryMediaFolders';
import { useParentalRatings } from 'apps/dashboard/features/users/api/useParentalRatings';
import confirm from 'components/confirm/confirm';
import { getApiErrorMessage } from 'components/family/apiError';
import AvatarPresetDialog from 'components/family/AvatarPresetDialog';
import FamilyMemberDialog, { type FamilyMemberFormValues } from 'components/family/FamilyMemberDialog';
import FamilyNameDialog, { type FamilyNameFormValues } from 'components/family/FamilyNameDialog';
import FamilyPinDialog from 'components/family/FamilyPinDialog';
import { useLockoutClock } from 'components/family/useLockoutClock';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useFamily } from 'hooks/api/family/useFamily';
import { useFamilyLibraries } from 'hooks/api/family/useFamilyLibraries';
import { useFamilyMembers } from 'hooks/api/family/useFamilyMembers';
import {
    useCreateFamilyMember,
    useDeleteFamily,
    useDeleteFamilyMemberImage,
    useLinkFamilyMember,
    useRemoveFamilyMember,
    useSetFamilyMemberImage,
    useSetFamilyMemberPassword,
    useUnlockFamilyMember,
    useUpdateFamily,
    useUpdateFamilyMember
} from 'hooks/api/family/useFamilyMutations';
import { useApi } from 'hooks/useApi';
import { useUsers } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import { type FamilyMemberDto, getFamilyId, toUpdateFamilyMemberRequest } from 'types/family';
import { type AvatarPreset, renderAvatarUpload } from 'utils/avatarPreset';
import { getUserImageUrl } from 'utils/userImage';

type DialogName = 'add' | 'link' | 'rename' | 'delete';

const DIALOG_AVATAR_WIDTH = 160;

export const Component = () => {
    const navigate = useNavigate();
    const { familyId } = useParams();
    const { api } = useApi();
    const { data: family, isPending, isError } = useFamily(familyId);
    const { data: members = [], refetch: refetchMembers } = useFamilyMembers(familyId);
    const { data: users } = useUsers();
    const { data: mediaFolders } = useLibraryMediaFolders({ isHidden: false });
    // The server's own list of what the family reaches, so the dialog and the card never disagree.
    const { data: familyLibraries = [] } = useFamilyLibraries(familyId);
    const { data: parentalRatings } = useParentalRatings();

    const createMember = useCreateFamilyMember();
    const linkMember = useLinkFamilyMember();
    const updateMember = useUpdateFamilyMember();
    const unlockMember = useUnlockFamilyMember();
    const setPassword = useSetFamilyMemberPassword();
    const setImage = useSetFamilyMemberImage();
    const deleteImage = useDeleteFamilyMemberImage();
    const removeMember = useRemoveFamilyMember();
    const updateFamily = useUpdateFamily();
    const deleteFamily = useDeleteFamily();

    const onLockoutExpire = useCallback(() => {
        void refetchMembers();
    }, [ refetchMembers ]);
    const now = useLockoutClock(members, onLockoutExpire);

    const [ dialog, setDialog ] = useState<DialogName>();
    const [ editTarget, setEditTarget ] = useState<FamilyMemberDto>();
    const [ pinTarget, setPinTarget ] = useState<FamilyMemberDto>();
    const [ avatarTarget, setAvatarTarget ] = useState<FamilyMemberDto>();
    const [ errorMessage, setErrorMessage ] = useState<string>();
    const [ toastMessage, setToastMessage ] = useState<string>();

    const candidates = useMemo(() => (
        (users ?? []).filter(user => !getFamilyId(user) && !user.Policy?.IsAdministrator)
    ), [ users ]);

    const allLibraries = mediaFolders?.Items;
    const isFull = !family || members.length >= family.MaxMembers;
    const isSaving = createMember.isPending || linkMember.isPending || updateMember.isPending || unlockMember.isPending
        || setPassword.isPending || setImage.isPending || deleteImage.isPending || removeMember.isPending
        || updateFamily.isPending || deleteFamily.isPending;

    /** The fresh copy of a member picked earlier, so an image that changes shows at once. */
    const findFresh = useCallback((member?: FamilyMemberDto) => (
        member && (members.find(candidate => candidate.Id === member.Id) ?? member)
    ), [ members ]);

    const editMember = findFresh(editTarget);
    const avatarMember = findFresh(avatarTarget);

    const closeDialogs = useCallback(() => {
        setDialog(undefined);
        setEditTarget(undefined);
        setPinTarget(undefined);
        setAvatarTarget(undefined);
        setErrorMessage(undefined);
    }, []);

    /** Closes the avatar picker only: the edit dialog it may have opened from stays. */
    const closeAvatarDialog = useCallback(() => {
        setAvatarTarget(undefined);
        setErrorMessage(undefined);
    }, []);

    /** Runs one change; a failure stays visible in whatever dialog is open, or on the page. */
    const run = useCallback((action: () => Promise<unknown>, successMessage?: string, onDone: () => void = closeDialogs) => {
        void (async () => {
            try {
                await action();
                onDone();
                if (successMessage) setToastMessage(successMessage);
            } catch (err) {
                setErrorMessage(getApiErrorMessage(err, globalize.translate('ErrorDefault')));
            }
        })();
    }, [ closeDialogs ]);

    const onAddClick = useCallback(() => {
        setErrorMessage(undefined);
        setDialog('add');
    }, []);

    const onLinkClick = useCallback(() => {
        setErrorMessage(undefined);
        setDialog('link');
    }, []);

    const onRenameClick = useCallback(() => {
        setErrorMessage(undefined);
        setDialog('rename');
    }, []);

    const onDeleteClick = useCallback(() => {
        setErrorMessage(undefined);
        setDialog('delete');
    }, []);

    const onToastClose = useCallback(() => {
        setToastMessage(undefined);
    }, []);

    const onAddSubmit = useCallback((values: FamilyMemberFormValues) => {
        if (!familyId) return;
        run(() => createMember.mutateAsync({
            familyId,
            body: {
                Name: values.Name,
                Password: values.Password || undefined,
                IsFamilyAdministrator: values.IsFamilyAdministrator,
                MaxParentalRating: values.MaxParentalRating,
                EnableAllFolders: values.EnableAllFolders,
                EnabledFolders: values.EnabledFolders
            }
        }), globalize.translate('SettingsSaved'));
    }, [ createMember, familyId, run ]);

    const onEditSubmit = useCallback((values: FamilyMemberFormValues) => {
        if (!familyId || !editTarget?.Id) return;
        run(() => updateMember.mutateAsync({
            familyId,
            userId: editTarget.Id!,
            body: {
                ...toUpdateFamilyMemberRequest(editTarget),
                Name: values.Name,
                IsFamilyAdministrator: values.IsFamilyAdministrator,
                IsDisabled: values.IsDisabled,
                MaxParentalRating: values.MaxParentalRating,
                EnableAllFolders: values.EnableAllFolders,
                EnabledFolders: values.EnabledFolders
            }
        }), globalize.translate('SettingsSaved'));
    }, [ editTarget, familyId, run, updateMember ]);

    const onLinkSubmit = useCallback((userId: string) => {
        if (!familyId) return;
        run(() => linkMember.mutateAsync({ familyId, userId }), globalize.translate('SettingsSaved'));
    }, [ familyId, linkMember, run ]);

    const onRenameSubmit = useCallback(({ Name }: FamilyNameFormValues) => {
        if (!familyId) return;
        run(() => updateFamily.mutateAsync({ familyId, body: { Name } }), globalize.translate('SettingsSaved'));
    }, [ familyId, run, updateFamily ]);

    const onLibrariesSave = useCallback((values: FamilyLibrariesValues) => {
        if (!familyId) return;
        run(() => updateFamily.mutateAsync({ familyId, body: values }), globalize.translate('SettingsSaved'));
    }, [ familyId, run, updateFamily ]);

    const onDeleteConfirm = useCallback((deleteMembers: boolean) => {
        if (!familyId) return;
        run(async () => {
            await deleteFamily.mutateAsync({ familyId, deleteMembers });
            navigate('/dashboard/families');
        });
    }, [ deleteFamily, familyId, navigate, run ]);

    const onEdit = useCallback((member: FamilyMemberDto) => {
        setErrorMessage(undefined);
        setEditTarget(member);
    }, []);

    const onSetPin = useCallback((member: FamilyMemberDto) => {
        setErrorMessage(undefined);
        setPinTarget(member);
    }, []);

    const onAvatar = useCallback((member: FamilyMemberDto) => {
        setErrorMessage(undefined);
        setAvatarTarget(member);
    }, []);

    /** From the edit dialog: the picker opens on top of it, and the edit form keeps its changes. */
    const onEditAvatarClick = useCallback(() => {
        if (editTarget) onAvatar(editTarget);
    }, [ editTarget, onAvatar ]);

    const onPinSubmit = useCallback((pin: string | null) => {
        if (!familyId || !pinTarget?.Id) return;
        run(() => setPassword.mutateAsync({
            familyId,
            userId: pinTarget.Id!,
            body: pin === null ? { ResetPassword: true } : { NewPassword: pin }
        }), globalize.translate('SettingsSaved'));
    }, [ familyId, pinTarget, run, setPassword ]);

    const onAvatarSave = useCallback((preset: AvatarPreset) => {
        if (!familyId || !avatarTarget?.Id) return;
        const userId = avatarTarget.Id;
        run(async () => {
            const image = renderAvatarUpload(preset);
            await setImage.mutateAsync({ familyId, userId, image });
        }, globalize.translate('AvatarSaved'), closeAvatarDialog);
    }, [ avatarTarget, closeAvatarDialog, familyId, run, setImage ]);

    const onAvatarRemove = useCallback(() => {
        if (!familyId || !avatarTarget?.Id) return;
        const userId = avatarTarget.Id;
        run(() => deleteImage.mutateAsync({ familyId, userId }), globalize.translate('AvatarRemoved'), closeAvatarDialog);
    }, [ avatarTarget, closeAvatarDialog, deleteImage, familyId, run ]);

    const onUnlock = useCallback((member: FamilyMemberDto) => {
        if (!familyId || !member.Id) return;
        run(() => unlockMember.mutateAsync({ familyId, userId: member.Id! }), globalize.translate('ProfileUnlocked'));
    }, [ familyId, run, unlockMember ]);

    const onToggleFamilyAdmin = useCallback((member: FamilyMemberDto) => {
        if (!familyId || !member.Id) return;
        run(() => updateMember.mutateAsync({
            familyId,
            userId: member.Id!,
            body: {
                ...toUpdateFamilyMemberRequest(member),
                IsFamilyAdministrator: !member.Policy?.IsFamilyAdministrator
            }
        }));
    }, [ familyId, run, updateMember ]);

    const onUnlink = useCallback((member: FamilyMemberDto) => {
        if (!familyId || !member.Id) return;
        const userId = member.Id;
        confirm({
            title: globalize.translate('UnlinkFromFamily'),
            text: globalize.translate('UnlinkFromFamilyConfirmation', member.Name ?? ''),
            confirmText: globalize.translate('UnlinkFromFamily')
        }).then(() => {
            run(() => removeMember.mutateAsync({ familyId, userId, deleteUser: false }));
        }).catch(() => {
            // cancelled
        });
    }, [ familyId, removeMember, run ]);

    const onRemove = useCallback((member: FamilyMemberDto) => {
        if (!familyId || !member.Id) return;
        const userId = member.Id;
        confirm({
            title: globalize.translate('RemoveProfile'),
            text: globalize.translate('RemoveProfileConfirmation', member.Name ?? ''),
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        }).then(() => {
            run(() => removeMember.mutateAsync({ familyId, userId, deleteUser: true }));
        }).catch(() => {
            // cancelled
        });
    }, [ familyId, removeMember, run ]);

    if (isPending) return <Loading />;

    return (
        <Page
            id='familyPage'
            className='mainAnimatedPage type-interior'
            title={family?.Name ?? globalize.translate('Family')}
        >
            <Box className='content-primary'>
                {isError || !family ? (
                    <Alert severity='error'>{globalize.translate('FamilyLoadError')}</Alert>
                ) : (
                    <Stack spacing={3} sx={{ minWidth: 0 }}>
                        <Box>
                            <Button
                                component={Link}
                                to='/dashboard/families'
                                startIcon={<ArrowBack />}
                                color='inherit'
                                size='small'
                                sx={{ color: 'text.secondary', ml: -1 }}
                            >
                                {globalize.translate('Families')}
                            </Button>
                            <Stack direction='row' spacing={1} alignItems='center' flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                                <Typography variant='h1' sx={{ mr: 0.5, minWidth: 0, wordBreak: 'break-word' }}>{family.Name}</Typography>
                                <IconButton size='small' aria-label={globalize.translate('ButtonRename')} onClick={onRenameClick}>
                                    <DriveFileRenameOutline fontSize='small' />
                                </IconButton>
                                <Chip
                                    size='small'
                                    color={isFull ? 'warning' : 'default'}
                                    label={globalize.translate('FamilyProfileCount', members.length, family.MaxMembers)}
                                />
                            </Stack>
                        </Box>

                        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                            <Button variant='contained' startIcon={<PersonAdd />} onClick={onAddClick} disabled={isFull}>
                                {globalize.translate('AddFamilyProfile')}
                            </Button>
                            <Button variant='outlined' startIcon={<LinkIcon />} onClick={onLinkClick} disabled={isFull}>
                                {globalize.translate('LinkExistingUser')}
                            </Button>
                        </Stack>

                        {isFull && (
                            <Alert severity='info'>{globalize.translate('FamilyFull', family.MaxMembers)}</Alert>
                        )}

                        {errorMessage && !dialog && !editTarget && !pinTarget && !avatarTarget && (
                            <Alert severity='error' onClose={closeDialogs}>{errorMessage}</Alert>
                        )}

                        <FamilyMembersList
                            members={members}
                            now={now}
                            onEdit={onEdit}
                            onSetPin={onSetPin}
                            onAvatar={onAvatar}
                            onUnlock={onUnlock}
                            onToggleFamilyAdmin={onToggleFamilyAdmin}
                            onUnlink={onUnlink}
                            onRemove={onRemove}
                        />

                        <FamilyLibrariesCard
                            family={family}
                            libraries={allLibraries ?? []}
                            isSaving={isSaving}
                            onSave={onLibrariesSave}
                        />

                        <Paper variant='outlined' sx={{ borderRadius: 3, p: 2, borderColor: 'error.main' }}>
                            <Typography variant='h3' component='h2' sx={{ fontSize: '1rem' }}>
                                {globalize.translate('DangerZone')}
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ my: 1 }}>
                                {globalize.translate('DeleteFamilyHelp')}
                            </Typography>
                            <Button color='error' variant='outlined' startIcon={<DeleteOutline />} onClick={onDeleteClick}>
                                {globalize.translate('DeleteFamily')}
                            </Button>
                        </Paper>
                    </Stack>
                )}
            </Box>

            <FamilyMemberDialog
                open={dialog === 'add'}
                title={globalize.translate('AddFamilyProfile')}
                libraries={familyLibraries}
                parentalRatings={parentalRatings ?? []}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onAddSubmit}
            />
            <FamilyMemberDialog
                open={!!editTarget}
                title={globalize.translate('EditFamilyProfile')}
                member={editTarget}
                libraries={familyLibraries}
                parentalRatings={parentalRatings ?? []}
                imageUrl={getUserImageUrl(api, editMember?.Id, editMember?.PrimaryImageTag, DIALOG_AVATAR_WIDTH)}
                onAvatarClick={onEditAvatarClick}
                isSaving={isSaving}
                errorMessage={avatarTarget ? undefined : errorMessage}
                onClose={closeDialogs}
                onSubmit={onEditSubmit}
            />
            <LinkUserDialog
                open={dialog === 'link'}
                candidates={candidates}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onLinkSubmit}
            />
            <FamilyNameDialog
                open={dialog === 'rename'}
                title={globalize.translate('RenameFamily')}
                initialName={family?.Name}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onRenameSubmit}
            />
            <DeleteFamilyDialog
                open={dialog === 'delete'}
                family={family}
                isDeleting={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onConfirm={onDeleteConfirm}
            />
            <FamilyPinDialog
                open={!!pinTarget}
                memberName={pinTarget?.Name}
                hasPin={!!pinTarget?.HasPin}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onPinSubmit}
            />
            <AvatarPresetDialog
                open={!!avatarTarget}
                memberName={avatarTarget?.Name}
                hasImage={!!avatarMember?.PrimaryImageTag}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeAvatarDialog}
                onSave={onAvatarSave}
                onRemove={onAvatarRemove}
            />
            <Toast
                open={!!toastMessage}
                onClose={onToastClose}
                message={toastMessage}
            />
        </Page>
    );
};

Component.displayName = 'FamilyPage';
