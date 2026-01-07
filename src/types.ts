/**
 * Network type
 */
export type Network = 'devnet' | 'testnet' | 'mainnet' | 'dev' | 'test' | 'main';

/**
 * Credential provider types
 */
export type CredentialProvider = 'GOOGLE' | 'LINKEDIN' | 'GITHUB' | 'DISCORD' | 'TWITTER' | 'SUMSUB';

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
 * Get credentials options
 */
export interface GetCredentialsOptions {
    offset?: number;
    limit?: number;
}
