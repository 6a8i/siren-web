import { isAxiosError } from 'axios';

/**
 * The family endpoints answer a rejected request with a plain-text reason (family full, name taken).
 * Shows it when there is one, otherwise the fallback.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
    if (isAxiosError(error)) {
        const data: unknown = error.response?.data;
        if (typeof data === 'string' && data.trim()) {
            return data;
        }

        if (data && typeof data === 'object') {
            const problem = data as { detail?: string, title?: string };
            if (problem.detail) return problem.detail;
            if (problem.title) return problem.title;
        }
    }

    return fallback;
}
