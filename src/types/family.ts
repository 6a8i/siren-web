import type { UserDto, UserPolicy } from '@jellyfin/sdk/lib/generated-client';

/**
 * A family groups up to `MaxMembers` profiles that only see each other. Its administrators manage
 * the profiles without any access to the server dashboard.
 */
export interface FamilyDto {
    Id: string
    Name: string
    DateCreated: string
    MemberCount: number
    MaxMembers: number
}

/** The server-side cap; the real value comes with every FamilyDto. */
export const DEFAULT_MAX_FAMILY_MEMBERS = 6;

/** Siren adds family fields the generated SDK types do not know about. */
export type SirenUserPolicy = UserPolicy & {
    IsFamilyAdministrator?: boolean
};

export type SirenUserDto = UserDto & {
    FamilyId?: string | null
    Policy?: SirenUserPolicy
};

export const getFamilyId = (user?: UserDto | null): string | undefined => (
    (user as SirenUserDto | null | undefined)?.FamilyId || undefined
);

export const isFamilyAdministrator = (user?: UserDto | null): boolean => (
    !!(user?.Policy as SirenUserPolicy | null | undefined)?.IsFamilyAdministrator
);

export interface CreateFamilyRequest {
    Name: string
}

export interface UpdateFamilyRequest {
    Name: string
}

export interface CreateFamilyMemberRequest {
    Name: string
    Password?: string
    IsFamilyAdministrator?: boolean
    MaxParentalRating?: number | null
    EnableAllFolders?: boolean
    EnabledFolders?: string[]
}

/** A full replacement of the fields a family administrator may change. */
export interface UpdateFamilyMemberRequest {
    Name: string
    IsFamilyAdministrator: boolean
    IsDisabled: boolean
    MaxParentalRating: number | null
    EnableAllFolders: boolean
    EnabledFolders: string[]
}

export interface FamilyMemberPasswordRequest {
    NewPassword?: string
    ResetPassword?: boolean
}

/** The update request that leaves a member exactly as it is, to change one field from. */
export const toUpdateFamilyMemberRequest = (member: SirenUserDto): UpdateFamilyMemberRequest => ({
    Name: member.Name ?? '',
    IsFamilyAdministrator: !!member.Policy?.IsFamilyAdministrator,
    IsDisabled: !!member.Policy?.IsDisabled,
    MaxParentalRating: member.Policy?.MaxParentalRating ?? null,
    EnableAllFolders: member.Policy?.EnableAllFolders ?? true,
    EnabledFolders: member.Policy?.EnabledFolders ?? []
});
