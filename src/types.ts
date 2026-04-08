/**
 * Network type
 */
export type Network = 'devnet' | 'mainnet' | 'dev' | 'main';

/**
 * Credential provider types
 */
export type CredentialProvider = 'GOOGLE' | 'LINKEDIN' | 'GITHUB' | 'DISCORD' | 'TWITTER' | 'REDDIT';

/**
 * KYC Status
 */
export type KYCStatus = 'TO_DO' | 'IN_REVIEW' | 'SUCCESSFUL' | 'REJECTED' | 'BLOCKED' | 'EXPIRED' | 'APPROVED';

/**
 * Freshness status
 */
export type FreshnessStatus = 'FRESH' | 'MODERATE' | 'STALE' | 'REVOKED';

/**
 * Verification status
 */
export type VerificationStatus = 'strong' | 'moderate' | 'weak' | 'archived' | 'revoked' | 'expired' | 'not_found';

/**
 * Verification color
 */
export type VerificationColor = 'green' | 'amber' | 'red';

/**
 * OAuth2 Token Response
 */
export interface TokenResponse {
    access_token: string;
    expires_in: number;
    refresh_expires_in: number;
    token_type: string;
    'not-before-policy': number;
    scope: string;
}

/**
 * Credential metadata (provider-specific)
 */
export interface CredentialMetadata {
    email?: string;
    firstName?: string;
    lastName?: string;
    username?: string;
    providerId?: string;
    verifiedAt?: string;
    emailVerified?: boolean;
    profilePicture?: string;
    [key: string]: any; // Allow additional provider-specific fields
}

/**
 * Credential object
 */
export interface Credential {
    partyId: string;
    /** Registered account email (`user.email`) for the credential owner. */
    email: string;
    contractId: string;
    provider: CredentialProvider;
    kycStatus: KYCStatus;
    expirationDate: string;
    issuedAt: string;
    freshness: FreshnessStatus;
    metadata: CredentialMetadata;
}

/**
 * Credentials list response with pagination
 */
export interface CredentialsListResponse {
    items: Credential[];
    pagination: {
        offset: number;
        limit: number;
        total: number;
    };
}

/**
 * Create credentials request body
 */
export interface CreateCredentialsRequest {
    partyId: string;
    providers: CredentialProvider[];
}

/**
 * Generate verification link request
 */
export interface GenerateVerificationLinkRequest {
    contractId: string;
}

/**
 * Generate verification link response
 */
export interface GenerateVerificationLinkResponse {
    verificationUrl: string;
    token: string;
}

/**
 * Batch verification link request item
 */
export interface BatchVerificationLinkRequestItem {
    contractId: string;
}

/**
 * Batch verification link request
 */
export interface BatchGenerateVerificationLinkRequest {
    requests: BatchVerificationLinkRequestItem[];
}

/**
 * Verification link error
 */
export interface VerificationLinkError {
    message: string;
    code?: string;
}

/**
 * Batch verification link result
 */
export interface BatchVerificationLinkResult {
    contractId: string;
    result?: GenerateVerificationLinkResponse;
    error?: VerificationLinkError;
}

/**
 * Batch verification link response
 */
export interface BatchGenerateVerificationLinkResponse {
    results: BatchVerificationLinkResult[];
}

/**
 * Verification status response
 */
export interface VerificationStatusResponse {
    status: VerificationStatus;
    color: VerificationColor;
    contractId: string | null;
    issuedAt: string | null;
    expiredAt: string | null;
    isActive: boolean;
    isArchived: boolean;
    isSuperseded: boolean;
    isRevoked: boolean;
    message: string | null;
    kycProvider: string | null;
    credentialData: CredentialMetadata | null;
}

/**
 * ID SDK configuration
 */
export interface IDSdkConfig {
    clientId: string;
    clientSecret: string;
    network?: Network;
    baseUrl?: string; // Optional override for base API URL
    tokenEndpoint?: string; // Optional override for token endpoint
}

/**
 * Pagination metadata (used by list endpoints)
 */
export interface Pagination {
    offset: number;
    limit: number;
    total: number;
}

/**
 * Get credentials options: pagination and/or filter by party IDs and/or registered user emails.
 * Maps to GET /institutions/me/credentials query parameters.
 */
export interface GetCredentialsOptions {
    offset?: number;
    limit?: number;
    /** When set, returns credentials for these party IDs only (institution users). */
    partyIds?: string[];
    /**
     * Registered account emails (repeated query param `emails`). Matches stored account email (`user.email`) only.
     * Combined with `partyIds` using OR when both are set. Query strings may be logged or cached by intermediaries.
     */
    emails?: string[];
}

/**
 * Institution user (from getUsers)
 */
export interface InstitutionUser {
    id: number;
    fullName?: string;
    email?: string;
    status?: string;
    kycStatus?: string;
    partyId?: string;
    proposalId: string;
    reqStatus: string;
    kycProvider: string;
    regDate?: string;
}

/**
 * Get users options (pagination and filters)
 */
export interface GetUsersOptions {
    offset?: number;
    limit?: number;
    orderBy?: string;
    orderType?: string;
    status?: string;
    reqStatus?: string;
    kycStatus?: string;
    search?: string;
}

/**
 * Users list response
 */
export interface UsersListResponse {
    items: InstitutionUser[];
    pagination: Pagination;
    totalCount?: number;
}

/**
 * Canonical human score response: `partyId`, `email`, nested `humanScore`.
 * Returned by getHumanScores / getHumanScoreByPartyId and matches GET /users/me/human-scores and public profile `humanScore`.
 */
export interface HumanScoreItem {
    partyId: string;
    /** Registered account email (`user.email`), same top-level convention as credential DTOs */
    email: string;
    humanScore: HumanScoreResult;
}

/**
 * Get human scores options: pagination and/or filter by party IDs and/or registered account emails.
 * Maps to GET /institutions/me/human-scores query parameters (same semantics as getCredentials).
 */
export interface GetHumanScoresOptions {
    offset?: number;
    limit?: number;
    /** When set, returns human scores for these party IDs only (institution users). */
    partyIds?: string[];
    /**
     * Registered account emails (repeated query param `emails`). Matches stored account email (`user.email`) only.
     * Combined with `partyIds` using OR when both are set.
     */
    emails?: string[];
}

/**
 * Human scores list response
 */
export interface HumanScoresListResponse {
    items: HumanScoreItem[];
    pagination: Pagination;
}

/**
 * Badge level
 */
export type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum';

/**
 * Confidence level
 */
export type ConfidenceLevel = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';

/**
 * Human score badge
 */
export interface HumanScoreBadge {
    id: string;
    name: string;
    description: string;
    level: BadgeLevel;
    category: string;
    icon?: string;
}

/**
 * Social account metrics
 */
export interface SocialAccountMetrics {
    provider: CredentialProvider;
    ageInDays: number;
    followersCount?: number;
    followingCount?: number;
    postsCount?: number;
    verified?: boolean;
    email?: string;
    accountCreatedAt?: string;
    githubRepos?: number;
    githubFollowers?: number;
    twitterDescription?: string;
    githubBio?: string;
    githubCompany?: string;
    githubLocation?: string;
    googleContactCount?: number;
}

/**
 * Human score result
 */
export interface HumanScoreResult {
    totalScore: number;
    confidenceLevel: ConfidenceLevel;
    breakdown: {
        accountAgeScore: number;
        socialMetricsScore: number;
        emailConsistencyScore: number;
        providerCountScore: number;
    };
    badges: HumanScoreBadge[];
    details: {
        accountAges: Array<{ provider: CredentialProvider; ageInDays: number }>;
        socialMetrics: SocialAccountMetrics[];
        emailConsistency: {
            uniqueEmails: string[];
            consistencyScore: number;
        };
        providerCount: number;
        allUserInfo: Record<string, any>[];
        allTokenClaims: Record<string, any>[];
    };
}

/**
 * Resolved credential (from resolve endpoint)
 */
export interface ResolvedCredential {
    partyId: string;
    userId: number;
    /** Registered account email (`user.email`). */
    email: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    kycProvider: CredentialProvider | 'SUMSUB';
    contractId: string;
    metadata?: Record<string, any>;
}

/**
 * Resolve credentials response
 */
export interface ResolveCredentialsResponse {
    credentials: ResolvedCredential[];
}

/**
 * Resolve credentials options.
 * Exactly one of `q` (forward), `partyId` (reverse), or `a` (alias/FQDN) must be provided.
 */
export interface ResolveCredentialsOptions {
    /**
     * Forward lookup: matches credential metadata (email, username, domain—e.g. DNS)
     * or the ID service account username (`user.username`; often the registration email).
     */
    q?: string;
    /**
     * Party ID for reverse lookup
     * Use this to find all credentials when you have a user's party ID
     */
    partyId?: string;
    /**
     * Alias/FQDN lookup
     * Use this to resolve credentials via purchased alias, e.g. "alice.5n.xyz"
     */
    a?: string;
}
