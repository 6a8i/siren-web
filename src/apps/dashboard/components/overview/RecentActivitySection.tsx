import List from '@mui/material/List';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import subSeconds from 'date-fns/subSeconds';
import React, { type FC, useMemo } from 'react';

import { useLogEntries } from 'apps/dashboard/features/activity/api/useLogEntries';
import ActivityListItem from 'apps/dashboard/features/activity/components/ActivityListItem';
import globalize from 'lib/globalize';

import SectionCard from './SectionCard';

interface RecentActivitySectionProps {
    /** User activity (sign-ins, playback) or system alerts. */
    alerts?: boolean
}

/** The latest log entries, five at a time; the alerts variant disappears when there is nothing to show. */
const RecentActivitySection: FC<RecentActivitySectionProps> = ({ alerts = false }) => {
    const since = useMemo(() => (
        subSeconds(new Date(), (alerts ? 7 : 1) * 24 * 60 * 60).toISOString()
    ), [ alerts ]);

    const { data: logs, isPending } = useLogEntries({
        startIndex: 0,
        limit: 5,
        minDate: since,
        hasUserId: !alerts
    });

    const href = `/dashboard/activity?useractivity=${alerts ? 'false' : 'true'}`;

    if (alerts && (isPending || !logs?.Items?.length)) return null;

    let content;
    if (isPending) {
        content = (
            <Stack spacing={1.5} sx={{ p: 2 }}>
                <Skeleton variant='rounded' height={48} />
                <Skeleton variant='rounded' height={48} />
                <Skeleton variant='rounded' height={48} />
            </Stack>
        );
    } else if (logs?.Items?.length) {
        content = (
            <List disablePadding dense>
                {logs.Items.map(entry => (
                    <ActivityListItem
                        key={entry.Id}
                        item={entry}
                        displayShortOverview={!alerts}
                        to={href}
                    />
                ))}
            </List>
        );
    } else {
        content = (
            <Typography variant='body2' color='text.secondary' sx={{ p: 2 }}>
                {globalize.translate('DashboardNoRecentActivity')}
            </Typography>
        );
    }

    return (
        <SectionCard
            title={globalize.translate(alerts ? 'Alerts' : 'HeaderActivity')}
            href={href}
            disablePadding
        >
            {content}
        </SectionCard>
    );
};

export default RecentActivitySection;
