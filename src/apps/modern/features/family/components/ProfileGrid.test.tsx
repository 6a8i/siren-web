import type { Api } from '@jellyfin/sdk';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext } from 'hooks/useApi';
import { click, findButton, findByRole, renderComponent, type RenderedComponent } from 'test-utils/renderComponent';
import type { FamilyMemberDto } from 'types/family';

import ProfileGrid from './ProfileGrid';

// useApi imports the connection manager, which drags in the app host and its webpack-time defines.
vi.mock('lib/jellyfin-apiclient', () => ({ ServerConnections: {} }));

// The strings are not loaded in a unit test: the key comes back, with its arguments appended.
vi.mock('lib/globalize', () => ({
    default: {
        translate: (key: string, ...args: unknown[]) => (args.length ? `${key}(${args.join(',')})` : key)
    }
}));

const NOW = Date.parse('2026-10-28T12:00:00Z');
const MINUTE = 60_000;

const api = { basePath: 'https://siren.test' } as Api;

// The ripple animates after the click, outside act(); the test is about what the click does.
const theme = createTheme({ components: { MuiButtonBase: { defaultProps: { disableRipple: true } } } });

const member = (overrides: Partial<FamilyMemberDto> & { Id: string, Name: string }): FamilyMemberDto => ({
    HasPin: false,
    IsLockedOut: false,
    HasAllFamilyFolders: true,
    ...overrides
});

const PAI = member({ Id: 'pai', Name: 'pai', HasPin: true, PrimaryImageTag: 'tag-1' });
const FILHO = member({ Id: 'filho', Name: 'filho' });
const LOCKED = member({ Id: 'avo', Name: 'avo', HasPin: true, IsLockedOut: true, LockedOutUntil: new Date(NOW + 14 * MINUTE).toISOString() });

const noop = () => undefined;

function renderGrid(props: Partial<React.ComponentProps<typeof ProfileGrid>> = {}) {
    return renderComponent(
        <ThemeProvider theme={theme}><ApiContext.Provider value={{ api }}>
            <ProfileGrid
                members={[ PAI, FILHO ]}
                currentUserId='filho'
                now={NOW}
                manage={false}
                canAdd={false}
                onAdd={noop}
                onSelect={noop}
                onEdit={noop}
                onSetPin={noop}
                onAvatar={noop}
                onHistory={noop}
                onUnlock={noop}
                onRemove={noop}
                {...props}
            />
        </ApiContext.Provider></ThemeProvider>
    );
}

describe('<ProfileGrid />', () => {
    const rendered: RenderedComponent[] = [];
    const render = (props?: Partial<React.ComponentProps<typeof ProfileGrid>>) => {
        const result = renderGrid(props);
        rendered.push(result);
        return result;
    };

    afterEach(() => {
        for (const result of rendered.splice(0)) {
            result.unmount();
        }
    });

    it('renders a tile per member, with the image of the one that has it', () => {
        const { container } = render();

        expect(findButton('pai', container)).toBeDefined();
        expect(findButton('filho', container)).toBeDefined();

        const image = container.querySelector('img');
        expect(image?.getAttribute('src')).toBe('https://siren.test/Users/pai/Images/Primary?tag=tag-1&maxWidth=320');
        expect(container.querySelectorAll('img')).toHaveLength(1);
    });

    it('offers "Continue as" on the profile chosen last on this device', () => {
        const { container } = render({ lastProfileId: 'pai' });

        expect(findButton('ContinueAs(pai)', container)).toBeDefined();
        expect(container.textContent).toContain('ContinueAs(pai)');
        expect(container.textContent).not.toContain('ContinueAs(filho)');
    });

    it('falls back to the current profile for "Continue as" when the last one is gone', () => {
        const { container } = render({ lastProfileId: 'someone-else' });

        expect(container.textContent).toContain('ContinueAs(filho)');
        expect(container.textContent).not.toContain('YouBadge');
    });

    it('shows the locked chip counting the minutes down', () => {
        const { container } = render({ members: [ PAI, LOCKED ] });

        expect(container.textContent).toContain('ProfileLockedFor(14)');
    });

    it('calls onSelect with the member when a tile is clicked', () => {
        const onSelect = vi.fn();
        const { container } = render({ onSelect });

        click(findButton('pai', container)!);

        expect(onSelect).toHaveBeenCalledTimes(1);
        expect(onSelect).toHaveBeenCalledWith(PAI);
    });

    it('opens the action menu instead of selecting in manage mode', () => {
        const onSelect = vi.fn();
        const onEdit = vi.fn();
        const { container } = render({ manage: true, canAdd: true, onSelect, onEdit });

        expect(findButton('AddFamilyProfile', container)).toBeDefined();

        click(findButton('pai', container)!);
        expect(onSelect).not.toHaveBeenCalled();

        const edit = findByRole('menuitem', 'EditFamilyProfile');
        expect(edit).toBeDefined();
        click(edit!);
        expect(onEdit).toHaveBeenCalledWith(PAI);
    });

    it('offers to unlock only a locked profile, and never to remove the current one', () => {
        const { container } = render({ manage: true, members: [ FILHO, LOCKED ] });

        click(findButton('filho', container)!);
        expect(findByRole('menuitem', 'UnlockProfile')).toBeUndefined();
        expect(findByRole('menuitem', 'RemoveProfile')).toBeUndefined();
        click(document.body);

        click(findButton('avo', container)!);
        expect(findByRole('menuitem', 'UnlockProfile')).toBeDefined();
        expect(findByRole('menuitem', 'RemoveProfile')).toBeDefined();
    });
});
