/**
 * The family endpoints are Siren's own, so the generated SDK has no client for them. These calls
 * go through the SDK's axios instance with the same authorization header its generated APIs use.
 */

import type { Api } from '@jellyfin/sdk';
import type { AuthenticationResult } from '@jellyfin/sdk/lib/generated-client';
import type { AxiosRequestConfig } from 'axios';

import type {
    CreateFamilyMemberRequest,
    CreateFamilyRequest,
    FamilyDeviceDto,
    FamilyDto,
    FamilyHistoryEntryDto,
    FamilyLibraryDto,
    FamilyMemberDto,
    FamilyMemberPasswordRequest,
    UpdateFamilyMemberRequest,
    UpdateFamilyRequest
} from 'types/family';

const withAuth = (api: Api, options?: AxiosRequestConfig): AxiosRequestConfig => ({
    signal: options?.signal,
    headers: { Authorization: api.authorizationHeader }
});

/** An image upload takes the convention of `POST /UserImage`: the body is the base64 payload, the content type the image's. */
const withImage = (api: Api, contentType: string): AxiosRequestConfig => ({
    headers: { Authorization: api.authorizationHeader, 'Content-Type': contentType }
});

const familiesUrl = (api: Api, path = '') => `${api.basePath}/Families${path}`;

const memberUrl = (api: Api, familyId: string, userId: string, path = '') => (
    familiesUrl(api, `/${encodeURIComponent(familyId)}/Members/${encodeURIComponent(userId)}${path}`)
);

const userImageUrl = (api: Api, userId: string) => `${api.basePath}/UserImage?userId=${encodeURIComponent(userId)}`;

export const getFamilies = (api: Api, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDto[]>(familiesUrl(api), withAuth(api, options))
);

export const getFamily = (api: Api, familyId: string, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDto>(familiesUrl(api, `/${encodeURIComponent(familyId)}`), withAuth(api, options))
);

export const getMyFamily = (api: Api, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDto>(familiesUrl(api, '/Mine'), withAuth(api, options))
);

/** The libraries the family reaches, by name, including ones the caller cannot access. */
export const getFamilyLibraries = (api: Api, familyId: string, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyLibraryDto[]>(familiesUrl(api, `/${encodeURIComponent(familyId)}/Libraries`), withAuth(api, options))
);

export const createFamily = (api: Api, body: CreateFamilyRequest) => (
    api.axiosInstance.post<FamilyDto>(familiesUrl(api), body, withAuth(api))
);

export const updateFamily = (api: Api, familyId: string, body: UpdateFamilyRequest) => (
    api.axiosInstance.post<void>(familiesUrl(api, `/${encodeURIComponent(familyId)}`), body, withAuth(api))
);

export const deleteFamily = (api: Api, familyId: string, deleteMembers: boolean) => (
    api.axiosInstance.delete<void>(
        familiesUrl(api, `/${encodeURIComponent(familyId)}?deleteMembers=${deleteMembers}`),
        withAuth(api)
    )
);

export const getFamilyMembers = (api: Api, familyId: string, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyMemberDto[]>(familiesUrl(api, `/${encodeURIComponent(familyId)}/Members`), withAuth(api, options))
);

export const createFamilyMember = (api: Api, familyId: string, body: CreateFamilyMemberRequest) => (
    api.axiosInstance.post<FamilyMemberDto>(familiesUrl(api, `/${encodeURIComponent(familyId)}/Members`), body, withAuth(api))
);

/** Moves an existing user (without a family, not a server administrator) into the family. */
export const linkFamilyMember = (api: Api, familyId: string, userId: string) => (
    api.axiosInstance.put<void>(memberUrl(api, familyId, userId), undefined, withAuth(api))
);

export const updateFamilyMember = (api: Api, familyId: string, userId: string, body: UpdateFamilyMemberRequest) => (
    api.axiosInstance.post<void>(memberUrl(api, familyId, userId), body, withAuth(api))
);

/** Ends a PIN lockout before its time; the member update with `IsDisabled: false` does the same. */
export const unlockFamilyMember = (api: Api, familyId: string, userId: string) => (
    api.axiosInstance.post<void>(memberUrl(api, familyId, userId, '/Unlock'), undefined, withAuth(api))
);

export const setFamilyMemberPassword = (api: Api, familyId: string, userId: string, body: FamilyMemberPasswordRequest) => (
    api.axiosInstance.post<void>(memberUrl(api, familyId, userId, '/Password'), body, withAuth(api))
);

export const removeFamilyMember = (api: Api, familyId: string, userId: string, deleteUser: boolean) => (
    api.axiosInstance.delete<void>(memberUrl(api, familyId, userId, `?deleteUser=${deleteUser}`), withAuth(api))
);

/** The last items a member played, newest first: the member, a family administrator or a server administrator. */
export const getFamilyHistory = (api: Api, familyId: string, userId: string, limit = 50, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyHistoryEntryDto[]>(memberUrl(api, familyId, userId, `/History?limit=${limit}`), withAuth(api, options))
);

/** The devices signed in as the family's profiles (family or server administrator). */
export const getFamilyDevices = (api: Api, familyId: string, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDeviceDto[]>(familiesUrl(api, `/${encodeURIComponent(familyId)}/Devices`), withAuth(api, options))
);

/** Signs a device out of the family profile it is using; the caller's own device answers 400. */
export const disconnectFamilyDevice = (api: Api, familyId: string, deviceId: string) => (
    api.axiosInstance.delete<void>(
        familiesUrl(api, `/${encodeURIComponent(familyId)}/Devices/${encodeURIComponent(deviceId)}`),
        withAuth(api)
    )
);

/**
 * Checks a family administrator's PIN without switching to them: Jellyfin's own login endpoint
 * answers 200 with a token (discarded), 401 for a wrong PIN and 403 for a locked or disabled profile.
 */
export const verifyFamilyAdminPin = (api: Api, username: string, pin: string) => (
    api.axiosInstance.post<AuthenticationResult>(
        `${api.basePath}/Users/AuthenticateByName`,
        { Username: username, Pw: pin },
        withAuth(api)
    )
);

export const switchFamilyMember = (api: Api, familyId: string, userId: string, pw = '') => (
    api.axiosInstance.post<AuthenticationResult>(memberUrl(api, familyId, userId, '/Switch'), { Pw: pw }, withAuth(api))
);

/** Sets a member's profile image: server administrator, family administrator or the member themselves. */
export const setFamilyMemberImage = (api: Api, familyId: string, userId: string, base64: string, contentType: string) => (
    api.axiosInstance.post<void>(memberUrl(api, familyId, userId, '/Image'), base64, withImage(api, contentType))
);

export const deleteFamilyMemberImage = (api: Api, familyId: string, userId: string) => (
    api.axiosInstance.delete<void>(memberUrl(api, familyId, userId, '/Image'), withAuth(api))
);

/** Jellyfin's own endpoint for one's own image: the fallback when the member image endpoint is not there. */
export const setUserImage = (api: Api, userId: string, base64: string, contentType: string) => (
    api.axiosInstance.post<void>(userImageUrl(api, userId), base64, withImage(api, contentType))
);

export const deleteUserImage = (api: Api, userId: string) => (
    api.axiosInstance.delete<void>(userImageUrl(api, userId), withAuth(api))
);
