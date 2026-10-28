/**
 * The few API calls the global setup needs: finishing the startup wizard, signing in as the
 * administrator and creating the family the tests use. Plain fetch, no SDK, so the harness does
 * not depend on the client code under test.
 */

import { ADMIN, BASE_URL, FAMILY } from './config';

/** The client identification every request carries; the server refuses requests without it. */
const CLIENT_AUTH = 'MediaBrowser Client="Siren e2e", Device="Playwright", DeviceId="siren-e2e", Version="0.0.0"';

const request = async <T = unknown>(method: string, route: string, body?: unknown, token?: string): Promise<T> => {
    const response = await fetch(`${BASE_URL}${route}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            Authorization: token ? `${CLIENT_AUTH}, Token="${token}"` : CLIENT_AUTH
        },
        body: body === undefined ? undefined : JSON.stringify(body)
    });

    if (!response.ok) {
        const text = await response.text().catch(() => '');
        const detail = text ? `: ${text}` : '';
        throw new Error(`[e2e] ${method} ${route} answered ${response.status}${detail}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
        return response.json() as Promise<T>;
    }
    return undefined as T;
};

/**
 * Walks the startup wizard the way the web client does. The UI culture is set to en-US so the
 * tests can assert English strings whatever the machine's language is.
 */
export async function completeWizard(): Promise<void> {
    await request('POST', '/Startup/Configuration', {
        ServerName: 'Siren e2e',
        UICulture: 'en-US',
        MetadataCountryCode: 'US',
        PreferredMetadataLanguage: 'en'
    });
    // The wizard reads the first user before it names it; the server expects the same order.
    await request('GET', '/Startup/User');
    await request('POST', '/Startup/User', { Name: ADMIN.name, Password: ADMIN.password });
    await request('POST', '/Startup/RemoteAccess', { EnableRemoteAccess: false });
    await request('POST', '/Startup/Complete');
}

interface AuthenticationResult {
    AccessToken: string
    User: { Id: string }
}

/** One of the ten authentications a minute the server allows per address; the tests spend the rest. */
export async function authenticateAdmin(): Promise<string> {
    const result = await request<AuthenticationResult>('POST', '/Users/AuthenticateByName', {
        Username: ADMIN.name,
        Pw: ADMIN.password
    });
    return result.AccessToken;
}

interface FamilyDto {
    Id: string
    Name: string
}

/** Creates the family with its administrator profile (PIN) and a profile without one. */
export async function createFamily(token: string): Promise<FamilyDto> {
    const family = await request<FamilyDto>('POST', '/Families', { Name: FAMILY.name }, token);

    await request('POST', `/Families/${family.Id}/Members`, {
        Name: FAMILY.admin.name,
        Password: FAMILY.admin.pin,
        IsFamilyAdministrator: true
    }, token);
    await request('POST', `/Families/${family.Id}/Members`, {
        Name: FAMILY.child.name,
        IsFamilyAdministrator: false
    }, token);

    return family;
}
