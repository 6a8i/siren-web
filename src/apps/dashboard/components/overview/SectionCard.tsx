import ChevronRight from '@mui/icons-material/ChevronRight';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import React, { type FC, type PropsWithChildren, type ReactNode } from 'react';
import { Link as RouterLink } from 'react-router-dom';

import globalize from 'lib/globalize';

interface SectionCardProps {
    title: string
    /** Where the "view all" link goes; no link is shown without it. */
    href?: string
    /** Something small shown next to the title, such as a count. */
    adornment?: ReactNode
    /** Removes the inner padding, for content that brings its own (lists). */
    disablePadding?: boolean
}

/**
 * One block of the dashboard overview: a titled card with an optional "view all" link.
 * Every section uses it, so the page reads as a grid of equal panels instead of loose lists.
 */
const SectionCard: FC<PropsWithChildren<SectionCardProps>> = ({
    title,
    href,
    adornment,
    disablePadding = false,
    children
}) => (
    <Paper
        variant='outlined'
        sx={{
            borderRadius: 3,
            overflow: 'hidden',
            bgcolor: 'background.paper'
        }}
    >
        <Stack
            direction='row'
            alignItems='center'
            spacing={1}
            sx={{
                px: 2,
                py: 1.25,
                borderBottom: 1,
                borderColor: 'divider'
            }}
        >
            <Typography
                variant='h3'
                component='h2'
                sx={{ fontSize: '1rem', flexGrow: 1 }}
            >
                {title}
            </Typography>
            {adornment}
            {href && (
                <Button
                    component={RouterLink}
                    to={href}
                    variant='text'
                    size='small'
                    color='inherit'
                    endIcon={<ChevronRight />}
                    sx={{ color: 'text.secondary', mr: -1 }}
                >
                    {globalize.translate('ViewAll')}
                </Button>
            )}
        </Stack>
        <Box sx={{ p: disablePadding ? 0 : 2 }}>
            {children}
        </Box>
    </Paper>
);

export default SectionCard;
