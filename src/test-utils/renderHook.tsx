import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { type FC, type PropsWithChildren, act } from 'react';
import { createRoot } from 'react-dom/client';

// React only trusts act() once the environment says so (otherwise every update logs a warning).
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

interface RenderHookOptions {
    /** The query client to provide; a fresh one without retries by default. */
    queryClient?: QueryClient
    /** Extra providers to render between the QueryClientProvider and the hook. */
    wrapper?: FC<PropsWithChildren>
}

/** A query client that fails fast, so a test is not kept waiting on retries. */
export const createTestQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: { retry: false, gcTime: Infinity }
    }
});

/**
 * Renders a hook inside a QueryClientProvider (and any extra wrapper) and exposes its latest return value.
 * A tiny stand-in for testing-library's renderHook, which is not a dependency of this project.
 */
export function renderHook<T>(useHook: () => T, { queryClient = createTestQueryClient(), wrapper: Wrapper }: RenderHookOptions = {}) {
    const result = { current: undefined as T };

    const HookHost: FC = () => {
        result.current = useHook();
        return null;
    };

    // A detached container is enough: nothing here reads the layout.
    const root = createRoot(document.createElement('div'));
    const host = <HookHost />;

    act(() => {
        root.render(
            <QueryClientProvider client={queryClient}>
                {Wrapper ? <Wrapper>{host}</Wrapper> : host}
            </QueryClientProvider>
        );
    });

    return {
        result,
        queryClient,
        unmount: () => {
            act(() => root.unmount());
            queryClient.clear();
        }
    };
}

const POLL_INTERVAL_MS = 10;
const DEFAULT_TIMEOUT_MS = 2000;

/** Resolves once the condition holds, flushing React updates in between; rejects after the timeout. */
export async function waitFor(condition: () => boolean, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<void> {
    const deadline = Date.now() + timeoutMs;

    while (!condition()) {
        if (Date.now() > deadline) {
            throw new Error(`waitFor: condition not met within ${timeoutMs}ms`);
        }

        await act(() => new Promise<void>(resolve => {
            setTimeout(resolve, POLL_INTERVAL_MS);
        }));
    }
}
