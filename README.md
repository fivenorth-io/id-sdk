# 5N ID SDK

TypeScript/JavaScript SDK for programmatically interacting with the 5N ID service. This SDK provides a clean, type-safe wrapper around the 5N ID API for managing credentials, verification links, and identity verification.

## Installation

```bash
npm install @fivenorth/id-sdk
# or
bun add @fivenorth/id-sdk
# or
yarn add @fivenorth/id-sdk
```

## Quick Start

```typescript
import { idSdk } from '@fivenorth/id-sdk';

// Connect with your client credentials (defaults to mainnet)
const connection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// Get credentials for a specific user
const credentials = await connection.getCredentialsByPartyId('party::123');
console.log(credentials);
```

## Usage

### Initialization

The SDK uses OAuth2 client credentials flow for authentication. You'll need your Client ID and Client Secret from your institution settings.

```typescript
import { idSdk } from '@fivenorth/id-sdk';

// Connect to mainnet (default)
const connection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
});

// Connect to devnet
const devConnection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  network: 'devnet',
});

```

### Network Configuration

The SDK supports two networks:
- `mainnet` (default) - Production environment
- `devnet` - Development environment

URLs are automatically resolved based on the network. You can override them if needed, but it's recommended to use the network parameter.

### Credentials Management

#### Create a Credentials Request

Request credentials from a user by creating a credentials access request (proposal):

```typescript
await connection.createCredentialsRequest({
  partyId: 'party::123',
  providers: ['GOOGLE', 'LINKEDIN', 'GITHUB'],
});
```

#### Get All Institution Credentials

Retrieve all approved credentials that your institution has access to, with pagination:

```typescript
// Get first page (default: offset=0, limit=10)
const allCredentials = await connection.getCredentials();

// With pagination
const page2 = await connection.getCredentials({
  offset: 10,
  limit: 20,
});

console.log(allCredentials.items); // Array of credentials
console.log(allCredentials.pagination); // { offset, limit, total }
```

#### Get Credentials for a Specific User

Get credentials disclosed by a specific user to your institution:

```typescript
const userCredentials = await connection.getCredentialsByPartyId('party::123');

userCredentials.forEach(credential => {
  console.log(credential.provider); // 'GOOGLE', 'LINKEDIN', etc.
  console.log(credential.kycStatus); // 'APPROVED', 'REJECTED', etc.
  console.log(credential.metadata.email); // User's email
  console.log(credential.freshness); // 'FRESH', 'MODERATE', 'STALE', 'REVOKED'
});
```

### Verification Links

#### Generate a Verification Link

Generate a short-lived verification link for a specific credential:

```typescript
const verification = await connection.generateVerificationLink({
  contractId: '008cb3c4e71260967ef...',
});

console.log(verification.verificationUrl); // URL to share
console.log(verification.token); // Token for status checking
```

#### Generate Verification Links in Batch

Generate multiple verification links at once (max 100 per batch):

```typescript
const batchResult = await connection.generateVerificationLinksBatch({
  requests: [
    { contractId: '00020bf30f6b3714bff...' },
    { contractId: '008cb3c4e71260967ef...' },
  ],
});

batchResult.results.forEach(result => {
  if (result.result) {
    console.log(`Success: ${result.result.verificationUrl}`);
  } else if (result.error) {
    console.error(`Error: ${result.error.message}`);
  }
});
```

#### Check Verification Status

Check the verification status for a token (public endpoint, no authentication required):

```typescript
const status = await connection.checkVerificationStatus('verification-token');

console.log(status.status); // 'strong', 'moderate', 'weak', etc.
console.log(status.color); // 'green', 'amber', 'red'
console.log(status.isActive); // boolean
console.log(status.credentialData); // Original credential metadata
```

## API Reference

### IDSdk

The main SDK class. The class name is `IDSdk` and it's exported as an instance `idSdk`.

#### Methods

- `connect(config: IDSdkConfig): Promise<Connection>` - Create and authenticate a new connection
- `getVersion(): string` - Get the SDK version

### Connection

The connection instance returned from `idSdk.connect()`. All API operations are performed through this connection.

#### Methods

- `createCredentialsRequest(request: CreateCredentialsRequest): Promise<void>` - Create a credentials access request
- `getCredentials(options?: GetCredentialsOptions): Promise<CredentialsListResponse>` - Get all institution credentials with pagination
- `getCredentialsByPartyId(partyId: string): Promise<Credential[]>` - Get credentials for a specific party ID
- `generateVerificationLink(request: GenerateVerificationLinkRequest): Promise<GenerateVerificationLinkResponse>` - Generate a verification link
- `generateVerificationLinksBatch(request: BatchGenerateVerificationLinkRequest): Promise<BatchGenerateVerificationLinkResponse>` - Generate multiple verification links
- `checkVerificationStatus(token: string): Promise<VerificationStatusResponse>` - Check verification status (public endpoint)

### Types

#### Network
```typescript
type Network = 'devnet' | 'mainnet' | 'dev' | 'main';
```

#### CredentialProvider
```typescript
type CredentialProvider = 'GOOGLE' | 'LINKEDIN' | 'GITHUB' | 'DISCORD' | 'TWITTER';
```

#### Credential
```typescript
interface Credential {
  contractId: string;
  provider: CredentialProvider;
  kycStatus: KYCStatus;
  expirationDate: string;
  issuedAt: string;
  freshness: FreshnessStatus;
  metadata: CredentialMetadata;
}
```

#### VerificationStatusResponse
```typescript
interface VerificationStatusResponse {
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
```

## Error Handling

The SDK provides specific error types for better error handling:

```typescript
import { idSdk, UnauthorizedError, APIError } from '@fivenorth/id-sdk';

try {
  const connection = await idSdk.connect({
    clientId: '...',
    clientSecret: '...',
  });
  const creds = await connection.getCredentials();
} catch (error) {
  if (error instanceof UnauthorizedError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof APIError) {
    console.error('API error:', error.statusCode, error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Error Types

- `UnauthorizedError` - Thrown when authentication fails (invalid credentials or expired token)
- `APIError` - Thrown when API requests fail (includes statusCode and response)
- `TokenExpiredError` - Thrown when access token expires (automatically handled by retry logic)

## Token Management

The SDK automatically handles OAuth2 token management:
- Tokens are automatically obtained on first use
- Tokens are cached and reused until near expiration
- Tokens are automatically refreshed when expired
- Failed requests due to expired tokens are automatically retried once

## API Versioning

The SDK uses API version `v1` by default. The version is embedded in the base URL and can be configured when creating a connection (though this is typically not necessary).

## Development

### Building

```bash
bun install
bun run build
```

### Type Generation (Optional)

If you want to generate types from the OpenAPI specification:

```bash
bun run generate-types
```

This will generate types from `../kyc-backend/api-openapi.json` into `src/generated-types.ts`.

## License

See LICENSE file for details.

## Support

For questions or issues, please contact support@fivenorth.io or visit the [5N ID API Integration documentation](https://id.devnet.cantonloop.com/api-integration).
