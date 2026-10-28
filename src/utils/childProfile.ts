/**
 * What a child profile may reach: a fixed home page and no settings. The flag itself lives on the
 * user policy (`isChildProfile` in types/family); this module decides what the app does with it.
 */

import { HomeSectionType } from 'constants/homeSectionType';

/** The number of home sections the home page lays out (see components/homesections). */
const HOME_SECTION_COUNT = 10;

/**
 * The home sections of a child profile, whatever its settings say: its libraries, what it was
 * watching and the latest items of its libraries, padded to the count the home page expects.
 */
export function getChildHomeSections(count = HOME_SECTION_COUNT): HomeSectionType[] {
    const sections = [
        HomeSectionType.SmallLibraryTiles,
        HomeSectionType.Resume,
        HomeSectionType.LatestMedia
    ];

    while (sections.length < count) {
        sections.push(HomeSectionType.None);
    }

    return sections.slice(0, count);
}

/** The routes that change how the profile looks or behaves: settings, preferences and the profile page. */
const RESTRICTED_PATHS = [
    '/mypreferencesmenu',
    '/mypreferencesdisplay',
    '/mypreferenceshome',
    '/mypreferencesplayback',
    '/mypreferencessubtitles',
    '/mypreferencescontrols',
    '/userprofile',
    '/dashboard',
    '/metadata'
];

/** Whether a child profile needs a family administrator's PIN to open this path (with or without a trailing slash). */
export function isChildRestrictedPath(pathname: string): boolean {
    let path = pathname.toLowerCase();
    while (path.length > 1 && path.endsWith('/')) {
        path = path.slice(0, -1);
    }
    return RESTRICTED_PATHS.some(restricted => path === restricted || path.startsWith(`${restricted}/`));
}
