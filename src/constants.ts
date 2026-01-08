/**
 * API Configuration Constants
 */

/**
 * API Version
 */
export const API_VERSION = 'v1';

/**
 * SDK Version
 */
export const SDK_VERSION = '0.1.3';

/**
 * Default Network
 */
export const DEFAULT_NETWORK = 'mainnet';

/**
 * Base API URLs by network
 */
export const BASE_URLS = {
    devnet: 'https://id.devnet.cantonloop.com/api/v1',
    mainnet: 'https://id.cantonloop.com/api/v1',
} as const;

/**
 * Token endpoint URLs by network
 * Both networks use the same authorization server with different realms
 */
export const TOKEN_ENDPOINTS = {
    devnet: 'https://auth.console-dev.fivenorth.io/realms/5n-apps/protocol/openid-connect/token',
    mainnet: 'https://auth.console-dev.fivenorth.io/realms/5n-apps-mainnet/protocol/openid-connect/token',
} as const;

/**
 * API Endpoints
 */
export const ENDPOINTS = {
    CREDENTIALS_ACCESS_REQUEST: '/institutions/credentials-access-request',
    CREDENTIALS: '/institutions/credentials',
    CREDENTIALS_BY_PARTY: '/institutions/credentials',
    VERIFICATION_GENERATE_LINK: '/verification/generate-link',
    VERIFICATION_GENERATE_LINKS_BATCH: '/verification/generate-links-batch',
    VERIFICATION_CHECK: '/verification/check',
} as const;

/**
 * OAuth2 Configuration
 */
export const OAUTH = {
    GRANT_TYPE: 'client_credentials',
    CONTENT_TYPE: 'application/x-www-form-urlencoded',
} as const;

/**
 * HTTP Configuration
 */
export const HTTP = {
    METHODS: {
        GET: 'GET',
        POST: 'POST',
        PUT: 'PUT',
        PATCH: 'PATCH',
        DELETE: 'DELETE',
    } as const,
    CONTENT_TYPES: {
        JSON: 'application/json',
        FORM_URLENCODED: 'application/x-www-form-urlencoded',
    } as const,
    HEADERS: {
        AUTHORIZATION: 'Authorization',
        CONTENT_TYPE: 'Content-Type',
    } as const,
} as const;

/**
 * Token Management
 */
export const TOKEN = {
    BUFFER_TIME_MS: 60000, // 1 minute buffer before token expiration
} as const;

/**
 * Batch Limits
 */
export const BATCH = {
    MAX_REQUESTS: 100,
} as const;

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
    INVALID_CLIENT_CREDENTIALS: 'Invalid client credentials',
    AUTHENTICATION_FAILED: 'Authentication failed',
    TOKEN_NOT_FOUND: 'Token not found or expired',
    MAX_BATCH_REQUESTS: 'Maximum 100 requests per batch',
    FAILED_TO_OBTAIN_TOKEN: 'Failed to obtain access token',
    API_REQUEST_FAILED: 'API request failed',
    FAILED_TO_CHECK_VERIFICATION: 'Failed to check verification status',
} as const;
