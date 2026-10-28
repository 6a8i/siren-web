import { describe, expect, it } from 'vitest';

import { applySecuritySettings, getSecuritySettings, type SirenServerConfiguration } from './security';

describe('getSecuritySettings', () => {
    it('falls back to the server defaults when a server predates the settings', () => {
        expect(getSecuritySettings({})).toEqual({
            EnableSecurityHeaders: true,
            ContentSecurityPolicyMode: 'ReportOnly',
            AuthenticationRateLimitPerMinute: 10
        });
    });

    it('reads the server values, including a limit of zero', () => {
        expect(getSecuritySettings({
            EnableSecurityHeaders: false,
            ContentSecurityPolicyMode: 'Enforce',
            AuthenticationRateLimitPerMinute: 0
        })).toEqual({
            EnableSecurityHeaders: false,
            ContentSecurityPolicyMode: 'Enforce',
            AuthenticationRateLimitPerMinute: 0
        });
    });

    it('treats an unknown mode as the default', () => {
        expect(getSecuritySettings({ ContentSecurityPolicyMode: 'Strict' }).ContentSecurityPolicyMode).toBe('ReportOnly');
    });
});

describe('applySecuritySettings', () => {
    const config: SirenServerConfiguration = {
        ServerName: 'Siren',
        EnableSecurityHeaders: true,
        ContentSecurityPolicyMode: 'ReportOnly',
        AuthenticationRateLimitPerMinute: 10
    };

    it('applies the submitted values and keeps the rest of the configuration', () => {
        expect(applySecuritySettings(config, {
            EnableSecurityHeaders: 'on',
            ContentSecurityPolicyMode: 'Enforce',
            AuthenticationRateLimitPerMinute: '0'
        })).toEqual({
            ServerName: 'Siren',
            EnableSecurityHeaders: true,
            ContentSecurityPolicyMode: 'Enforce',
            AuthenticationRateLimitPerMinute: 0
        });
    });

    it('reads an absent switch as off', () => {
        expect(applySecuritySettings(config, {
            ContentSecurityPolicyMode: 'Off',
            AuthenticationRateLimitPerMinute: '5'
        })).toMatchObject({
            EnableSecurityHeaders: false,
            ContentSecurityPolicyMode: 'Off',
            AuthenticationRateLimitPerMinute: 5
        });
    });

    it('keeps the current limit and mode when the submitted ones are empty or invalid', () => {
        expect(applySecuritySettings(config, {
            EnableSecurityHeaders: 'on',
            ContentSecurityPolicyMode: 'Strict',
            AuthenticationRateLimitPerMinute: ''
        })).toMatchObject({
            ContentSecurityPolicyMode: 'ReportOnly',
            AuthenticationRateLimitPerMinute: 10
        });

        expect(applySecuritySettings(config, {
            AuthenticationRateLimitPerMinute: '-3'
        }).AuthenticationRateLimitPerMinute).toBe(10);
    });
});
