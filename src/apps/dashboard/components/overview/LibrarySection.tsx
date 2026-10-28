import React, { type FC } from 'react';

import ItemCountsWidget from 'apps/dashboard/components/widgets/ItemCountsWidget';
import globalize from 'lib/globalize';

import SectionCard from './SectionCard';

/** What the libraries hold, as compact counters. */
const LibrarySection: FC = () => (
    <SectionCard title={globalize.translate('HeaderLibraries')} href='/dashboard/libraries'>
        <ItemCountsWidget />
    </SectionCard>
);

export default LibrarySection;
