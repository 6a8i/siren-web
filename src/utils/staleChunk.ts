/**
 * After a new build is published, a page still running the old one asks for script chunks that
 * no longer exist and gets a ChunkLoadError. The page simply has to be reloaded; this does it
 * once, automatically, and stands back if it happened moments ago (a broken deployment must not
 * turn into a reload loop).
 */

const STORAGE_KEY = 'siren-stale-chunk-reload';
const MIN_INTERVAL_MS = 60_000;

export function isChunkLoadError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
        return false;
    }

    const { name, message } = error as { name?: unknown, message?: unknown };
    return name === 'ChunkLoadError'
        || (typeof message === 'string' && /Loading (CSS )?chunk \S+ failed/i.test(message));
}

function getLastReload(): number {
    try {
        return Number(window.sessionStorage.getItem(STORAGE_KEY)) || 0;
    } catch {
        return 0;
    }
}

function setLastReload(time: number) {
    try {
        window.sessionStorage.setItem(STORAGE_KEY, String(time));
    } catch {
        // Storage can be unavailable (private mode, blocked site data); the reload still happens.
    }
}

/**
 * Reloads the page when the error is a stale chunk and no reload was tried in the last minute.
 * @returns Whether a reload was triggered.
 */
export function reloadOnStaleChunk(error: unknown): boolean {
    if (!isChunkLoadError(error)) {
        return false;
    }

    const now = Date.now();
    if (now - getLastReload() < MIN_INTERVAL_MS) {
        return false;
    }

    setLastReload(now);
    window.location.reload();
    return true;
}

/** Watches for stale chunk failures that no component catches (legacy views, lazy imports). */
export function installStaleChunkReload() {
    window.addEventListener('unhandledrejection', event => {
        if (reloadOnStaleChunk(event.reason)) {
            event.preventDefault();
        }
    });

    window.addEventListener('error', event => {
        reloadOnStaleChunk(event.error);
    });
}
