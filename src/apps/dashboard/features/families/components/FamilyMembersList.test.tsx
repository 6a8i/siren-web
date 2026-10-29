import type { Api } from '@jellyfin/sdk';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiContext } from 'hooks/useApi';
import { byRole, click, findButton, findByRole, renderComponent, type RenderedComponent } from 'test-utils/renderComponent';
import type { FamilyMemberDto } from 'types/family';

import FamilyMembersList from './FamilyMembersList';

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
// The avatar reads theme.vars, which only a CSS-variables theme (the app's kind) provides.
const theme = createTheme({ cssVariables: true, components: { MuiButtonBase: { defaultProps: { disableRipple: true } } } });

const member = (overrides: Partial<FamilyMemberDto> & { Id: string, Name: string }): FamilyMemberDto => ({
    HasPin: false,
    IsLockedOut: false,
    HasAllFamilyFolders: true,
    ...overrides
});

const PAI = member({ Id: 'pai', Name: 'pai', HasPin: true, Policy: { IsFamilyAdministrator: true } as FamilyMemberDto['Policy'] });
const FILHO = member({ Id: 'filho', Name: 'filho', Policy: { IsDisabled: true } as FamilyMemberDto['Policy'] });
const LOCKED = member({ Id: 'avo', Name: 'avo', HasPin: true, IsLockedOut: true, LockedOutUntil: new Date(NOW + 3 * MINUTE).toISOString() });

const noop = () => undefined;

type Props = React.ComponentProps<typeof FamilyMembersList>;

function renderList(props: Partial<Props> = {}) {
    return renderComponent(
        <ThemeProvider theme={theme}>
            <ApiContext.Provider value={{ api }}>
                <MemoryRouter>
                    <FamilyMembersList
                        members={[ PAI, FILHO, LOCKED ]}
                        now={NOW}
                        onEdit={noop}
                        onSetPin={noop}
                        onAvatar={noop}
                        onHistory={noop}
                        onUnlock={noop}
                        onToggleFamilyAdmin={noop}
                        onUnlink={noop}
                        onRemove={noop}
                        {...props}
                    />
                </MemoryRouter>
            </ApiContext.Provider>
        </ThemeProvider>
    );
}

const rows = (container: ParentNode) => Array.from(container.querySelectorAll('li'));
const rowOf = (container: ParentNode, name: string) => rows(container).find(row => row.textContent?.includes(name))!;
const openMenu = (container: ParentNode, name: string) => click(findButton('ButtonMore', rowOf(container, name))!);
const menuItems = () => byRole('menuitem').map(item => item.textContent);

describe('<FamilyMembersList />', () => {
    const rendered: RenderedComponent[] = [];
    const render = (props?: Partial<Props>) => {
        const result = renderList(props);
        rendered.push(result);
        return result;
    };

    afterEach(() => {
        for (const result of rendered.splice(0)) {
            result.unmount();
        }
    });

    it('renders a row per member with its chips and PIN state', () => {
        const { container } = render();

        expect(rows(container)).toHaveLength(3);

        const pai = rowOf(container, 'pai');
        expect(pai.textContent).toContain('FamilyAdministrator');
        expect(pai.textContent).toContain('PinProtected');

        const filho = rowOf(container, 'filho');
        expect(filho.textContent).toContain('Disabled');
        expect(filho.textContent).toContain('NoPin');

        expect(rowOf(container, 'avo').textContent).toContain('ProfileLockedFor(3)');
    });

    it('says so when the family has no profile', () => {
        const { container } = render({ members: [] });

        expect(rows(container)).toHaveLength(0);
        expect(container.textContent).toContain('NoFamilyProfiles');
    });

    it('lists the actions of a profile in its menu, "Set PIN" for one without a PIN', () => {
        const { container } = render();

        openMenu(container, 'filho');

        expect(menuItems()).toEqual([
            'EditFamilyProfile',
            'SetPin',
            'ProfileAvatar',
            'WatchHistory',
            'FamilyAdministrator',
            'OpenFullUserPage',
            'UnlinkFromFamily',
            'RemoveProfile'
        ]);
    });

    it('offers "Change PIN" and, while locked, "Unlock"', () => {
        const { container } = render();

        openMenu(container, 'avo');

        expect(menuItems()).toContain('ChangePin');
        expect(menuItems()).toContain('UnlockProfile');
    });

    it('calls the action with the member and closes the menu', () => {
        const onEdit = vi.fn();
        const onUnlock = vi.fn();
        const onRemove = vi.fn();
        const { container } = render({ onEdit, onUnlock, onRemove });

        openMenu(container, 'avo');
        click(findByRole('menuitem', 'UnlockProfile')!);
        expect(onUnlock).toHaveBeenCalledWith(LOCKED);

        openMenu(container, 'pai');
        click(findByRole('menuitem', 'EditFamilyProfile')!);
        expect(onEdit).toHaveBeenCalledWith(PAI);

        openMenu(container, 'filho');
        click(findByRole('menuitem', 'RemoveProfile')!);
        expect(onRemove).toHaveBeenCalledWith(FILHO);
    });

    it('links the full user page of the profile', () => {
        const { container } = render();

        openMenu(container, 'pai');

        const link = findByRole('menuitem', 'OpenFullUserPage') as HTMLAnchorElement;
        expect(link.getAttribute('href')).toBe('/dashboard/users/pai/profile');
    });
});
