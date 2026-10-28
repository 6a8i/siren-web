import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import { OutboundWebSocketMessageType } from '@jellyfin/sdk/lib/websocket';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import ConfirmDialog from 'components/ConfirmDialog';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import LibrarySection from '../components/overview/LibrarySection';
import OverviewHeader from '../components/overview/OverviewHeader';
import OverviewTiles from '../components/overview/OverviewTiles';
import RecentActivitySection from '../components/overview/RecentActivitySection';
import RunningTasksSection from '../components/overview/RunningTasksSection';
import SessionsWidget from '../components/overview/SessionsWidget';
import StorageSection from '../components/overview/StorageSection';
import useShutdownServer from '../features/system/api/useShutdownServer';
import useRestartServer from '../features/system/api/useRestartServer';
import useLiveTasks from '../features/tasks/hooks/useLiveTasks';
import { useStartTask } from '../features/tasks/api/useStartTask';

/**
 * The dashboard overview: the server's name and actions, four numbers that say how it is doing,
 * then what is happening now on the left and what happened recently on the right. Detail that is
 * rarely needed (storage paths) stays folded.
 */
export const Component = () => {
    const { api } = useApi();
    const [ isRestartConfirmDialogOpen, setIsRestartConfirmDialogOpen ] = useState(false);
    const [ isShutdownConfirmDialogOpen, setIsShutdownConfirmDialogOpen ] = useState(false);
    const startTask = useStartTask();
    const restartServer = useRestartServer();
    const shutdownServer = useShutdownServer();
    const queryClient = useQueryClient();

    const { data: tasks } = useLiveTasks({ isHidden: false });

    const librariesTask = useMemo(() => (
        tasks?.find((value) => value.Key === 'RefreshLibrary')
    ), [ tasks ]);

    const promptRestart = useCallback(() => {
        setIsRestartConfirmDialogOpen(true);
    }, []);

    const closeRestartDialog = useCallback(() => {
        setIsRestartConfirmDialogOpen(false);
    }, []);

    const promptShutdown = useCallback(() => {
        setIsShutdownConfirmDialogOpen(true);
    }, []);

    const closeShutdownDialog = useCallback(() => {
        setIsShutdownConfirmDialogOpen(false);
    }, []);

    const onScanLibraries = useCallback(() => {
        const scanLibrariesTask = tasks?.find((value) => value.Key === 'RefreshLibrary');

        if (scanLibrariesTask?.Id) {
            startTask.mutate({
                taskId: scanLibrariesTask.Id
            });
        }
    }, [ startTask, tasks ]);

    const onRestartConfirm = useCallback(() => {
        restartServer.mutate();
        setIsRestartConfirmDialogOpen(false);
    }, [ restartServer ]);

    const onShutdownConfirm = useCallback(() => {
        shutdownServer.mutate();
        setIsShutdownConfirmDialogOpen(false);
    }, [shutdownServer]);

    // Clear the query client when the server restarts or shuts down
    useEffect(() => {
        return api?.subscribe([OutboundWebSocketMessageType.ServerRestarting, OutboundWebSocketMessageType.ServerShuttingDown], () => {
            queryClient.clear();
        });
    }, [ api, queryClient ]);

    return (
        <Page
            id='dashboardPage'
            title={globalize.translate('TabDashboard')}
            className='mainAnimatedPage type-interior'
        >
            <ConfirmDialog
                open={isRestartConfirmDialogOpen}
                title={globalize.translate('Restart')}
                text={globalize.translate('MessageConfirmRestart')}
                onConfirm={onRestartConfirm}
                onCancel={closeRestartDialog}
                confirmButtonText={globalize.translate('Restart')}
                confirmButtonColor='error'
            />
            <ConfirmDialog
                open={isShutdownConfirmDialogOpen}
                title={globalize.translate('ButtonShutdown')}
                text={globalize.translate('MessageConfirmShutdown')}
                onConfirm={onShutdownConfirm}
                onCancel={closeShutdownDialog}
                confirmButtonText={globalize.translate('ButtonShutdown')}
                confirmButtonColor='error'
            />
            <Box className='content-primary'>
                <Stack spacing={3}>
                    <OverviewHeader
                        onScanLibrariesClick={onScanLibraries}
                        onRestartClick={promptRestart}
                        onShutdownClick={promptShutdown}
                        isScanning={librariesTask?.State !== TaskState.Idle}
                    />

                    <OverviewTiles tasks={tasks} />

                    <RunningTasksSection tasks={tasks} />

                    <Box
                        sx={{
                            display: 'grid',
                            gap: 3,
                            alignItems: 'start',
                            gridTemplateColumns: {
                                xs: 'minmax(0, 1fr)',
                                lg: 'minmax(0, 7fr) minmax(0, 5fr)',
                                xl: 'minmax(0, 2fr) minmax(0, 1fr)'
                            }
                        }}
                    >
                        <Stack spacing={3}>
                            <SessionsWidget />
                            <LibrarySection />
                        </Stack>
                        <Stack spacing={3}>
                            <RecentActivitySection />
                            <RecentActivitySection alerts />
                            <StorageSection />
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Page>
    );
};

Component.displayName = 'DashboardPage';
