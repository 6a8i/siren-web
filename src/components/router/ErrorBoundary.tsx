import Alert from '@mui/material/Alert/Alert';
import AlertTitle from '@mui/material/AlertTitle/AlertTitle';
import Box from '@mui/material/Box/Box';
import Button from '@mui/material/Button/Button';
import Paper from '@mui/material/Paper/Paper';
import Typography from '@mui/material/Typography/Typography';
import classNames from 'classnames';
import React, { type FC, useCallback, useEffect } from 'react';
import { useRouteError } from 'react-router-dom';

import loading from 'components/loading/loading';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { isChunkLoadError, reloadOnStaleChunk } from 'utils/staleChunk';

interface ErrorBoundaryParams {
    pageClasses?: string[]
}

const ErrorBoundary: FC<ErrorBoundaryParams> = ({
    pageClasses = [ 'libraryPage' ]
}) => {
    const error = useRouteError() as Error;
    const isStaleChunk = isChunkLoadError(error);

    useEffect(() => {
        loading.hide();
    }, []);

    // A chunk from an older build: reload once, silently. If that was already tried, the message
    // below asks the user to do it, since something else is wrong with the published files.
    useEffect(() => {
        reloadOnStaleChunk(error);
    }, [ error ]);

    const onReloadClick = useCallback(() => {
        window.location.reload();
    }, []);

    return (
        <Page
            id='errorBoundary'
            className={classNames('mainAnimatedPage', pageClasses)}
        >
            <Box className='content-primary'>
                <Alert
                    severity={isStaleChunk ? 'info' : 'error'}
                    action={isStaleChunk ? (
                        <Button color='inherit' size='small' variant='outlined' onClick={onReloadClick}>
                            {globalize.translate('ReloadPage')}
                        </Button>
                    ) : undefined}
                >
                    <AlertTitle>
                        {isStaleChunk ? globalize.translate('StaleChunkTitle') : error.name}
                    </AlertTitle>

                    <Typography>
                        {isStaleChunk ? globalize.translate('StaleChunkMessage') : error.message}
                    </Typography>

                    {!isStaleChunk && error.stack && (
                        <Paper
                            variant='outlined'
                            sx={{
                                marginTop: 1,
                                backgroundColor: 'transparent'
                            }}
                        >
                            <Box
                                component='pre'
                                sx={{
                                    overflow: 'auto',
                                    margin: 2,
                                    maxHeight: '25rem' // 20 lines
                                }}
                            >
                                {error.stack}
                            </Box>
                        </Paper>
                    )}
                </Alert>
            </Box>
        </Page>
    );
};

export default ErrorBoundary;
