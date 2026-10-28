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
    FamilyDto,
    FamilyMemberPasswordRequest,
    SirenUserDto,
    UpdateFamilyMemberRequest,
    UpdateFamilyRequest
} from 'types/family';

const withAuth = (api: Api, options?: AxiosRequestConfig): AxiosRequestConfig => ({
    signal: options?.signal,
    headers: { Authorization: api.authorizationHeader }
});

const familiesUrl = (api: Api, path = '') => `${api.basePath}/Families${path}`;

const memberUrl = (api: Api, familyId: string, userId: string, path = '') => (
    familiesUrl(api, `/${encodeURIComponent(familyId)}/Members/${encodeURIComponent(userId)}${path}`)
);

export const getFamilies = (api: Api, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDto[]>(familiesUrl(api), withAuth(api, options))
);

export const getFamily = (api: Api, familyId: string, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDto>(familiesUrl(api, `/${encodeURIComponent(familyId)}`), withAuth(api, options))
);

export const getMyFamily = (api: Api, options?: AxiosRequestConfig) => (
    api.axiosInstance.get<FamilyDto>(familiesUrl(api, '/Mine'), withAuth(api, options))
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
    api.axiosInstance.get<SirenUserDto[]>(familiesUrl(api, `/${encodeURIComponent(familyId)}/Members`), withAuth(api, options))
);

export const createFamilyMember = (api: Api, familyId: string, body: CreateFamilyMemberRequest) => (
    api.axiosInstance.post<SirenUserDto>(familiesUrl(api, `/${encodeURIComponent(familyId)}/Members`), body, withAuth(api))
);

/** Moves an existing user (without a family, not a server administrator) into the family. */
export const linkFamilyMember = (api: Api, familyId: string, userId: string) => (
    api.axiosInstance.put<void>(memberUrl(api, familyId, userId), undefined, withAuth(api))
);

export const updateFamilyMember = (api: Api, familyId: string, userId: string, body: UpdateFamilyMemberRequest) => (
    api.axiosInstance.post<void>(memberUrl(api, familyId, userId), body, withAuth(api))
);

export const setFamilyMemberPassword = (api: Api, familyId: string, userId: string, body: FamilyMemberPasswordRequest) => (
    api.axiosInstance.post<void>(memberUrl(api, familyId, userId, '/Password'), body, withAuth(api))
);

export const removeFamilyMember = (api: Api, familyId: string, userId: string, deleteUser: boolean) => (
    api.axiosInstance.delete<void>(memberUrl(api, familyId, userId, `?deleteUser=${deleteUser}`), withAuth(api))
);

export const switchFamilyMember = (api: Api, familyId: string, userId: string, pw = '') => (
    api.axiosInstance.post<AuthenticationResult>(memberUrl(api, familyId, userId, '/Switch'), { Pw: pw }, withAuth(api))
);
