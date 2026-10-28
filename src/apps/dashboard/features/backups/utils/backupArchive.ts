/**
 * The server names the archives it writes `jellyfin-backup-<timestamp>.zip`; the scheduled task
 * renames its own to `jellyfin-backup-scheduled-<timestamp>.zip` so the retention can tell them
 * apart. The list shows that difference and restores either by its path.
 */

export const SCHEDULED_BACKUP_PREFIX = 'jellyfin-backup-scheduled-';

/** The archive's file name, whatever the server's path separator. */
export const getBackupFileName = (path?: string | null): string => {
    if (!path) return '';
    const separator = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
    return separator >= 0 ? path.slice(separator + 1) : path;
};

export const isScheduledBackup = (path?: string | null): boolean => (
    getBackupFileName(path).startsWith(SCHEDULED_BACKUP_PREFIX)
);
