import { Connection } from './connection';
import type { IDSdkConfig } from './types';
import { SDK_VERSION, API_VERSION, DEFAULT_NETWORK } from './constants';

/**
 * IDSdk - Main SDK class for interacting with the 5N ID API
 */
class IDSdk {
    private version: string = SDK_VERSION;

    /**
     * Create and connect an IDSdk connection
     * @param config - SDK configuration with clientId, clientSecret, and optional network
     * @returns Promise resolving to a Connection instance
     */
    async connect(config: IDSdkConfig): Promise<Connection> {
        const connection = new Connection({
            network: config.network || DEFAULT_NETWORK,
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            baseUrl: config.baseUrl,
            tokenEndpoint: config.tokenEndpoint,
            apiVersion: API_VERSION,
        });

        // Trigger token fetch by making a test request (will be cached)
        // We'll just initialize the connection - token will be fetched on first API call
        return connection;
    }

    /**
     * Get the SDK version
     */
    getVersion(): string {
        return this.version;
    }
}

export const idSdk = new IDSdk();
export { Connection } from './connection';
export * from './types';
export * from './errors';
