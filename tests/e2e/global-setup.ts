import fs from 'node:fs';
import path from 'node:path';

import {
    authenticateAdmin,
    completeWizard,
    createFamily,
    createLibrary,
    supportsReadOnlyKeys
} from './harness/api';
import {
    ADMIN_STATE,
    ENV_DATA_DIR,
    ENV_FAMILY_ID,
    ENV_READONLY_KEYS,
    ENV_SERVER_PID,
    LIBRARIES
} from './harness/config';
import { startServer, stopServer } from './harness/server';

/**
 * Starts the throwaway server, finishes its wizard and seeds the family and two empty libraries.
 * The process id, the data directory and what the specs need to know go to the environment, which
 * Playwright shares with the teardown and the workers.
 */
export default async function globalSetup(): Promise<void> {
    const server = await startServer();
    process.env[ENV_SERVER_PID] = String(server.process.pid);
    process.env[ENV_DATA_DIR] = server.dataDir;

    try {
        await completeWizard();
        const token = await authenticateAdmin();

        const family = await createFamily(token);
        process.env[ENV_FAMILY_ID] = family.Id;

        for (const name of Object.values(LIBRARIES)) {
            const folder = path.join(server.dataDir, 'media', name);
            fs.mkdirSync(folder, { recursive: true });
            await createLibrary(token, name, folder);
        }

        process.env[ENV_READONLY_KEYS] = await supportsReadOnlyKeys(token) ? '1' : '0';
        console.log(`[e2e] wizard done, family "${family.Name}" and ${Object.keys(LIBRARIES).length} libraries created`
            + ` (read-only keys: ${process.env[ENV_READONLY_KEYS] === '1' ? 'yes' : 'no'})`);
    } catch (err) {
        await stopServer(server.process.pid, server.dataDir);
        throw err;
    }

    // A stale state from a previous run would carry a token the new server does not know.
    fs.rmSync(path.dirname(ADMIN_STATE), { recursive: true, force: true });
}
