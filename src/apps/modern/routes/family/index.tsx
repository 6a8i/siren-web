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
import FamilySessions from 'apps/modern/features/family/components/FamilySessions';
import ProfileGrid from 'apps/modern/features/family/components/ProfileGrid';
import confirm from 'components/confirm/confirm';
import { getApiErrorMessage } from 'components/family/apiError';
import AvatarPresetDialog from 'components/family/AvatarPresetDialog';
import FamilyMemberDialog, { type FamilyMemberFormValues } from 'components/family/FamilyMemberDialog';
import FamilyNameDialog, { type FamilyNameFormValues } from 'components/family/FamilyNameDialog';
import FamilyPinDialog from 'components/family/FamilyPinDialog';
import ProfilePinPrompt from 'components/family/ProfilePinPrompt';
import { useLockoutClock } from 'components/family/useLockoutClock';
import loading from 'components/loading/loading';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useFamilyLibraries } from 'hooks/api/family/useFamilyLibraries';
import { useFamilyMembers } from 'hooks/api/family/useFamilyMembers';
import {
    useCreateFamilyMember,
    useDeleteFamilyMemberImage,
    useRemoveFamilyMember,
    useSetFamilyMemberImage,
    useSetFamilyMemberPassword,
    useUnlockFamilyMember,
    useUpdateFamily,
    useUpdateFamilyMember
} from 'hooks/api/family/useFamilyMutations';
import { useFamilySessions } from 'hooks/api/family/useFamilySessions';
import { useMyFamily } from 'hooks/api/family/useMyFamily';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { type FamilyMemberDto, isFamilyAdministrator, toUpdateFamilyMemberRequest } from 'types/family';
import { type AvatarPreset, renderAvatarUpload } from 'utils/avatarPreset';
import { ProfileSwitchError, switchFamilyProfile } from 'utils/familySwitch';
import { isMemberLockedOut } from 'utils/lockout';
import { getLastProfileId, markProfileChosen } from 'utils/profileSelection';
import { getUserImageUrl } from 'utils/userImage';

type DialogName = 'add' | 'rename';

const DIALOG_AVATAR_WIDTH = 160;

/**
 * "Who's watching?": the profiles of the current user's family. Any member switches between them;
 * family administrators also manage them here, since they have no server dashboard.
 */
const FamilyPage = () => {
    const navigate = useNavigate();
    const [ searchParams, setSearchParams ] = useSearchParams();
    const { api, user: currentUser, __legacyApiClient__: apiClient } = useApi();
    const { data: family, isPending, isError } = useMyFamily();
    const { data: members = [], isPending: isMembersPending, refetch: refetchMembers } = useFamilyMembers(family?.Id);
    const { data: parentalRatings } = useParentalRatings();

    const isAdmin = isFamilyAdministrator(currentUser);
    const manage = isAdmin && searchParams.get('manage') === '1';

    // Every library the family reaches, by name: a family administrator may grant ones they cannot see.
    const { data: libraries = [] } = useFamilyLibraries(isAdmin ? family?.Id : undefined);
    const sessions = useFamilySessions(manage && !!family);

    const createMember = useCreateFamilyMember();
    const updateMember = useUpdateFamilyMember();
    const unlockMember = useUnlockFamilyMember();
    const setPassword = useSetFamilyMemberPassword();
    const setImage = useSetFamilyMemberImage();
    const deleteImage = useDeleteFamilyMemberImage();
    const removeMember = useRemoveFamilyMember();
    const updateFamily = useUpdateFamily();

    const serverId = apiClient?.serverId() ?? currentUser?.ServerId ?? undefined;
    const lastProfileId = useMemo(() => (serverId ? getLastProfileId(serverId) : undefined), [ serverId ]);

    // Lockouts count down on the tiles and end on their own; the refetch then confirms with the server.
    const onLockoutExpire = useCallback(() => {
        void refetchMembers();
    }, [ refetchMembers ]);
    const now = useLockoutClock(members, onLockoutExpire);

    const [ dialog, setDialog ] = useState<DialogName>();
    const [ editTarget, setEditTarget ] = useState<FamilyMemberDto>();
    const [ pinTarget, setPinTarget ] = useState<FamilyMemberDto>();
    const [ avatarTarget, setAvatarTarget ] = useState<FamilyMemberDto>();
    const [ switchTarget, setSwitchTarget ] = useState<FamilyMemberDto>();
    const [ isSwitching, setIsSwitching ] = useState(false);
    const [ switchError, setSwitchError ] = useState<string>();
    const [ errorMessage, setErrorMessage ] = useState<string>();

    const isSaving = createMember.isPending || updateMember.isPending || unlockMember.isPending
        || setPassword.isPending || setImage.isPending || deleteImage.isPending
        || removeMember.isPending || updateFamily.isPending;
    const isFull = !family || members.length >= family.MaxMembers;

    /** The fresh copy of a member picked earlier, so a lockout that ends or an image that changes shows at once. */
    const findFresh = useCallback((member?: FamilyMemberDto) => (
        member && (members.find(candidate => candidate.Id === member.Id) ?? member)
    ), [ members ]);

    const switchMember = findFresh(switchTarget);
    const isSwitchLocked = !!switchMember && isMemberLockedOut(switchMember, now);
    const editMember = findFresh(editTarget);
    const avatarMember = findFresh(avatarTarget);

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
        setAvatarTarget(undefined);
        setSwitchTarget(undefined);
        setSwitchError(undefined);
        setErrorMessage(undefined);
    }, []);

    const run = useCallback((action: () => Promise<unknown>, onDone: () => void = closeDialogs) => {
        void (async () => {
            try {
                await action();
                onDone();
            } catch (err) {
                setErrorMessage(getApiErrorMessage(err, globalize.translate('ErrorDefault')));
            }
        })();
    }, [ closeDialogs ]);

    // Switching

    /**
     * The fifth wrong PIN answers 401 and locks the profile, a locked or disabled profile answers 403
     * before the PIN is checked; the refreshed member list says which it is (a lockout shows on its own).
     */
    const reportWrongPin = useCallback(async (member: FamilyMemberDto, refused: boolean) => {
        const { data } = await refetchMembers();
        const fresh = data?.find(candidate => candidate.Id === member.Id);
        if (fresh && isMemberLockedOut(fresh)) {
            setSwitchError(undefined);
        } else if (refused) {
            setSwitchError(globalize.translate('ProfileDisabledMessage'));
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
            if (err instanceof ProfileSwitchError && (err.isWrongPin || err.isRefused)) {
                setSwitchTarget(current => current ?? member);
                reportWrongPin(member, err.isRefused).catch(() => {
                    setSwitchError(globalize.translate(err.isRefused ? 'ProfileDisabledMessage' : 'PinIncorrect'));
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

        if (isMemberLockedOut(member, now) || member.HasPin) {
            // The prompt explains the lockout (and counts it down) or asks for the PIN.
            setSwitchError(undefined);
            setSwitchTarget(member);
        } else {
            startSwitch(member, '');
        }
    }, [ currentUser?.Id, navigate, now, serverId, startSwitch ]);

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

    const onAvatar = useCallback((member: FamilyMemberDto) => {
        setErrorMessage(undefined);
        setAvatarTarget(member);
    }, []);

    /** From the edit dialog: the picker opens on top of it, and the edit form keeps its changes. */
    const onEditAvatarClick = useCallback(() => {
        if (editTarget) onAvatar(editTarget);
    }, [ editTarget, onAvatar ]);

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
        run(() => unlockMember.mutateAsync({ familyId: family.Id, userId: member.Id! }));
    }, [ family, run, unlockMember ]);

    const onPinSubmit = useCallback((pin: string | null) => {
        if (!family || !pinTarget?.Id) return;
        run(() => setPassword.mutateAsync({
            familyId: family.Id,
            userId: pinTarget.Id!,
            body: pin === null ? { ResetPassword: true } : { NewPassword: pin }
        }));
    }, [ family, pinTarget, run, setPassword ]);

    /** Closes the avatar picker only: the edit dialog it may have opened from stays. */
    const closeAvatarDialog = useCallback(() => {
        setAvatarTarget(undefined);
        setErrorMessage(undefined);
    }, []);

    const onAvatarSave = useCallback((preset: AvatarPreset) => {
        if (!family || !avatarTarget?.Id) return;
        const userId = avatarTarget.Id;
        run(async () => {
            const image = renderAvatarUpload(preset);
            await setImage.mutateAsync({ familyId: family.Id, userId, isSelf: userId === currentUser?.Id, image });
        }, closeAvatarDialog);
    }, [ avatarTarget, closeAvatarDialog, currentUser?.Id, family, run, setImage ]);

    const onAvatarRemove = useCallback(() => {
        if (!family || !avatarTarget?.Id) return;
        const userId = avatarTarget.Id;
        run(() => deleteImage.mutateAsync({ familyId: family.Id, userId, isSelf: userId === currentUser?.Id }), closeAvatarDialog);
    }, [ avatarTarget, closeAvatarDialog, currentUser?.Id, deleteImage, family, run ]);

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

                            {errorMessage && !dialog && !editTarget && !pinTarget && !avatarTarget && !switchTarget && (
                                <Alert severity='error' onClose={closeDialogs} sx={{ width: '100%' }}>{errorMessage}</Alert>
                            )}

                            <ProfileGrid
                                members={members}
                                currentUserId={currentUser?.Id}
                                lastProfileId={lastProfileId}
                                now={now}
                                manage={manage}
                                canAdd={!isFull}
                                onAdd={onAddClick}
                                onSelect={onSelect}
                                onEdit={onEdit}
                                onSetPin={onSetPin}
                                onAvatar={onAvatar}
                                onUnlock={onUnlock}
                                onRemove={onRemove}
                            />

                            {manage && isFull && (
                                <Typography variant='body2' color='text.secondary'>
                                    {globalize.translate('FamilyFull', family.MaxMembers)}
                                </Typography>
                            )}

                            {manage && (
                                <FamilySessions
                                    sessions={sessions.data}
                                    currentUserId={currentUser?.Id}
                                    isPending={sessions.isPending}
                                    isError={sessions.isError}
                                />
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
                lockedUntil={switchMember?.LockedOutUntil}
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
                imageUrl={getUserImageUrl(api, editMember?.Id, editMember?.PrimaryImageTag, DIALOG_AVATAR_WIDTH)}
                onAvatarClick={onEditAvatarClick}
                isSaving={isSaving}
                errorMessage={avatarTarget ? undefined : errorMessage}
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
