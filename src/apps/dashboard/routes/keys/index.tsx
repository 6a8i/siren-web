import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import { useTheme } from '@mui/material/styles';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import parseISO from 'date-fns/parseISO';
import { type MRT_ColumnDef, type MRT_Theme, useMaterialReactTable } from 'material-react-table';
import React, { useCallback, useMemo, useState } from 'react';

import DateTimeCell from 'apps/dashboard/components/table/DateTimeCell';
import TablePage, { DEFAULT_TABLE_OPTIONS } from 'apps/dashboard/components/table/TablePage';
import type { SirenAuthenticationInfo } from 'apps/dashboard/features/keys/api/keys-api';
import { useApiKeys } from 'apps/dashboard/features/keys/api/useApiKeys';
import { useRevokeKey } from 'apps/dashboard/features/keys/api/useRevokeKey';
import { useCreateKey } from 'apps/dashboard/features/keys/api/useCreateKey';
import { useSetKeyReadOnly } from 'apps/dashboard/features/keys/api/useSetKeyReadOnly';
import CreateApiKeyDialog, { type CreateApiKeyValues } from 'apps/dashboard/features/keys/components/CreateApiKeyDialog';
import ReadOnlyCell from 'apps/dashboard/features/keys/components/ReadOnlyCell';
import globalize from 'lib/globalize';
import ConfirmDialog from 'components/ConfirmDialog';

export const Component = () => {
    const [ isCreateApiKeyPromptOpen, setIsCreateApiKeyPromptOpen ] = useState(false);
    const [ isConfirmDeleteOpen, setIsConfirmDeleteOpen ] = useState(false);
    const [ apiKeyToDelete, setApiKeyToDelete ] = useState('');
    const { data, isLoading, isError } = useApiKeys();
    const keys = useMemo<SirenAuthenticationInfo[]>(() => (
        data?.Items || []
    ), [ data ]);
    const revokeKey = useRevokeKey();
    const createKey = useCreateKey();
    const setKeyReadOnly = useSetKeyReadOnly();
    const theme = useTheme();

    const columns = useMemo<MRT_ColumnDef<SirenAuthenticationInfo>[]>(() => [
        {
            id: 'ApiKey',
            accessorKey: 'AccessToken',
            header: globalize.translate('HeaderApiKey'),
            size: 300
        },
        {
            id: 'AppName',
            accessorKey: 'AppName',
            header: globalize.translate('HeaderApp')
        },
        {
            id: 'DateIssued',
            accessorFn: item => item.DateCreated ? parseISO(item.DateCreated) : undefined,
            Cell: DateTimeCell,
            header: globalize.translate('HeaderDateIssued'),
            filterVariant: 'datetime-range'
        },
        {
            id: 'ReadOnly',
            accessorFn: item => !!item.IsReadOnly,
            header: globalize.translate('LabelReadOnly'),
            size: 140,
            filterVariant: 'checkbox',
            Cell: ReadOnlyCell
        }
    ], []);

    // NOTE: We need to provide a custom theme due to a MRT bug causing the initial theme to always be used
    // https://github.com/KevinVandy/material-react-table/issues/1429
    const mrtTheme = useMemo<Partial<MRT_Theme>>(() => ({
        baseBackgroundColor: theme.palette.background.paper
    }), [ theme ]);

    const table = useMaterialReactTable({
        ...DEFAULT_TABLE_OPTIONS,
        mrtTheme,

        columns,
        data: keys,

        state: {
            isLoading
        },

        // Enable (read-only toggle, delete) row actions
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: '',
                size: 80
            }
        },

        renderTopToolbarCustomActions: () => (
            <Button
                startIcon={<AddIcon />}
                onClick={showNewKeyPopup}
            >
                {globalize.translate('HeaderNewApiKey')}
            </Button>
        ),

        renderRowActions: ({ row }) => {
            const isReadOnly = !!row.original.IsReadOnly;
            const toggleLabel = globalize.translate(isReadOnly ? 'ApiKeyAllowWrites' : 'ApiKeyMakeReadOnly');
            return (
                <Box sx={{ display: 'flex' }}>
                    <Tooltip title={toggleLabel}>
                        <IconButton
                            aria-label={toggleLabel}
                            disabled={setKeyReadOnly.isPending}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => row.original.AccessToken && onToggleReadOnly(row.original.AccessToken, !isReadOnly)}
                        >
                            {isReadOnly ? <LockOpenIcon /> : <LockIcon />}
                        </IconButton>
                    </Tooltip>
                    <Tooltip title={globalize.translate('ButtonRevoke')}>
                        <IconButton
                            color='error'
                            aria-label={globalize.translate('ButtonRevoke')}
                            // eslint-disable-next-line react/jsx-no-bind
                            onClick={() => row.original?.AccessToken && onRevokeKey(row.original.AccessToken)}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                </Box>
            );
        }
    });

    const onToggleReadOnly = useCallback((key: string, isReadOnly: boolean) => {
        setKeyReadOnly.mutate({ key, isReadOnly });
    }, [ setKeyReadOnly ]);

    const onRevokeKey = useCallback((accessToken: string) => {
        setApiKeyToDelete(accessToken);
        setIsConfirmDeleteOpen(true);
    }, []);

    const showNewKeyPopup = useCallback(() => {
        setIsCreateApiKeyPromptOpen(true);
    }, []);

    const onCreateApiKeyPromptClose = useCallback(() => {
        setIsCreateApiKeyPromptOpen(false);
    }, []);

    const onConfirmDelete = useCallback(() => {
        revokeKey.mutate({
            key: apiKeyToDelete
        }, {
            onSettled: () => {
                setApiKeyToDelete('');
                setIsConfirmDeleteOpen(false);
            }
        });
    }, [ revokeKey, apiKeyToDelete ]);

    const onConfirmDeleteCancel = useCallback(() => {
        setApiKeyToDelete('');
        setIsConfirmDeleteOpen(false);
    }, []);

    const onConfirmCreate = useCallback(({ app, isReadOnly }: CreateApiKeyValues) => {
        createKey.mutate({
            app,
            isReadOnly
        }, {
            onSettled: () => {
                setIsCreateApiKeyPromptOpen(false);
            }
        });
    }, [ createKey ]);

    return (
        <>
            <ConfirmDialog
                open={isConfirmDeleteOpen}
                title={globalize.translate('HeaderConfirmRevokeApiKey')}
                text={globalize.translate('MessageConfirmRevokeApiKey')}
                confirmButtonColor='error'
                confirmButtonText={globalize.translate('Delete')}
                onConfirm={onConfirmDelete}
                onCancel={onConfirmDeleteCancel}
            />
            <CreateApiKeyDialog
                open={isCreateApiKeyPromptOpen}
                isSaving={createKey.isPending}
                onConfirm={onConfirmCreate}
                onClose={onCreateApiKeyPromptClose}
            />
            <TablePage
                id='apiKeysPage'
                title={globalize.translate('HeaderApiKeys')}
                subtitle={globalize.translate('HeaderApiKeysHelp')}
                className='mainAnimatedPage type-interior'
                table={table}
                isError={isError}
                errorMessage={globalize.translate('ApiKeysLoadError')}
            />
        </>
    );
};

Component.displayName = 'ApiKeysPage';
