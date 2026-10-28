import Chip from '@mui/material/Chip';
import React, { type FC } from 'react';

import globalize from 'lib/globalize';
import { getLockoutRemainingMinutes, type LockoutState } from 'utils/lockout';

interface LockedChipProps {
    member: LockoutState
    /** The moment to count from (see useLockoutClock). */
    now: number
}

/** "Locked for 14 min" while the server said when the lockout ends, plain "Locked" otherwise. */
export const getLockedLabel = (member: LockoutState, now: number): string => {
    const minutes = getLockoutRemainingMinutes(member, now);
    return minutes > 0 ? globalize.translate('ProfileLockedFor', minutes) : globalize.translate('ProfileLocked');
};

/** The warning chip of a locked-out profile, counting the minutes down. */
const LockedChip: FC<LockedChipProps> = ({ member, now }) => (
    <Chip size='small' color='warning' label={getLockedLabel(member, now)} />
);

export default LockedChip;
