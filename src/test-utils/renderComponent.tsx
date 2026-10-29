import { type ReactElement, act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// React only trusts act() once the environment says so (otherwise every update logs a warning).
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

export interface RenderedComponent {
    /** The element the component is rendered into; attached to the document, so portals and focus work. */
    container: HTMLElement
    rerender: (element: ReactElement) => void
    unmount: () => void
}

/**
 * Renders an element into a container on the document and exposes it. A tiny stand-in for
 * testing-library's render, which is not a dependency of this project: queries are plain DOM.
 */
export function renderComponent(element: ReactElement): RenderedComponent {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root: Root = createRoot(container);

    act(() => {
        root.render(element);
    });

    return {
        container,
        rerender: (next: ReactElement) => {
            act(() => {
                root.render(next);
            });
        },
        unmount: () => {
            act(() => root.unmount());
            container.remove();
        }
    };
}

/** Clicks like a user: a bubbling mouse event, flushed through act(). */
export function click(element: Element): void {
    act(() => {
        element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    });
}

/** Types into a controlled input: sets the value through the native setter so React notices the change. */
export function typeInto(input: HTMLInputElement, value: string): void {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    act(() => {
        setter?.call(input, value);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    });
}

/** Submits the form the element belongs to, the way pressing Enter or the submit button does. */
export function submit(form: HTMLFormElement): void {
    act(() => {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    });
}

/** Every element with the given role, in document order (MUI dialogs and menus render in portals on the body). */
export const byRole = (role: string, root: ParentNode = document.body): HTMLElement[] => (
    Array.from(root.querySelectorAll<HTMLElement>(`[role="${role}"]`))
);

/**
 * The last element with the role whose text or accessible name contains the text. The last one: a
 * menu that just closed lingers in the DOM through its exit transition, the open one comes after it.
 */
export function findByRole(role: string, text: string, root: ParentNode = document.body): HTMLElement | undefined {
    return byRole(role, root).reverse().find(element => (
        (element.getAttribute('aria-label') ?? '').includes(text) || (element.textContent ?? '').includes(text)
    ));
}

/** The buttons under the root, native or ARIA. */
export const buttons = (root: ParentNode = document.body): HTMLElement[] => (
    Array.from(root.querySelectorAll<HTMLElement>('button, [role="button"]'))
);

export function findButton(text: string, root: ParentNode = document.body): HTMLElement | undefined {
    return buttons(root).find(button => (
        (button.getAttribute('aria-label') ?? '').includes(text) || (button.textContent ?? '').includes(text)
    ));
}
