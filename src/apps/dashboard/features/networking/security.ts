import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';

/** The Content-Security-Policy modes the server knows, in the order the select shows them. */
export const CSP_MODES = [ 'Off', 'ReportOnly', 'Enforce' ] as const;

export type ContentSecurityPolicyMode = typeof CSP_MODES[number];

/** The translation key of each mode's label. */
export const CSP_MODE_LABELS: Record<ContentSecurityPolicyMode, string> = {
    Off: 'CspModeOff',
    ReportOnly: 'CspModeReportOnly',
    Enforce: 'CspModeEnforce'
};

/** Siren's security settings on the server configuration; the generated SDK type does not know them. */
export type SirenServerConfiguration = ServerConfiguration & {
    EnableSecurityHeaders?: boolean
    AuthenticationRateLimitPerMinute?: number
    ContentSecurityPolicyMode?: string
};

export interface SecuritySettings {
    EnableSecurityHeaders: boolean
    ContentSecurityPolicyMode: ContentSecurityPolicyMode
    /** Attempts per client address and minute; 0 turns the limit off. */
    AuthenticationRateLimitPerMinute: number
}

/** The server's defaults, shown when a server predates one of the settings. */
export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
    EnableSecurityHeaders: true,
    ContentSecurityPolicyMode: 'ReportOnly',
    AuthenticationRateLimitPerMinute: 10
};

const isCspMode = (value: unknown): value is ContentSecurityPolicyMode => (
    typeof value === 'string' && (CSP_MODES as readonly string[]).includes(value)
);

/** The security settings the page shows for a configuration. */
export const getSecuritySettings = (config: SirenServerConfiguration): SecuritySettings => ({
    EnableSecurityHeaders: config.EnableSecurityHeaders ?? DEFAULT_SECURITY_SETTINGS.EnableSecurityHeaders,
    ContentSecurityPolicyMode: isCspMode(config.ContentSecurityPolicyMode) ?
        config.ContentSecurityPolicyMode :
        DEFAULT_SECURITY_SETTINGS.ContentSecurityPolicyMode,
    AuthenticationRateLimitPerMinute: config.AuthenticationRateLimitPerMinute
        ?? DEFAULT_SECURITY_SETTINGS.AuthenticationRateLimitPerMinute
});

/**
 * The configuration with the submitted security fields applied. An unchecked switch is absent
 * from the form data; an empty or negative limit and an unknown mode keep the current value, so a
 * cleared field never turns the limit off by accident.
 */
export const applySecuritySettings = (
    config: SirenServerConfiguration,
    data: Record<string, FormDataEntryValue>
): SirenServerConfiguration => {
    const current = getSecuritySettings(config);
    const mode = data.ContentSecurityPolicyMode?.toString();
    const limit = parseInt(data.AuthenticationRateLimitPerMinute?.toString() ?? '', 10);

    return {
        ...config,
        EnableSecurityHeaders: data.EnableSecurityHeaders?.toString() === 'on',
        ContentSecurityPolicyMode: isCspMode(mode) ? mode : current.ContentSecurityPolicyMode,
        AuthenticationRateLimitPerMinute: Number.isNaN(limit) || limit < 0 ?
            current.AuthenticationRateLimitPerMinute :
            limit
    };
};
