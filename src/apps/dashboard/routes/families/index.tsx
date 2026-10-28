import Add from '@mui/icons-material/Add';
import Diversity3 from '@mui/icons-material/Diversity3';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Toast from 'apps/dashboard/components/Toast';
import DeleteFamilyDialog from 'apps/dashboard/features/families/components/DeleteFamilyDialog';
import FamilyCard from 'apps/dashboard/features/families/components/FamilyCard';
import { getApiErrorMessage } from 'components/family/apiError';
import FamilyNameDialog, { type FamilyNameFormValues } from 'components/family/FamilyNameDialog';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useFamilies } from 'hooks/api/family/useFamilies';
import {
    useCreateFamily,
    useCreateFamilyMember,
    useDeleteFamily,
    useUpdateFamily
} from 'hooks/api/family/useFamilyMutations';
import { useUsers } from 'hooks/useUsers';
import globalize from 'lib/globalize';
import { DEFAULT_MAX_FAMILY_MEMBERS, type FamilyDto, getFamilyId, type SirenUserDto } from 'types/family';

export const Component = () => {
    const navigate = useNavigate();
    const { data: families, isPending, isError } = useFamilies();
    const { data: users } = useUsers();
    const createFamily = useCreateFamily();
    const createMember = useCreateFamilyMember();
    const updateFamily = useUpdateFamily();
    const deleteFamily = useDeleteFamily();

    const [ isCreateOpen, setIsCreateOpen ] = useState(false);
    const [ renameTarget, setRenameTarget ] = useState<FamilyDto>();
    const [ deleteTarget, setDeleteTarget ] = useState<FamilyDto>();
    const [ errorMessage, setErrorMessage ] = useState<string>();
    const [ toastMessage, setToastMessage ] = useState<string>();
    // A family whose first profile failed to be created; a retry must not create a second family.
    const pendingFamily = useRef<FamilyDto>();

    const membersByFamily = useMemo(() => {
        const map: Record<string, SirenUserDto[]> = {};
        for (const user of users ?? []) {
            const familyId = getFamilyId(user);
            if (familyId) {
                map[familyId] ??= [];
                map[familyId].push(user);
            }
        }
        return map;
    }, [ users ]);

    const isSaving = createFamily.isPending || createMember.isPending || updateFamily.isPending || deleteFamily.isPending;

    const closeDialogs = useCallback(() => {
        setIsCreateOpen(false);
        setRenameTarget(undefined);
        setDeleteTarget(undefined);
        setErrorMessage(undefined);
    }, []);

    const onCreateClick = useCallback(() => {
        pendingFamily.current = undefined;
        setErrorMessage(undefined);
        setIsCreateOpen(true);
    }, []);

    const onRename = useCallback((family: FamilyDto) => {
        setErrorMessage(undefined);
        setRenameTarget(family);
    }, []);

    const onDelete = useCallback((family: FamilyDto) => {
        setErrorMessage(undefined);
        setDeleteTarget(family);
    }, []);

    const onToastClose = useCallback(() => {
        setToastMessage(undefined);
    }, []);

    const onCreateSubmit = useCallback(({ Name, FirstProfileName, FirstProfilePin }: FamilyNameFormValues) => {
        void (async () => {
            try {
                const family = pendingFamily.current ?? await createFamily.mutateAsync({ Name });
                pendingFamily.current = family;
                await createMember.mutateAsync({
                    familyId: family.Id,
                    body: {
                        Name: FirstProfileName,
                        Password: FirstProfilePin || undefined,
                        IsFamilyAdministrator: true
                    }
                });
                pendingFamily.current = undefined;
                closeDialogs();
                navigate(`/dashboard/families/${family.Id}`);
            } catch (err) {
                setErrorMessage(getApiErrorMessage(err, globalize.translate('ErrorDefault')));
            }
        })();
    }, [ closeDialogs, createFamily, createMember, navigate ]);

    const onRenameSubmit = useCallback(({ Name }: FamilyNameFormValues) => {
        if (!renameTarget) return;

        void (async () => {
            try {
                await updateFamily.mutateAsync({ familyId: renameTarget.Id, body: { Name } });
                closeDialogs();
                setToastMessage(globalize.translate('SettingsSaved'));
            } catch (err) {
                setErrorMessage(getApiErrorMessage(err, globalize.translate('ErrorDefault')));
            }
        })();
    }, [ closeDialogs, renameTarget, updateFamily ]);

    const onDeleteConfirm = useCallback((deleteMembers: boolean) => {
        if (!deleteTarget) return;

        void (async () => {
            try {
                await deleteFamily.mutateAsync({ familyId: deleteTarget.Id, deleteMembers });
                closeDialogs();
                setToastMessage(globalize.translate('FamilyDeleted'));
            } catch (err) {
                setErrorMessage(getApiErrorMessage(err, globalize.translate('ErrorDefault')));
            }
        })();
    }, [ closeDialogs, deleteFamily, deleteTarget ]);

    if (isPending) return <Loading />;

    const maxMembers = families?.[0]?.MaxMembers ?? DEFAULT_MAX_FAMILY_MEMBERS;

    return (
        <Page
            id='familiesPage'
            className='mainAnimatedPage type-interior'
            title={globalize.translate('Families')}
        >
            <Box className='content-primary'>
                <Stack spacing={3}>
                    <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        justifyContent='space-between'
                    >
                        <Box>
                            <Typography variant='h1'>{globalize.translate('Families')}</Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
                                {globalize.translate('FamiliesHelp', maxMembers)}
                            </Typography>
                        </Box>
                        <Button variant='contained' startIcon={<Add />} onClick={onCreateClick}>
                            {globalize.translate('NewFamily')}
                        </Button>
                    </Stack>

                    {isError && (
                        <Alert severity='error'>{globalize.translate('FamiliesLoadError')}</Alert>
                    )}

                    {!isError && families?.length === 0 && (
                        <Paper variant='outlined' sx={{ borderRadius: 3, p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
                            <Diversity3 sx={{ fontSize: 56, color: 'text.secondary' }} />
                            <Typography variant='h3' sx={{ mt: 1 }}>
                                {globalize.translate('FamiliesEmpty')}
                            </Typography>
                            <Typography variant='body2' color='text.secondary' sx={{ mt: 1, maxWidth: 520, mx: 'auto' }}>
                                {globalize.translate('FamiliesEmptyHelp', maxMembers)}
                            </Typography>
                            <Button variant='contained' startIcon={<Add />} onClick={onCreateClick} sx={{ mt: 3 }}>
                                {globalize.translate('NewFamily')}
                            </Button>
                        </Paper>
                    )}

                    {!!families?.length && (
                        <Box
                            sx={{
                                display: 'grid',
                                gap: 2,
                                gridTemplateColumns: {
                                    xs: 'minmax(0, 1fr)',
                                    sm: 'repeat(auto-fill, minmax(280px, 1fr))'
                                }
                            }}
                        >
                            {families.map(family => (
                                <FamilyCard
                                    key={family.Id}
                                    family={family}
                                    members={membersByFamily[family.Id] ?? []}
                                    onRename={onRename}
                                    onDelete={onDelete}
                                />
                            ))}
                        </Box>
                    )}
                </Stack>
            </Box>

            <FamilyNameDialog
                open={isCreateOpen}
                title={globalize.translate('NewFamily')}
                withFirstProfile
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onCreateSubmit}
            />
            <FamilyNameDialog
                open={!!renameTarget}
                title={globalize.translate('RenameFamily')}
                initialName={renameTarget?.Name}
                isSaving={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onSubmit={onRenameSubmit}
            />
            <DeleteFamilyDialog
                open={!!deleteTarget}
                family={deleteTarget}
                isDeleting={isSaving}
                errorMessage={errorMessage}
                onClose={closeDialogs}
                onConfirm={onDeleteConfirm}
            />
            <Toast
                open={!!toastMessage}
                onClose={onToastClose}
                message={toastMessage}
            />
        </Page>
    );
};

Component.displayName = 'FamiliesPage';
