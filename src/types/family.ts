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
    /** The family reaches every library on the server. */
    EnableAllFolders: boolean
    /** The libraries the family reaches when `EnableAllFolders` is false. */
    EnabledFolders: string[]
}

/** The server-side cap; the real value comes with every FamilyDto. */
export const DEFAULT_MAX_FAMILY_MEMBERS = 6;

/** Siren adds family fields the generated SDK types do not know about. */
export type SirenUserPolicy = UserPolicy & {
    IsFamilyAdministrator?: boolean
    /** A child's profile: fixed home sections, no search, cast or settings, and an administrator's PIN to sign out. */
    IsChildProfile?: boolean
};

export type SirenUserDto = UserDto & {
    FamilyId?: string | null
    Policy?: SirenUserPolicy
};

/** A profile as the family endpoints return it: the user plus what the family pages need to know. */
export type FamilyMemberDto = SirenUserDto & {
    /** The profile asks for a PIN when switching to it. */
    HasPin: boolean
    /**
     * Locked for a while after too many wrong PIN attempts: true while `LockedOutUntil` is in the
     * future. An administrator unlocks it sooner.
     */
    IsLockedOut: boolean
    /** When the lockout ends (ISO 8601, UTC); absent when the profile is not locked. */
    LockedOutUntil?: string | null
    /** The profile reaches every library the family reaches. */
    HasAllFamilyFolders: boolean
};

/** A library the family reaches, by name, whether or not the caller can access it. */
export interface FamilyLibraryDto {
    Id: string
    Name: string
    CollectionType?: string | null
}

export const getFamilyId = (user?: UserDto | null): string | undefined => (
    (user as SirenUserDto | null | undefined)?.FamilyId || undefined
);

export const isFamilyAdministrator = (user?: UserDto | null): boolean => (
    !!(user?.Policy as SirenUserPolicy | null | undefined)?.IsFamilyAdministrator
);

export const isChildProfile = (user?: UserDto | null): boolean => (
    !!(user?.Policy as SirenUserPolicy | null | undefined)?.IsChildProfile
);

/** One item a profile played, newest first, as `GET /Families/{id}/Members/{userId}/History` returns it. */
export interface FamilyHistoryEntryDto {
    ItemId: string
    Name: string
    SeriesName?: string | null
    SeasonName?: string | null
    /** The item kind (Movie, Episode, Audio, ...). */
    Type: string
    /** When it was last played (ISO 8601, UTC). */
    Date: string
    PlayedPercentage?: number | null
    Completed: boolean
    /** The primary image tag, when the item has one. */
    ImageTag?: string | null
}

/** A device signed in as one of the family's profiles, as `GET /Families/{id}/Devices` returns it. */
export interface FamilyDeviceDto {
    Id: string
    Name: string
    AppName: string
    AppVersion: string
    UserId: string
    UserName: string
    DateLastActivity: string
    /** The device the caller is using right now; it cannot be disconnected from here. */
    IsCurrent: boolean
}

export interface CreateFamilyRequest {
    Name: string
}

/** Only server administrators may send the library fields. */
export interface UpdateFamilyRequest {
    Name?: string
    EnableAllFolders?: boolean
    EnabledFolders?: string[]
}

export interface CreateFamilyMemberRequest {
    Name: string
    Password?: string
    IsFamilyAdministrator?: boolean
    /** A child profile cannot be a family administrator (the server answers 400). */
    IsChildProfile?: boolean
    MaxParentalRating?: number | null
    /** All of the family's libraries. */
    EnableAllFolders?: boolean
    /** Capped by the server to the libraries the family reaches. */
    EnabledFolders?: string[]
}

/** A full replacement of the fields a family administrator may change. */
export interface UpdateFamilyMemberRequest {
    Name: string
    IsFamilyAdministrator: boolean
    /** A child profile cannot be a family administrator (the server answers 400). */
    IsChildProfile: boolean
    /** `false` also unlocks a locked-out profile. */
    IsDisabled: boolean
    MaxParentalRating: number | null
    /** All of the family's libraries. */
    EnableAllFolders: boolean
    /** Capped by the server to the libraries the family reaches. */
    EnabledFolders: string[]
}

export interface FamilyMemberPasswordRequest {
    NewPassword?: string
    ResetPassword?: boolean
}

/** The update request that leaves a member exactly as it is, to change one field from. */
export const toUpdateFamilyMemberRequest = (member: FamilyMemberDto): UpdateFamilyMemberRequest => ({
    Name: member.Name ?? '',
    IsFamilyAdministrator: !!member.Policy?.IsFamilyAdministrator,
    IsChildProfile: !!member.Policy?.IsChildProfile,
    IsDisabled: !!member.Policy?.IsDisabled,
    MaxParentalRating: member.Policy?.MaxParentalRating ?? null,
    EnableAllFolders: member.HasAllFamilyFolders,
    EnabledFolders: member.Policy?.EnabledFolders ?? []
});

/** A library a profile may be granted, as any of the library listings returns it. */
export interface LibraryOption {
    Id?: string | null
    Name?: string | null
}

/** An image for the member image endpoints: the base64 payload and its media type. */
export interface ImageUpload {
    contentType: string
    data: string
}
