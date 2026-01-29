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
    ResolveCredentialsOptions,
    ResolveCredentialsResponse,
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
     * Get human score for a specific party
     * @param partyId - The party ID to get the human score for
     * @returns Human score result with breakdown, badges, and detailed metrics
     */
    async getHumanScore(partyId: string): Promise<HumanScoreResult> {
        const endpoint = `${ENDPOINTS.HUMAN_SCORE}/${encodeURIComponent(partyId)}`;

        return this.request<HumanScoreResult>(endpoint, {
            method: HTTP.METHODS.GET,
        });
    }

    /**
     * Forward Lookup: Resolve credentials by email or username
     *
     * Performs a forward lookup to find KYC credentials using a user's email
     * address or username. This is useful when you have a user's identifier
     * (email/username) and need to find their associated credentials and party ID.
     *
     * @param query - The email address or username to search for. The search is
     *                case-insensitive and will match against both email and
     *                username fields in the contract metadata.
     * @returns Array of resolved credentials containing party ID, user info,
     *          and credential details
     *
     * @example
     * ```typescript
     * // Find credentials by email
     * const result = await connection.resolve('user@example.com');
     * console.log(result.credentials[0].partyId); // party::123
     * ```
     *
     * @example
     * ```typescript
     * // Find credentials by username
     * const result = await connection.resolve('johndoe');
     * ```
     *
     * @remarks
     * - Only returns credentials that the institution has approved access to
     * - Search is case-insensitive
     * - Returns empty array if no matches found
     * - Can return multiple credentials if user has multiple KYC providers
     */
    async resolve(
        query: string,
    ): Promise<ResolveCredentialsResponse> {
        if (!query || !query.trim()) {
            return { credentials: [] };
        }

        const params = new URLSearchParams({ q: query.trim() });
        const endpoint = `${ENDPOINTS.RESOLVE_CREDENTIALS}?${params.toString()}`;

        return this.request<ResolveCredentialsResponse>(endpoint, {
            method: HTTP.METHODS.GET,
        });
    }

    /**
     * Reverse Lookup: Resolve credentials by party ID
     *
     * Performs a reverse lookup to find all KYC credentials associated with a
     * specific party ID. This is useful when you have a user's party ID (from
     * the ledger) and need to find their associated credentials and metadata
     * (email, username, etc.).
     *
     * @param partyId - The party ID to resolve. This is the unique identifier
     *                  for a user on the Canton ledger (e.g., "party::123").
     * @returns Array of resolved credentials containing user info and credential
     *          details across all KYC providers
     *
     * @example
     * ```typescript
     * // Find all credentials for a user by party ID
     * const result = await connection.reverseResolve('party::04a5835d6cc470817989e9acc1f20c0a::12200d35764b9b490251e499af00626b54516c4f3f1c021c2eb72bf7c72f38662cb0');
     * console.log(result.credentials); // All credentials for this user
     * ```
     *
     * @remarks
     * - Only returns credentials that the institution has approved access to
     * - Returns all credentials associated with the party ID across all
     *   KYC providers (SUMSUB, GOOGLE, LINKEDIN, GITHUB, etc.)
     * - Returns empty array if no matches found
     * - Useful for retrieving user information when you only have the ledger
     *   party ID
     */
    async reverseResolve(
        partyId: string,
    ): Promise<ResolveCredentialsResponse> {
        if (!partyId || !partyId.trim()) {
            return { credentials: [] };
        }

        const params = new URLSearchParams({ partyId: partyId.trim() });
        const endpoint = `${ENDPOINTS.RESOLVE_CREDENTIALS}?${params.toString()}`;

        return this.request<ResolveCredentialsResponse>(endpoint, {
            method: HTTP.METHODS.GET,
        });
    }

    /**
     * Resolve credentials using either forward or reverse lookup
     *
     * This is a convenience method that automatically determines whether to use
     * forward or reverse lookup based on the provided options. You can provide
     * either `q` (email/username) for forward lookup or `partyId` for reverse
     * lookup, but not both.
     *
     * @param options - Resolve options containing either `q` (email/username)
     *                  for forward lookup or `partyId` for reverse lookup
     * @returns Array of resolved credentials
     *
     * @example
     * ```typescript
     * // Forward lookup by email
     * const result1 = await connection.resolveCredentials({ q: 'user@example.com' });
     *
     * // Reverse lookup by party ID
     * const result2 = await connection.resolveCredentials({
     *   partyId: 'party::123'
     * });
     * ```
     *
     * @throws {Error} If both `q` and `partyId` are provided, or if neither is provided
     */
    async resolveCredentials(
        options: ResolveCredentialsOptions,
    ): Promise<ResolveCredentialsResponse> {
        const { q, partyId } = options;

        // Validate that exactly one parameter is provided
        if (!q && !partyId) {
            throw new Error(
                'Either q (email/username) or partyId must be provided',
            );
        }

        if (q && partyId) {
            throw new Error(
                'Cannot provide both q and partyId. Provide either q (for forward lookup) or partyId (for reverse lookup)',
            );
        }

        if (partyId) {
            // Reverse lookup: party ID -> credentials
            return this.reverseResolve(partyId);
        } else {
            // Forward lookup: email/username -> credentials
            return this.resolve(q!);
        }
    }
}
