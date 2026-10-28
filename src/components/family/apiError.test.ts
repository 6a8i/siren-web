import { AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { describe, expect, it } from 'vitest';

import { getApiErrorMessage } from './apiError';

const FALLBACK = 'Something went wrong';

/** An error the way axios raises one for a rejected request, with the given response body. */
function axiosErrorWith(data: unknown): AxiosError {
    const response = { data, status: 400, statusText: 'Bad Request', headers: {}, config: {} } as AxiosResponse;
    return new AxiosError('Request failed', AxiosError.ERR_BAD_REQUEST, {} as InternalAxiosRequestConfig, undefined, response);
}

describe('getApiErrorMessage()', () => {
    it('returns the plain-text reason the server answered with', () => {
        expect(getApiErrorMessage(axiosErrorWith('The family is full'), FALLBACK)).toBe('The family is full');
    });

    it('ignores a blank text body', () => {
        expect(getApiErrorMessage(axiosErrorWith('   '), FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage(axiosErrorWith(''), FALLBACK)).toBe(FALLBACK);
    });

    it('prefers the detail of a problem details body, then its title', () => {
        expect(getApiErrorMessage(axiosErrorWith({ title: 'Conflict', detail: 'Name taken' }), FALLBACK)).toBe('Name taken');
        expect(getApiErrorMessage(axiosErrorWith({ title: 'Conflict' }), FALLBACK)).toBe('Conflict');
    });

    it('falls back when the body has nothing to show', () => {
        expect(getApiErrorMessage(axiosErrorWith({ detail: '', title: '' }), FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage(axiosErrorWith({ errors: {} }), FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage(axiosErrorWith(undefined), FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage(new AxiosError('Network Error', AxiosError.ERR_NETWORK), FALLBACK)).toBe(FALLBACK);
    });

    it('falls back for anything that is not an axios error', () => {
        expect(getApiErrorMessage(new Error('boom'), FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage('The family is full', FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage({ response: { data: 'The family is full' } }, FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage(undefined, FALLBACK)).toBe(FALLBACK);
        expect(getApiErrorMessage(null, FALLBACK)).toBe(FALLBACK);
    });
});
