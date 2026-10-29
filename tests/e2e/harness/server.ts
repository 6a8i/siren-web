/**
 * Starts and stops a throwaway Siren server for the end-to-end suite. Nothing is read from or
 * written to the user's own data directory: the server gets a fresh temporary one, listens on its
 * own port and is deleted with its data when the run ends.
 */

import { type ChildProcess, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { AUTH_RATE_LIMIT, BASE_URL, DIST_DIR, E2E_PORT, FFMPEG, SERVER_DLL } from './config';

const READY_TIMEOUT_MS = 180_000;
const READY_POLL_MS = 500;

/** The .NET host; DOTNET points at a specific installation when the one on PATH is not wanted. */
const DOTNET = process.env.DOTNET ?? 'dotnet';

export interface RunningServer {
    process: ChildProcess
    dataDir: string
    logFile: string
}

/** The server this process started; the teardown runs in the same process and awaits its exit. */
let running: RunningServer | undefined;

/** The network.xml the server reads on its first start, so it never touches port 8096. */
const networkConfiguration = (port: number) => `<?xml version="1.0" encoding="utf-8"?>
<NetworkConfiguration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <InternalHttpPort>${port}</InternalHttpPort>
  <PublicHttpPort>${port}</PublicHttpPort>
  <AutoDiscovery>false</AutoDiscovery>
  <EnableUPnP>false</EnableUPnP>
</NetworkConfiguration>
`;

/**
 * The system.xml the server reads on its first start, with the authentication rate limit the suite
 * needs. It has to be there before the first authentication: the limiter keeps the limit an address
 * started its window with, so a value set through the API after the setup's own login would only
 * apply once the address had been quiet for a minute. Every other setting keeps its default.
 */
const systemConfiguration = (authenticationRateLimitPerMinute: number) => `<?xml version="1.0" encoding="utf-8"?>
<ServerConfiguration xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <AuthenticationRateLimitPerMinute>${authenticationRateLimitPerMinute}</AuthenticationRateLimitPerMinute>
</ServerConfiguration>
`;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * While the server starts, a placeholder answers every route with a 503 page and even serves
 * /System/Info/Public itself, so being ready means both the public info and a route only the real
 * server has (/System/Ping) answer.
 */
const isReady = async () => {
    const info = await fetch(`${BASE_URL}/System/Info/Public`);
    if (!info.ok || !(info.headers.get('content-type') ?? '').includes('application/json')) {
        return false;
    }
    const ping = await fetch(`${BASE_URL}/System/Ping`);
    return ping.ok;
};

const tail = (file: string, lines = 40) => {
    try {
        return fs.readFileSync(file, 'utf8').split(/\r?\n/).slice(-lines).join('\n');
    } catch {
        return '(no server log)';
    }
};

/** Fails fast, with a message that says what is missing, before anything is started. */
export function checkPrerequisites(): void {
    const missing: string[] = [];

    if (!fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
        missing.push(`The production build is missing (${path.join(DIST_DIR, 'index.html')}). Run "npm run build:production" first.`);
    }
    if (!fs.existsSync(SERVER_DLL)) {
        missing.push(`The server binary is missing (${SERVER_DLL}). Build the server in Release or point SERVER_DLL at jellyfin.dll.`);
    }
    if (!fs.existsSync(FFMPEG)) {
        missing.push(`ffmpeg is missing (${FFMPEG}). Install it or point FFMPEG at the executable.`);
    }

    if (missing.length > 0) {
        throw new Error(`Cannot start the e2e server:\n- ${missing.join('\n- ')}`);
    }
}

export async function startServer(): Promise<RunningServer> {
    checkPrerequisites();

    const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'siren-e2e-'));
    fs.mkdirSync(path.join(dataDir, 'config'));
    fs.writeFileSync(path.join(dataDir, 'config', 'network.xml'), networkConfiguration(E2E_PORT));
    fs.writeFileSync(path.join(dataDir, 'config', 'system.xml'), systemConfiguration(AUTH_RATE_LIMIT));

    const logFile = path.join(dataDir, 'server.stdout.log');
    const logFd = fs.openSync(logFile, 'a');

    const child = spawn(DOTNET, [
        SERVER_DLL,
        '--datadir', dataDir,
        '--webdir', DIST_DIR,
        '--ffmpeg', FFMPEG,
        '--nonetchange'
    ], {
        // Inherits JELLYFIN_FFMPEG__NOVALIDATION and the like from the caller.
        env: process.env,
        stdio: [ 'ignore', logFd, logFd ],
        windowsHide: true
    });
    fs.closeSync(logFd);

    let exited: string | undefined;
    child.once('exit', (code, signal) => {
        const bySignal = signal ? `, signal ${signal}` : '';
        exited = `exit code ${code ?? 'null'}${bySignal}`;
    });

    console.log(`[e2e] starting Siren on ${BASE_URL} with data in ${dataDir} (pid ${child.pid})`);

    const deadline = Date.now() + READY_TIMEOUT_MS;
    while (Date.now() < deadline) {
        if (exited) {
            throw new Error(`[e2e] the server stopped before it was ready (${exited}). Last log lines:\n${tail(logFile)}`);
        }

        try {
            if (await isReady()) {
                console.log('[e2e] server is up');
                running = { process: child, dataDir, logFile };
                return running;
            }
        } catch {
            // Not listening yet.
        }

        await sleep(READY_POLL_MS);
    }

    running = { process: child, dataDir, logFile };
    await stopServer(child.pid, dataDir);
    throw new Error(`[e2e] the server did not answer on ${BASE_URL} within ${READY_TIMEOUT_MS / 1000}s. Last log lines:\n${tail(logFile)}`);
}

const isRunning = (pid: number) => {
    try {
        process.kill(pid, 0);
        return true;
    } catch {
        return false;
    }
};

const hasExited = (child: ChildProcess) => child.exitCode !== null || child.signalCode !== null;

const waitForExit = (child: ChildProcess, timeoutMs: number) => new Promise<void>(resolve => {
    if (hasExited(child)) {
        resolve();
        return;
    }
    const timer = setTimeout(resolve, timeoutMs);
    child.once('exit', () => {
        clearTimeout(timer);
        resolve();
    });
});

/** Windows keeps the files of a killed process locked for a moment; retry instead of leaving them behind. */
const removeDirectory = async (dir: string) => {
    const transient = new Set([ 'EPERM', 'EBUSY', 'ENOTEMPTY' ]);
    for (let attempt = 1; ; attempt++) {
        try {
            fs.rmSync(dir, { recursive: true, force: true });
            return;
        } catch (err) {
            const code = (err as NodeJS.ErrnoException).code ?? '';
            if (attempt >= 40 || !transient.has(code)) {
                throw err;
            }
            await sleep(500);
        }
    }
};

/** Kills the server (and, on Windows, its child processes) and deletes its data directory. */
export async function stopServer(pid: number | undefined, dataDir: string | undefined): Promise<void> {
    const child = running?.process;
    running = undefined;

    if (pid && isRunning(pid)) {
        if (process.platform === 'win32') {
            const taskkill = path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'taskkill.exe');
            spawnSync(taskkill, [ '/pid', String(pid), '/T', '/F' ], { stdio: 'ignore', windowsHide: true });
        } else {
            process.kill(pid, 'SIGTERM');
        }

        if (child) {
            await waitForExit(child, 15_000);
        }
        const deadline = Date.now() + 15_000;
        while (isRunning(pid) && Date.now() < deadline) {
            await sleep(200);
        }
        if (isRunning(pid) && process.platform !== 'win32') {
            process.kill(pid, 'SIGKILL');
        }
    }

    if (dataDir && fs.existsSync(dataDir)) {
        await removeDirectory(dataDir);
    }
}
