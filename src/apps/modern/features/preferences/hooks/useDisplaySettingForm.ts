import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import toast from 'components/toast/toast';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';

import type { DisplaySettingsValues } from '../types/displaySettingsValues';
import { useDisplaySettings } from './useDisplaySettings';

type UpdateField = {
    name: keyof DisplaySettingsValues;
    value: string | boolean;
};

export function useDisplaySettingForm() {
    const [urlParams] = useSearchParams();
    const { user } = useApi();
    const {
        displaySettings,
        loading,
        saveDisplaySettings
    // Without a userId in the URL the page is for the signed-in user; it used to wait forever.
    } = useDisplaySettings({ userId: urlParams.get('userId') || user?.Id });
    const [formValues, setFormValues] = useState<DisplaySettingsValues>();

    useEffect(() => {
        if (!loading && displaySettings && !formValues) {
            setFormValues(displaySettings);
        }
    }, [formValues, loading, displaySettings]);

    const updateField = useCallback(({ name, value }: UpdateField) => {
        if (formValues) {
            setFormValues({
                ...formValues,
                [name]: value
            });
        }
    }, [formValues, setFormValues]);

    const submitChanges = useCallback(async () => {
        if (formValues) {
            await saveDisplaySettings(formValues);
            toast(globalize.translate('SettingsSaved'));
        }
    }, [formValues, saveDisplaySettings]);

    return {
        loading,
        values: formValues,
        submitChanges,
        updateField
    };
}
