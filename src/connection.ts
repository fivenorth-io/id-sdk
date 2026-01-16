import type {
    Network,
    TokenResponse,
    CreateCredentialsRequest,
    CredentialsListResponse,
    Credential,
    GetCredentialsOptions,
    GenerateVerificationLinkRequest,
    GenerateVerificationLinkResponse,
    BatchGenerateVerificationLinkRequest,
    BatchGenerateVerificationLinkResponse,
    VerificationStatusResponse,
    HumanScoreResult,
} from './types';
import { UnauthorizedError, APIError } from './errors';
import {
    API_VERSION,
    BASE_URLS,
    TOKEN_ENDPOINTS,
    ENDPOINTS,
    OAUTH,
    HTTP,
    TOKEN,
    BATCH,
    ERROR_MESSAGES,
    DEFAULT_NETWORK,
} from './constants';

/**
 * Connection class - Handles API requests and URL resolution based on network
 */
export class Connection {
    public baseUrl: string;
    public tokenEndpoint: string;
    private network: Network;
    private clientId: string;
    private clientSecret: string;
    private accessToken: string | null = null;
    private tokenExpiresAt: number | null = null;
    private apiVersion: string = API_VERSION;

    constructor({
        network,
        clientId,
        clientSecret,
        baseUrl,
        tokenEndpoint,
        apiVersion,
    }: {
        network?: Network;
        clientId: string;
        clientSecret: string;
        baseUrl?: string;
        tokenEndpoint?: string;
        apiVersion?: string;
    }) {
        this.network = network || DEFAULT_NETWORK;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        if (apiVersion) {
            this.apiVersion = apiVersion;
        }

        // Resolve URLs based on network if not overridden
        if (baseUrl) {
            this.baseUrl = baseUrl;
        } else {
            this.baseUrl = this.resolveBaseUrl(this.network);
        }

        if (tokenEndpoint) {
            this.tokenEndpoint = tokenEndpoint;
        } else {
            this.tokenEndpoint = this.resolveTokenEndpoint(this.network);
        }
    }

    /**
     * Resolve base API URL based on network
     */
    private resolveBaseUrl(network: Network): string {
        switch (network) {
            case 'devnet':
            case 'dev':
                return BASE_URLS.devnet;
            case 'mainnet':
            case 'main':
                return BASE_URLS.mainnet;
            default:
                return BASE_URLS.mainnet;
        }
    }

    /**
     * Resolve token endpoint URL based on network
     * Both networks use the same authorization server with different realms
     */
    private resolveTokenEndpoint(network: Network): string {
        switch (network) {
            case 'devnet':
            case 'dev':
                return TOKEN_ENDPOINTS.devnet;
            case 'mainnet':
            case 'main':
                return TOKEN_ENDPOINTS.mainnet;
            default:
                return TOKEN_ENDPOINTS.mainnet;
        }
    }

    /**
     * Get or refresh the access token
     */
    private async ensureToken(): Promise<string> {
        // Check if we have a valid token
        if (
            this.accessToken &&
            this.tokenExpiresAt &&
            Date.now() < this.tokenExpiresAt - TOKEN.BUFFER_TIME_MS
        ) {
            // Token is still valid (with 1 minute buffer)
            return this.accessToken;
        }

        // Request new token
        const tokenData = await this.requestToken();
        this.accessToken = tokenData.access_token;
        // Set expiration time with a 1 minute buffer
        this.tokenExpiresAt =
            Date.now() + (tokenData.expires_in - 60) * 1000;
        return this.accessToken;
    }

    /**
     * Request a new OAuth2 access token using client_credentials flow
     */
    private async requestToken(): Promise<TokenResponse> {
        const params = new URLSearchParams({
            grant_type: OAUTH.GRANT_TYPE,
            client_id: this.clientId,
            client_secret: this.clientSecret,
        });

        const response = await fetch(this.tokenEndpoint, {
            method: HTTP.METHODS.POST,
            headers: {
                [HTTP.HEADERS.CONTENT_TYPE]: OAUTH.CONTENT_TYPE,
            },
            body: params.toString(),
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                throw new UnauthorizedError(ERROR_MESSAGES.INVALID_CLIENT_CREDENTIALS);
            }
            const errorText = await response.text();
            throw new APIError(
                `${ERROR_MESSAGES.FAILED_TO_OBTAIN_TOKEN}: ${errorText}`,
                response.status,
            );
        }

        return response.json();
    }

    /**
     * Make an authenticated API request
     */
    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const token = await this.ensureToken();

        const url = endpoint.startsWith('http')
            ? endpoint
            : `${this.baseUrl}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
                [HTTP.HEADERS.AUTHORIZATION]: `Bearer ${token}`,
                ...options.headers,
            },
        });

        if (!response.ok) {
            if (response.status === 401 || response.status === 403) {
                // Token might be expired, try refreshing once
                this.accessToken = null;
                this.tokenExpiresAt = null;
                const newToken = await this.ensureToken();

                // Retry the request once
                const retryResponse = await fetch(url, {
                    ...options,
                    headers: {
                        [HTTP.HEADERS.CONTENT_TYPE]: HTTP.CONTENT_TYPES.JSON,
                        [HTTP.HEADERS.AUTHORIZATION]: `Bearer ${newToken}`,
                        ...options.headers,
                    },
                });

                if (!retryResponse.ok) {
                    if (
                        retryResponse.status === 401 ||
                        retryResponse.status === 403
                    ) {
                        throw new UnauthorizedError(ERROR_MESSAGES.AUTHENTICATION_FAILED);
                    }
                    const errorText = await retryResponse.text();
                    throw new APIError(
                        `${ERROR_MESSAGES.API_REQUEST_FAILED}: ${errorText}`,
                        retryResponse.status,
                    );
                }

                return retryResponse.json();
            }

            const errorText = await response.text();
            throw new APIError(
                `${ERROR_MESSAGES.API_REQUEST_FAILED}: ${errorText}`,
                response.status,
            );
        }

        // Handle empty responses
        if (
            response.status === 204 ||
            response.headers.get('content-length') === '0'
        ) {
            return {} as T;
        }

        return response.json();
    }

    /**
     * Create a credentials access request (proposal) for a user
     * @param request - Request containing partyId and providers
     */
    async createCredentialsRequest(
        request: CreateCredentialsRequest,
    ): Promise<void> {
        await this.request<void>(ENDPOINTS.CREDENTIALS_ACCESS_REQUEST, {
            method: HTTP.METHODS.POST,
            body: JSON.stringify(request),
        });
    }

    /**
     * Get all credentials for the institution with pagination
     * @param options - Optional pagination parameters
     * @returns Credentials list with pagination info
     */
    async getCredentials(
        options: GetCredentialsOptions = {},
    ): Promise<CredentialsListResponse> {
        const params = new URLSearchParams();
        if (options.offset !== undefined) {
            params.append('offset', options.offset.toString());
        }
        if (options.limit !== undefined) {
            params.append('limit', options.limit.toString());
        }

        const queryString = params.toString();
        const endpoint = `${ENDPOINTS.CREDENTIALS}${queryString ? `?${queryString}` : ''}`;

        return this.request<CredentialsListResponse>(endpoint, {
            method: HTTP.METHODS.GET,
        });
    }

    /**
     * Get credentials for a specific party ID
     * @param partyId - The party ID of the user
     * @returns Array of credentials for the user
     */
    async getCredentialsByPartyId(partyId: string): Promise<Credential[]> {
        const encodedPartyId = encodeURIComponent(partyId);
        return this.request<Credential[]>(
            `${ENDPOINTS.CREDENTIALS_BY_PARTY}/${encodedPartyId}`,
            {
                method: HTTP.METHODS.GET,
            },
        );
    }

    /**
     * Generate a verification link for a specific credential contract
     * @param request - Request containing contractId
     * @returns Verification URL and token
     */
    async generateVerificationLink(
        request: GenerateVerificationLinkRequest,
    ): Promise<GenerateVerificationLinkResponse> {
        return this.request<GenerateVerificationLinkResponse>(
            ENDPOINTS.VERIFICATION_GENERATE_LINK,
            {
                method: HTTP.METHODS.POST,
                body: JSON.stringify(request),
            },
        );
    }

    /**
     * Generate verification links for multiple credentials in batch
     * @param request - Batch request containing array of contractIds
     * @returns Array of results with success/error for each request
     */
    async generateVerificationLinksBatch(
        request: BatchGenerateVerificationLinkRequest,
    ): Promise<BatchGenerateVerificationLinkResponse> {
        if (request.requests.length > BATCH.MAX_REQUESTS) {
            throw new Error(ERROR_MESSAGES.MAX_BATCH_REQUESTS);
        }

        return this.request<BatchGenerateVerificationLinkResponse>(
            ENDPOINTS.VERIFICATION_GENERATE_LINKS_BATCH,
            {
                method: HTTP.METHODS.POST,
                body: JSON.stringify(request),
            },
        );
    }

    /**
     * Check verification status for a verification token (public endpoint, no auth required)
     * @param token - The verification token from the verification URL
     * @returns Verification status information
     */
    async checkVerificationStatus(
        token: string,
    ): Promise<VerificationStatusResponse> {
        const encodedToken = encodeURIComponent(token);
        const url = `${this.baseUrl}${ENDPOINTS.VERIFICATION_CHECK}/${encodedToken}`;

        const response = await fetch(url, {
            method: HTTP.METHODS.GET,
        });

        if (!response.ok) {
            if (response.status === 404) {
                throw new APIError(ERROR_MESSAGES.TOKEN_NOT_FOUND, 404);
            }
            const errorText = await response.text();
            throw new APIError(
                `${ERROR_MESSAGES.FAILED_TO_CHECK_VERIFICATION}: ${errorText}`,
                response.status,
            );
        }

        return response.json();
    }

    /**
     * Get human score for the authenticated user
     * @returns Human score result with breakdown, badges, and detailed metrics
     */
    async getHumanScore(): Promise<HumanScoreResult> {
        return this.request<HumanScoreResult>(ENDPOINTS.HUMAN_SCORE, {
            method: HTTP.METHODS.GET,
        });
    }
}
