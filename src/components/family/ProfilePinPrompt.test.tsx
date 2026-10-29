import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { byRole, findButton, renderComponent, type RenderedComponent, submit, typeInto } from 'test-utils/renderComponent';

import ProfilePinPrompt from './ProfilePinPrompt';

// The strings are not loaded in a unit test: the key comes back, with its arguments appended.
vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => (args.length ? `${key}(${args.join(',')})` : key)
    }
}));

vi.mock('scripts/datetime', () => ({
    default: { getDisplayTime: (date: string) => `time(${date})` }
}));

const theme = createTheme({ components: { MuiButtonBase: { defaultProps: { disableRipple: true } } } });

const noop = () => undefined;

function renderPrompt(props: Partial<React.ComponentProps<typeof ProfilePinPrompt>> = {}) {
    return renderComponent(
        <ThemeProvider theme={theme}>
            <ProfilePinPrompt open memberName='pai' onClose={noop} onSubmit={noop} {...props} />
        </ThemeProvider>
    );
}

const dialog = () => byRole('dialog')[0];
const pinInput = () => dialog().querySelector<HTMLInputElement>('input[name="Pin"]')!;
const alertText = () => byRole('alert').map(alert => alert.textContent).join('');

describe('<ProfilePinPrompt />', () => {
    const rendered: RenderedComponent[] = [];
    const render = (props?: Partial<React.ComponentProps<typeof ProfilePinPrompt>>) => {
        const result = renderPrompt(props);
        rendered.push(result);
        return result;
    };

    afterEach(() => {
        for (const result of rendered.splice(0)) {
            result.unmount();
        }
    });

    it('asks for the member\'s PIN and submits what was typed', () => {
        const onSubmit = vi.fn();
        render({ onSubmit });

        expect(dialog().textContent).toContain('EnterPin(pai)');
        expect(pinInput().type).toBe('password');

        typeInto(pinInput(), '1234');
        submit(pinInput().form!);

        expect(onSubmit).toHaveBeenCalledWith('1234');
    });

    it('shows the error and flags the field, keeping the form usable', () => {
        render({ errorMessage: 'Incorrect PIN.' });

        expect(alertText()).toBe('Incorrect PIN.');
        expect(pinInput().getAttribute('aria-invalid')).toBe('true');
        expect(pinInput().disabled).toBe(false);
        expect((findButton('SwitchProfile', dialog()) as HTMLButtonElement).disabled).toBe(false);
    });

    it('replaces the error with the lockout message and disables the form while locked', () => {
        render({ isLocked: true, lockedUntil: '2026-10-28T12:30:00Z', errorMessage: 'Incorrect PIN.' });

        expect(alertText()).toBe('ProfileLockedOutUntil(time(2026-10-28T12:30:00Z))');
        expect(pinInput().disabled).toBe(true);
        expect(pinInput().getAttribute('aria-invalid')).toBe('false');
        expect((findButton('SwitchProfile', dialog()) as HTMLButtonElement).disabled).toBe(true);
    });

    it('says only that the profile is locked when the server gave no end time', () => {
        render({ isLocked: true });

        expect(alertText()).toBe('ProfileLockedOut');
    });

    it('disables both buttons while the switch is in progress', () => {
        render({ isBusy: true });

        expect((findButton('ButtonCancel', dialog()) as HTMLButtonElement).disabled).toBe(true);
        expect((findButton('SwitchProfile', dialog()) as HTMLButtonElement).disabled).toBe(true);
    });

    it('clears the field each time it opens', () => {
        const { rerender } = render();
        typeInto(pinInput(), '9999');
        expect(pinInput().value).toBe('9999');

        rerender(
            <ThemeProvider theme={theme}>
                <ProfilePinPrompt open={false} memberName='pai' onClose={noop} onSubmit={noop} />
            </ThemeProvider>
        );
        rerender(
            <ThemeProvider theme={theme}>
                <ProfilePinPrompt open memberName='pai' onClose={noop} onSubmit={noop} />
            </ThemeProvider>
        );

        expect(pinInput().value).toBe('');
    });
});
