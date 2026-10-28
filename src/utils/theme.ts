/** The pseudo theme id that follows the operating system's light or dark preference. */
export const AUTO_THEME_ID = 'auto';

/** The theme used when the system prefers a dark scheme (or when it cannot be asked). */
export const AUTO_DARK_THEME_ID = 'siren';

/** The theme used when the system prefers a light scheme. */
export const AUTO_LIGHT_THEME_ID = 'sirenlight';

const DARK_SCHEME_QUERY = '(prefers-color-scheme: dark)';

function getDarkSchemeQuery(): MediaQueryList | undefined {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return undefined;
    }

    return window.matchMedia(DARK_SCHEME_QUERY);
}

/** Whether the system currently prefers a dark scheme. Defaults to dark when the browser cannot say. */
export function prefersDarkScheme(): boolean {
    const query = getDarkSchemeQuery();
    return query ? query.matches : true;
}

/** Resolves a stored theme id to a real one: the automatic choice follows the system preference. */
export function resolveThemeId(id?: string | null): string | undefined {
    if (id === AUTO_THEME_ID) {
        return prefersDarkScheme() ? AUTO_DARK_THEME_ID : AUTO_LIGHT_THEME_ID;
    }

    return id || undefined;
}

/** Calls back whenever the system scheme preference changes; returns the unsubscribe function. */
export function subscribeToSchemeChange(callback: () => void): () => void {
    const query = getDarkSchemeQuery();
    if (!query) {
        return () => { /* nothing to unsubscribe */ };
    }

    query.addEventListener('change', callback);
    return () => query.removeEventListener('change', callback);
}
