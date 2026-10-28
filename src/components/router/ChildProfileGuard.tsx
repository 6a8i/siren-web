import React, { type FC, useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import FamilyAdminPinDialog from 'components/family/FamilyAdminPinDialog';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { isChildProfile } from 'types/family';
import { isChildRestrictedPath } from 'utils/childProfile';

/**
 * A route layer for child profiles: the settings and preference pages open only after a family
 * administrator's PIN. Cancelling goes home; once unlocked, the pages stay reachable until the
 * app reloads or another profile signs in.
 */
const ChildProfileGuard: FC = () => {
    const { user } = useApi();
    const location = useLocation();
    const navigate = useNavigate();
    const [ unlockedUserId, setUnlockedUserId ] = useState<string>();

    const isChild = isChildProfile(user);
    const isUnlocked = !!user?.Id && unlockedUserId === user.Id;
    const isBlocked = isChild && !isUnlocked && isChildRestrictedPath(location.pathname);

    // A different profile starts locked again.
    useEffect(() => {
        if (unlockedUserId && unlockedUserId !== user?.Id) setUnlockedUserId(undefined);
    }, [ unlockedUserId, user?.Id ]);

    const onCancel = useCallback(() => {
        navigate('/home', { replace: true });
    }, [ navigate ]);

    const onVerified = useCallback(() => {
        setUnlockedUserId(user?.Id);
    }, [ user?.Id ]);

    if (isBlocked) {
        return (
            <FamilyAdminPinDialog
                open
                description={globalize.translate('ChildSettingsNeedAdminPin')}
                onClose={onCancel}
                onVerified={onVerified}
            />
        );
    }

    return <Outlet />;
};

export default ChildProfileGuard;
