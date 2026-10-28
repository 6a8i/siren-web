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
import FamilyMembersList from 'apps/dashboard/features/families/components/FamilyMembersList';
import LinkUserDialog from 'apps/dashboard/features/families/components/LinkUserDialog';
import { useLibraryMediaFolders } from 'apps/dashboard/features/users/api/useLibraryMediaFolders';
import { useParentalRatings } from 'apps/dashboard/features/users/api/useParentalRatings';
import confirm from 'components/confirm/confirm';
import { getApiErrorMessage } from 'components/family/apiError';
import FamilyMemberDialog, { type FamilyMemberFormValues } from 'components/family/FamilyMemberDialog';
import FamilyNameDialog, { type FamilyNameFormValues } from 'components/family/FamilyNameDialog';
import FamilyPinDialog from 'components/family/FamilyPinDialog';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useFamily } from 'hooks/api/family/useFamily';
import { useFamilyMembers } from 'hooks/api/family/useFamilyMembers';
import {
    useCreateFamilyMember,
    useDeleteFamily,
    useLinkFamilyMember,
    useRemoveFamilyMember,
    useSetFamilyMemberPassword,
    useUpdateFamily,
    useUpdateFamilyMember
} from 'hooks/api/family/useFamilyMutations';
import { useUsers } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import { getFamilyId, type SirenUserDto, toUpdateFamilyMemberRequest } from 'types/family';

type DialogName = 'add' | 'link' | 'rename' | 'delete';

export const Component = () => {
    const navigate = useNavigate();
    const { familyId } = useParams();
    const { data: family, isPending, isError } = useFamily(familyId);
    const { data: membersData } = useFamilyMembers(familyId);
    const members = membersData ?? [];
    const { data: users } = useUsers();
    const { data: mediaFolders } = useLibraryMediaFolders({ isHidden: false });
    const { data: parentalRatings } = useParentalRatings();

    const createMember = useCreateFamilyMember();
    const linkMember = useLinkFamilyMember();
    const updateMember = useUpdateFamilyMember();
    const setPassword = useSetFamilyMemberPassword();
    const removeMember = useRemoveFamilyMember();
    const updateFamily = useUpdateFamily();
    const deleteFamily = useDeleteFamily();

    const [ dialog, setDialog ] = useState<DialogName>();
    const [ pinTarget, setPinTarget ] = useState<SirenUserDto>();
    const [ errorMessage, setErrorMessage ] = useState<string>();
    const [ toastMessage, setToastMessage ] = useState<string>();

    const candidates = useMemo(() => (
        (users ?? []).filter(user => !getFamilyId(user) && !user.Policy?.IsAdministrator)
    ), [ users ]);

    const libraries = mediaFolders?.Items ?? [];
    const isFull = !family || members.length >= family.MaxMembers;
    const isSaving = createMember.isPending || linkMember.isPending || updateMember.isPending
        || setPassword.isPending || removeMember.isPending || updateFamily.isPending || deleteFamily.isPending;

    const closeDialogs = useCallback(() => {
        setDialog(undefined);
        setPinTarget(undefined);
        setErrorMessage(undefined);
    }, []);

    /** Runs one change; a failure stays visible in whatever dialog is open, or on the page. */
    const run = useCallback((action: () => Promise<unknown>, successMessage?: string) => {
        void (async () => {
            try {
                await action();
                closeDialogs();
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

    const onLinkSubmit = useCallback((userId: string) => {
        if (!familyId) return;
        run(() => linkMember.mutateAsync({ familyId, userId }), globalize.translate('SettingsSaved'));
    }, [ familyId, linkMember, run ]);

    const onRenameSubmit = useCallback(({ Name }: FamilyNameFormValues) => {
        if (!familyId) return;
        run(() => updateFamily.mutateAsync({ familyId, body: { Name } }), globalize.translate('SettingsSaved'));
    }, [ familyId, run, updateFamily ]);

    const onDeleteConfirm = useCallback((deleteMembers: boolean) => {
        if (!familyId) return;
        run(async () => {
            await deleteFamily.mutateAsync({ familyId, deleteMembers });
            navigate('/dashboard/families');
        });
    }, [ deleteFamily, familyId, navigate, run ]);

    const onEdit = useCallback((member: SirenUserDto) => {
        navigate(`/dashboard/users/${member.Id}/profile`);
    }, [ navigate ]);

    const onSetPin = useCallback((member: SirenUserDto) => {
        setErrorMessage(undefined);
        setPinTarget(member);
    }, []);

    const onPinSubmit = useCallback((pin: string | null) => {
        if (!familyId || !pinTarget?.Id) return;
        run(() => setPassword.mutateAsync({
            familyId,
            userId: pinTarget.Id!,
            body: pin === null ? { ResetPassword: true } : { NewPassword: pin }
        }), globalize.translate('SettingsSaved'));
    }, [ familyId, pinTarget, run, setPassword ]);

    const onToggleFamilyAdmin = useCallback((member: SirenUserDto) => {
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

    const onUnlink = useCallback((member: SirenUserDto) => {
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

    const onRemove = useCallback((member: SirenUserDto) => {
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
                    <Stack spacing={3}>
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
                                <Typography variant='h1' sx={{ mr: 0.5 }}>{family.Name}</Typography>
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

                        {errorMessage && !dialog && !pinTarget && (
                            <Alert severity='error' onClose={closeDialogs}>{errorMessage}</Alert>
                        )}

                        <FamilyMembersList
                            members={members}
                            onEdit={onEdit}
                            onSetPin={onSetPin}
                            onToggleFamilyAdmin={onToggleFamilyAdmin}
                            onUnlink={onUnlink}
                            onRemove={onRemove}
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
                libraries={libraries}
                parentalRatings={parentalRatings ?? []}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onAddSubmit}
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
                hasPin={!!pinTarget?.HasPassword}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onPinSubmit}
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
