import type { TaskInfo } from '@jellyfin/sdk/lib/generated-client/models/task-info';
import { TaskState } from '@jellyfin/sdk/lib/generated-client/models/task-state';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, useMemo } from 'react';

import TaskProgress from 'apps/dashboard/features/tasks/components/TaskProgress';
import globalize from 'lib/globalize';

import SectionCard from './SectionCard';

interface RunningTasksSectionProps {
    tasks?: TaskInfo[]
}

/** Progress of the tasks running right now; absent when the server is idle. */
const RunningTasksSection: FC<RunningTasksSectionProps> = ({ tasks }) => {
    const runningTasks = useMemo(() => (
        tasks?.filter(task => task.State === TaskState.Running) ?? []
    ), [ tasks ]);

    if (runningTasks.length === 0) return null;

    return (
        <SectionCard title={globalize.translate('HeaderRunningTasks')} href='/dashboard/tasks'>
            <Stack spacing={1.5}>
                {runningTasks.map(task => (
                    <Stack
                        key={task.Id}
                        direction={{ xs: 'column', sm: 'row' }}
                        alignItems={{ xs: 'stretch', sm: 'center' }}
                        spacing={1}
                    >
                        <Typography variant='body2' sx={{ minWidth: 0, flexBasis: { sm: '40%' } }} noWrap>
                            {task.Name}
                        </Typography>
                        <Box sx={{ flexGrow: 1 }}>
                            <TaskProgress task={task} />
                        </Box>
                    </Stack>
                ))}
            </Stack>
        </SectionCard>
    );
};

export default RunningTasksSection;
