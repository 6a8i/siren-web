import Diversity3 from '@mui/icons-material/Diversity3';
import DriveFileRenameOutline from '@mui/icons-material/DriveFileRenameOutline';
import ManageAccounts from '@mui/icons-material/ManageAccounts';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { useParentalRatings } from 'apps/dashboard/features/users/api/useParentalRatings';
import ProfileGrid from 'apps/modern/features/family/components/ProfileGrid';
import confirm from 'components/confirm/confirm';
import { getApiErrorMessage } from 'components/family/apiError';
import FamilyMemberDialog, { type FamilyMemberFormValues } from 'components/family/FamilyMemberDialog';
import FamilyNameDialog, { type FamilyNameFormValues } from 'components/family/FamilyNameDialog';
import FamilyPinDialog from 'components/family/FamilyPinDialog';
import ProfilePinPrompt from 'components/family/ProfilePinPrompt';
import loading from 'components/loading/loading';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useFamilyMembers } from 'hooks/api/family/useFamilyMembers';
import {
    useCreateFamilyMember,
    useRemoveFamilyMember,
    useSetFamilyMemberPassword,
    useUpdateFamily,
    useUpdateFamilyMember
} from 'hooks/api/family/useFamilyMutations';
import { useMyFamily } from 'hooks/api/family/useMyFamily';
import { useUserViews } from 'hooks/api/useUserViews';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { type FamilyMemberDto, getFamilyLibraries, isFamilyAdministrator, toUpdateFamilyMemberRequest } from 'types/family';
import { ProfileSwitchError, switchFamilyProfile } from 'utils/familySwitch';
import { getLastProfileId, markProfileChosen } from 'utils/profileSelection';

type DialogName = 'add' | 'rename';

/**
 * "Who's watching?": the profiles of the current user's family. Any member switches between them;
 * family administrators also manage them here, since they have no server dashboard.
 */
const FamilyPage = () => {
    const navigate = useNavigate();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { user: currentUser, __legacyApiClient__: apiClient } = useApi();
    const { data: family, isPending, isError } = useMyFamily();
    const { data: members = [], isPending: isMembersPending, refetch: refetchMembers } = useFamilyMembers(family?.Id);
    const { data: parentalRatings } = useParentalRatings();
    // Family administrators have no dashboard: the libraries they can name are the ones they see themselves.
    const { data: views } = useUserViews();

    const createMember = useCreateFamilyMember();
    const updateMember = useUpdateFamilyMember();
    const setPassword = useSetFamilyMemberPassword();
    const removeMember = useRemoveFamilyMember();
    const updateFamily = useUpdateFamily();

    const serverId = apiClient?.serverId() ?? currentUser?.ServerId ?? undefined;
    const lastProfileId = useMemo(() => (serverId ? getLastProfileId(serverId) : undefined), [ serverId ]);
    const ownViews = views?.Items;
    const libraries = useMemo(() => getFamilyLibraries(family, ownViews ?? []), [ family, ownViews ]);
    const isAdmin = isFamilyAdministrator(currentUser);
    const manage = isAdmin && searchParams.get('manage') === '1';

    const [ dialog, setDialog ] = useState<DialogName>();
    const [ editTarget, setEditTarget ] = useState<FamilyMemberDto>();
    const [ pinTarget, setPinTarget ] = useState<FamilyMemberDto>();
    const [ switchTarget, setSwitchTarget ] = useState<FamilyMemberDto>();
    const [ isSwitching, setIsSwitching ] = useState(false);
    const [ isSwitchLocked, setIsSwitchLocked ] = useState(false);
    const [ switchError, setSwitchError ] = useState<string>();
    const [ errorMessage, setErrorMessage ] = useState<string>();

    const isSaving = createMember.isPending || updateMember.isPending || setPassword.isPending
        || removeMember.isPending || updateFamily.isPending;
    const isFull = !family || members.length >= family.MaxMembers;

    const setManage = useCallback((value: boolean) => {
        setSearchParams(value ? { manage: '1' } : {}, { replace: true });
    }, [ setSearchParams ]);

    const onManageClick = useCallback(() => {
        setManage(true);
    }, [ setManage ]);

    const onDoneClick = useCallback(() => {
        setManage(false);
    }, [ setManage ]);

    const closeDialogs = useCallback(() => {
        setDialog(undefined);
        setEditTarget(undefined);
        setPinTarget(undefined);
        setSwitchTarget(undefined);
        setIsSwitchLocked(false);
        setSwitchError(undefined);
        setErrorMessage(undefined);
    }, []);

    const run = useCallback((action: () => Promise<unknown>) => {
        void (async () => {
            try {
                await action();
                closeDialogs();
            } catch (err) {
                setErrorMessage(getApiErrorMessage(err, globalize.translate('ErrorDefault')));
            }
        })();
    }, [ closeDialogs ]);

    // Switching

    /** A wrong PIN and a locked profile both answer 401; the member list says which it is. */
    const reportWrongPin = useCallback(async (member: FamilyMemberDto) => {
        const { data } = await refetchMembers();
        const fresh = data?.find(candidate => candidate.Id === member.Id);
        if (fresh?.IsLockedOut) {
            setIsSwitchLocked(true);
            setSwitchError(undefined);
        } else {
            setSwitchError(globalize.translate('PinIncorrect'));
        }
    }, [ refetchMembers ]);

    const startSwitch = useCallback((member: FamilyMemberDto, pin: string) => {
        if (!family || !member.Id) return;

        setIsSwitching(true);
        setSwitchError(undefined);
        loading.show();
        switchFamilyProfile(family.Id, member.Id, pin).catch((err: unknown) => {
            loading.hide();
            setIsSwitching(false);
            if (err instanceof ProfileSwitchError && err.isWrongPin) {
                setSwitchTarget(current => current ?? member);
                reportWrongPin(member).catch(() => {
                    setSwitchError(globalize.translate('PinIncorrect'));
                });
            } else {
                console.error('[FamilyPage] profile switch failed', err);
                setSwitchError(globalize.translate('ErrorDefault'));
                if (!member.HasPin) setErrorMessage(globalize.translate('ErrorDefault'));
            }
        });
    }, [ family, reportWrongPin ]);

    const onSelect = useCallback((member: FamilyMemberDto) => {
        if (member.Id === currentUser?.Id) {
            // "Continue as" the current profile is a choice too: no selector again this session.
            if (serverId && member.Id) markProfileChosen(serverId, member.Id);
            navigate('/home');
            return;
        }

        if (member.IsLockedOut) {
            setSwitchError(undefined);
            setIsSwitchLocked(true);
            setSwitchTarget(member);
        } else if (member.HasPin) {
            setSwitchError(undefined);
            setIsSwitchLocked(false);
            setSwitchTarget(member);
        } else {
            startSwitch(member, '');
        }
    }, [ currentUser?.Id, navigate, serverId, startSwitch ]);

    const onPinPromptSubmit = useCallback((pin: string) => {
        if (switchTarget) startSwitch(switchTarget, pin);
    }, [ startSwitch, switchTarget ]);

    // Managing

    const onAddClick = useCallback(() => {
        setErrorMessage(undefined);
        setDialog('add');
    }, []);

    const onRenameClick = useCallback(() => {
        setErrorMessage(undefined);
        setDialog('rename');
    }, []);

    const onEdit = useCallback((member: FamilyMemberDto) => {
        setErrorMessage(undefined);
        setEditTarget(member);
    }, []);

    const onSetPin = useCallback((member: FamilyMemberDto) => {
        setErrorMessage(undefined);
        setPinTarget(member);
    }, []);

    const onAddSubmit = useCallback((values: FamilyMemberFormValues) => {
        if (!family) return;
        run(() => createMember.mutateAsync({
            familyId: family.Id,
            body: {
                Name: values.Name,
                Password: values.Password || undefined,
                IsFamilyAdministrator: values.IsFamilyAdministrator,
                MaxParentalRating: values.MaxParentalRating,
                EnableAllFolders: values.EnableAllFolders,
                EnabledFolders: values.EnabledFolders
            }
        }));
    }, [ createMember, family, run ]);

    const onEditSubmit = useCallback((values: FamilyMemberFormValues) => {
        if (!family || !editTarget?.Id) return;
        run(() => updateMember.mutateAsync({
            familyId: family.Id,
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
        }));
    }, [ editTarget, family, run, updateMember ]);

    const onUnlock = useCallback((member: FamilyMemberDto) => {
        if (!family || !member.Id) return;
        run(() => updateMember.mutateAsync({
            familyId: family.Id,
            userId: member.Id!,
            body: {
                ...toUpdateFamilyMemberRequest(member),
                IsDisabled: false
            }
        }));
    }, [ family, run, updateMember ]);

    const onPinSubmit = useCallback((pin: string | null) => {
        if (!family || !pinTarget?.Id) return;
        run(() => setPassword.mutateAsync({
            familyId: family.Id,
            userId: pinTarget.Id!,
            body: pin === null ? { ResetPassword: true } : { NewPassword: pin }
        }));
    }, [ family, pinTarget, run, setPassword ]);

    const onRenameSubmit = useCallback(({ Name }: FamilyNameFormValues) => {
        if (!family) return;
        run(() => updateFamily.mutateAsync({ familyId: family.Id, body: { Name } }));
    }, [ family, run, updateFamily ]);

    const onRemove = useCallback((member: FamilyMemberDto) => {
        if (!family || !member.Id) return;
        const familyId = family.Id;
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
    }, [ family, removeMember, run ]);

    if (isPending || (family && isMembersPending)) return <Loading />;

    return (
        <Page
            id='familyPage'
            className='libraryPage userPreferencesPage noSecondaryNavPage mainAnimatedPage'
            title={globalize.translate('MyFamily')}
        >
            <div className='padded-left padded-right padded-bottom-page padded-top'>
                <Stack spacing={4} alignItems='center' sx={{ maxWidth: 960, mx: 'auto', pt: { xs: 2, sm: 4 }, minWidth: 0 }}>
                    {isError && (
                        <Alert severity='error'>{globalize.translate('FamilyLoadError')}</Alert>
                    )}

                    {!isError && !family && (
                        <Box sx={{ textAlign: 'center', maxWidth: 480 }}>
                            <Diversity3 sx={{ fontSize: 56, color: 'text.secondary' }} />
                            <Typography variant='h2' sx={{ mt: 1 }}>{globalize.translate('NoFamily')}</Typography>
                            <Typography color='text.secondary' sx={{ mt: 1 }}>
                                {globalize.translate('NoFamilyHelp')}
                            </Typography>
                        </Box>
                    )}

                    {family && (
                        <>
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant='h1' sx={{ fontSize: { xs: '1.6rem', sm: '2.2rem' } }}>
                                    {globalize.translate(manage ? 'ManageProfiles' : 'WhoIsWatching')}
                                </Typography>
                                <Stack direction='row' spacing={0.5} alignItems='center' justifyContent='center' flexWrap='wrap' useFlexGap sx={{ mt: 1 }}>
                                    <Typography color='text.secondary' sx={{ wordBreak: 'break-word' }}>{family.Name}</Typography>
                                    {manage && (
                                        <Button
                                            size='small'
                                            color='inherit'
                                            startIcon={<DriveFileRenameOutline fontSize='small' />}
                                            onClick={onRenameClick}
                                            sx={{ color: 'text.secondary' }}
                                        >
                                            {globalize.translate('ButtonRename')}
                                        </Button>
                                    )}
                                </Stack>
                            </Box>

                            {errorMessage && !dialog && !editTarget && !pinTarget && !switchTarget && (
                                <Alert severity='error' onClose={closeDialogs} sx={{ width: '100%' }}>{errorMessage}</Alert>
                            )}

                            <ProfileGrid
                                members={members}
                                currentUserId={currentUser?.Id}
                                lastProfileId={lastProfileId}
                                manage={manage}
                                canAdd={!isFull}
                                onAdd={onAddClick}
                                onSelect={onSelect}
                                onEdit={onEdit}
                                onSetPin={onSetPin}
                                onUnlock={onUnlock}
                                onRemove={onRemove}
                            />

                            {manage && isFull && (
                                <Typography variant='body2' color='text.secondary'>
                                    {globalize.translate('FamilyFull', family.MaxMembers)}
                                </Typography>
                            )}

                            {isAdmin && (
                                manage ? (
                                    <Button variant='contained' onClick={onDoneClick} disabled={isSwitching}>
                                        {globalize.translate('DoneManaging')}
                                    </Button>
                                ) : (
                                    <Button variant='outlined' startIcon={<ManageAccounts />} onClick={onManageClick} disabled={isSwitching}>
                                        {globalize.translate('ManageProfiles')}
                                    </Button>
                                )
                            )}
                        </>
                    )}
                </Stack>
            </div>

            <ProfilePinPrompt
                open={!!switchTarget}
                memberName={switchTarget?.Name}
                isLocked={isSwitchLocked}
                isBusy={isSwitching}
                errorMessage={switchError}
                onClose={closeDialogs}
                onSubmit={onPinPromptSubmit}
            />
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
            <FamilyMemberDialog
                open={!!editTarget}
                title={globalize.translate('EditFamilyProfile')}
                member={editTarget}
                libraries={libraries}
                parentalRatings={parentalRatings ?? []}
                isSelf={!!editTarget && editTarget.Id === currentUser?.Id}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onEditSubmit}
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
            <FamilyNameDialog
                open={dialog === 'rename'}
                title={globalize.translate('RenameFamily')}
                initialName={family?.Name}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onRenameSubmit}
            />
        </Page>
    );
};

export default FamilyPage;
