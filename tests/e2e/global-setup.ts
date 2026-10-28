import fs from 'node:fs';
import path from 'node:path';

import { authenticateAdmin, completeWizard, createFamily } from './harness/api';
import { ADMIN_STATE, ENV_DATA_DIR, ENV_SERVER_PID } from './harness/config';
import { startServer, stopServer } from './harness/server';

/**
 * Starts the throwaway server, finishes its wizard and seeds the family. The process id and the
 * data directory go to the environment, which Playwright shares with the teardown and the workers.
 */
export default async function globalSetup(): Promise<void> {
    const server = await startServer();
    process.env[ENV_SERVER_PID] = String(server.process.pid);
    process.env[ENV_DATA_DIR] = server.dataDir;

    try {
        await completeWizard();
        const token = await authenticateAdmin();
        const family = await createFamily(token);
        console.log(`[e2e] wizard done, family "${family.Name}" created`);
    } catch (err) {
        await stopServer(server.process.pid, server.dataDir);
        throw err;
    }

    // A stale state from a previous run would carry a token the new server does not know.
    fs.rmSync(path.dirname(ADMIN_STATE), { recursive: true, force: true });
}
