import { type RefObject, useEffect, useRef } from 'react';

/**
 * Focuses a dialog's main field once the dialog has opened. MUI's focus trap takes the focus when the
 * dialog mounts, so this waits a tick and then moves it to the field.
 */
export function useFocusOnOpen<T extends HTMLElement>(open: boolean): RefObject<T> {
    const ref = useRef<T>(null);

    useEffect(() => {
        if (!open) return;

        const timer = window.setTimeout(() => ref.current?.focus(), 50);
        return () => window.clearTimeout(timer);
    }, [ open ]);

    return ref;
}
