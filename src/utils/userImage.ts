import type { Api } from '@jellyfin/sdk';

/**
 * The URL of a user's primary image, the way the app builds it everywhere: the image tag keeps the
 * browser cache honest after an upload. Undefined when the user has no image (or there is no api).
 */
export function getUserImageUrl(
    api: Api | undefined,
    userId?: string | null,
    tag?: string | null,
    maxWidth?: number
): string | undefined {
    if (!api || !userId || !tag) return undefined;

    const size = maxWidth ? `&maxWidth=${maxWidth}` : '';
    return `${api.basePath}/Users/${encodeURIComponent(userId)}/Images/Primary?tag=${encodeURIComponent(tag)}${size}`;
}
