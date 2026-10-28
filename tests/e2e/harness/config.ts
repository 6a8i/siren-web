/**
 * Everything the harness and the tests share: where the throwaway server runs, how to reach it and
 * the accounts the global setup creates on it. The Playwright config imports this file too, so it
 * must stay free of side effects.
 */

import path from 'node:path';

/** Port the throwaway server listens on; the user's own instance keeps 8096. */
export const E2E_PORT = Number.parseInt(process.env.E2E_PORT ?? '8097', 10);

export const BASE_URL = `http://127.0.0.1:${E2E_PORT}`;

export const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

/** The production build the server serves; the integrator builds it before running the suite. */
export const DIST_DIR = path.join(REPO_ROOT, 'dist');

export const SERVER_DLL = process.env.SERVER_DLL
    ?? 'C:\\Repositories\\siren\\Jellyfin.Server\\bin\\Release\\net10.0\\jellyfin.dll';

export const FFMPEG = process.env.FFMPEG
    ?? 'C:\\Users\\arime\\AppData\\Local\\Microsoft\\WinGet\\Packages\\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\\ffmpeg-9.0.2-full_build\\bin\\ffmpeg.exe';

/** The server administrator the wizard creates; the server lives for one run, so the secret is none. */
// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- throwaway account on a throwaway server
export const ADMIN = { name: 'e2e', password: 'e2e-pass' };

/** The family the global setup creates: an administrator profile with a PIN and a plain one without. */
export const FAMILY = {
    name: 'Silva',
    admin: { name: 'pai', pin: '1234' },
    child: { name: 'filho' }
};

/** Where the setup project saves the signed-in administrator's browser state (git-ignored). */
export const ADMIN_STATE = path.join(REPO_ROOT, 'tests', 'e2e', '.auth', 'admin.json');

/** Environment variables the global setup hands to the workers and the teardown. */
export const ENV_SERVER_PID = 'SIREN_E2E_SERVER_PID';
export const ENV_DATA_DIR = 'SIREN_E2E_DATA_DIR';
