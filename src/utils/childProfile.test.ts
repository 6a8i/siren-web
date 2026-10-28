import { describe, expect, it } from 'vitest';

import { HomeSectionType } from 'constants/homeSectionType';

import { getChildHomeSections, isChildRestrictedPath } from './childProfile';

describe('getChildHomeSections()', () => {
    it('shows the libraries, what is being watched and the latest items, and nothing else', () => {
        const sections = getChildHomeSections();

        expect(sections).toHaveLength(10);
        expect(sections.slice(0, 3)).toEqual([
            HomeSectionType.SmallLibraryTiles,
            HomeSectionType.Resume,
            HomeSectionType.LatestMedia
        ]);
        expect(sections.slice(3).every(section => section === HomeSectionType.None)).toBe(true);
    });

    it('pads or cuts to the count the home page lays out', () => {
        expect(getChildHomeSections(5)).toEqual([
            HomeSectionType.SmallLibraryTiles,
            HomeSectionType.Resume,
            HomeSectionType.LatestMedia,
            HomeSectionType.None,
            HomeSectionType.None
        ]);
        expect(getChildHomeSections(2)).toEqual([ HomeSectionType.SmallLibraryTiles, HomeSectionType.Resume ]);
    });

    it('never includes the sections a child should not see', () => {
        const sections = getChildHomeSections();

        expect(sections).not.toContain(HomeSectionType.NextUp);
        expect(sections).not.toContain(HomeSectionType.LiveTv);
        expect(sections).not.toContain(HomeSectionType.ActiveRecordings);
    });
});

describe('isChildRestrictedPath()', () => {
    it('restricts the settings, preferences and profile pages', () => {
        expect(isChildRestrictedPath('/mypreferencesmenu')).toBe(true);
        expect(isChildRestrictedPath('/mypreferencesdisplay')).toBe(true);
        expect(isChildRestrictedPath('/mypreferenceshome')).toBe(true);
        expect(isChildRestrictedPath('/mypreferencesplayback')).toBe(true);
        expect(isChildRestrictedPath('/mypreferencessubtitles')).toBe(true);
        expect(isChildRestrictedPath('/mypreferencescontrols')).toBe(true);
        expect(isChildRestrictedPath('/userprofile')).toBe(true);
        expect(isChildRestrictedPath('/dashboard/users')).toBe(true);
    });

    it('ignores case and trailing slashes', () => {
        expect(isChildRestrictedPath('/MyPreferencesMenu/')).toBe(true);
        expect(isChildRestrictedPath('/userprofile/')).toBe(true);
    });

    it('leaves the rest of the app alone', () => {
        expect(isChildRestrictedPath('/home')).toBe(false);
        expect(isChildRestrictedPath('/family')).toBe(false);
        expect(isChildRestrictedPath('/video')).toBe(false);
        expect(isChildRestrictedPath('/mypreferencesmenuX')).toBe(false);
        expect(isChildRestrictedPath('/')).toBe(false);
    });
});
