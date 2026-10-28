import { describe, expect, it } from 'vitest';

import { getBackupFileName, isScheduledBackup } from './backupArchive';

describe('backupArchive', () => {
    it('takes the file name off a Windows or POSIX path', () => {
        expect(getBackupFileName('C:\\data\\backups\\jellyfin-backup-20261028120000.zip')).toBe('jellyfin-backup-20261028120000.zip');
        expect(getBackupFileName('/var/lib/siren/backups/jellyfin-backup-20261028120000.zip')).toBe('jellyfin-backup-20261028120000.zip');
        expect(getBackupFileName('jellyfin-backup-20261028120000.zip')).toBe('jellyfin-backup-20261028120000.zip');
        expect(getBackupFileName()).toBe('');
    });

    it('tells a scheduled archive by its prefix', () => {
        expect(isScheduledBackup('/backups/jellyfin-backup-scheduled-20261028120000.zip')).toBe(true);
        expect(isScheduledBackup('/backups/jellyfin-backup-20261028120000.zip')).toBe(false);
        expect(isScheduledBackup(null)).toBe(false);
    });
});
