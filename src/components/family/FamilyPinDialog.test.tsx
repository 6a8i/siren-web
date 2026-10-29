import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { byRole, click, findButton, renderComponent, type RenderedComponent, submit, typeInto } from 'test-utils/renderComponent';

import FamilyPinDialog from './FamilyPinDialog';

// The strings are not loaded in a unit test: the key comes back.
vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string) => key
    }
}));

const theme = createTheme({ components: { MuiButtonBase: { defaultProps: { disableRipple: true } } } });

const noop = () => undefined;

function renderDialog(props: Partial<React.ComponentProps<typeof FamilyPinDialog>> = {}) {
    return renderComponent(
        <ThemeProvider theme={theme}>
            <FamilyPinDialog open memberName='filho' hasPin={false} onClose={noop} onSubmit={noop} {...props} />
        </ThemeProvider>
    );
}

const dialog = () => byRole('dialog')[0];
const pinInput = () => dialog().querySelector<HTMLInputElement>('input[name="Pin"]')!;
const saveButton = () => findButton('Save', dialog()) as HTMLButtonElement;

describe('<FamilyPinDialog />', () => {
    const rendered: RenderedComponent[] = [];
    const render = (props?: Partial<React.ComponentProps<typeof FamilyPinDialog>>) => {
        const result = renderDialog(props);
        rendered.push(result);
        return result;
    };

    afterEach(() => {
        for (const result of rendered.splice(0)) {
            result.unmount();
        }
    });

    it('titles itself "Set PIN" for a profile without one and submits the new PIN', () => {
        const onSubmit = vi.fn();
        render({ onSubmit });

        expect(dialog().textContent).toContain('SetPin · filho');
        expect(findButton('ClearPin', dialog())).toBeUndefined();
        expect(saveButton().disabled).toBe(true);

        typeInto(pinInput(), '2468');
        expect(saveButton().disabled).toBe(false);
        submit(pinInput().form!);

        expect(onSubmit).toHaveBeenCalledWith('2468');
    });

    it('does not submit an empty PIN', () => {
        const onSubmit = vi.fn();
        render({ onSubmit });

        submit(pinInput().form!);

        expect(onSubmit).not.toHaveBeenCalled();
    });

    it('titles itself "Change PIN" for a profile with one and offers to remove it', () => {
        const onSubmit = vi.fn();
        render({ hasPin: true, onSubmit });

        expect(dialog().textContent).toContain('ChangePin · filho');

        click(findButton('ClearPin', dialog())!);

        expect(onSubmit).toHaveBeenCalledWith(null);
    });

    it('shows the error the save failed with', () => {
        render({ errorMessage: 'PIN too short' });

        expect(byRole('alert').map(alert => alert.textContent)).toEqual([ 'PIN too short' ]);
    });

    it('holds the buttons while saving', () => {
        render({ hasPin: true, isSaving: true });
        typeInto(pinInput(), '2468');

        expect(saveButton().disabled).toBe(true);
        expect((findButton('ClearPin', dialog()) as HTMLButtonElement).disabled).toBe(true);
    });
});
