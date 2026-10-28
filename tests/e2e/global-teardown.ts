import { ENV_DATA_DIR, ENV_SERVER_PID } from './harness/config';
import { stopServer } from './harness/server';

/** Kills the throwaway server and deletes its data directory. */
export default async function globalTeardown(): Promise<void> {
    const pid = process.env[ENV_SERVER_PID];
    const dataDir = process.env[ENV_DATA_DIR];

    await stopServer(pid ? Number.parseInt(pid, 10) : undefined, dataDir);
    console.log('[e2e] server stopped and data directory removed');
}
