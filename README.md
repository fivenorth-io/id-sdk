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

### Resolve Credentials

The resolve functionality provides two lookup methods to find credentials:

#### Forward Lookup: Resolve by Email or Username

Find credentials when you have a user's email or username. This returns all associated credentials and the user's party ID:

```typescript
// Resolve by email
const result = await connection.resolve('user@example.com');

// Resolve by username
const result2 = await connection.resolve('johndoe');

console.log(result.credentials); // Array of resolved credentials
result.credentials.forEach(cred => {
  console.log(cred.partyId); // User's party ID
  console.log(cred.email); // Email from metadata
  console.log(cred.kycProvider); // Provider (GOOGLE, LINKEDIN, etc.)
  console.log(cred.contractId); // Contract ID on the ledger
});
```

#### Reverse Lookup: Resolve by Party ID

Find all credentials when you have a user's party ID. This returns all credentials for that user:

```typescript
const partyId = 'party::04a5835d6cc470817989e9acc1f20c0a::12200d35764b9b490251e499af00626b54516c4f3f1c021c2eb72bf7c72f38662cb0';
const result = await connection.reverseResolve(partyId);

console.log(result.credentials); // All credentials for this party
result.credentials.forEach(cred => {
  console.log(cred.email); // Email from metadata
  console.log(cred.username); // Username from metadata
  console.log(cred.kycProvider); // Provider
});
```

#### Automatic Resolve (Forward or Reverse)

The SDK can automatically determine which lookup method to use:

```typescript
// Forward lookup (automatically uses email/username)
const result1 = await connection.resolveCredentials({
  q: 'user@example.com'
});

// Reverse lookup (automatically uses party ID)
const result2 = await connection.resolveCredentials({
  partyId: 'party::123'
});
```

### Human Score

#### Get Human Score

Get the human score calculation for a specific party. The human score evaluates account authenticity based on account age, social metrics, email consistency, and provider count:

```typescript
const humanScore = await connection.getHumanScore('party::identifier');

console.log(humanScore.totalScore); // Total score (0-100)
console.log(humanScore.confidenceLevel); // 'low', 'medium-low', 'medium', 'medium-high', 'high'
console.log(humanScore.breakdown); // Score breakdown by category
console.log(humanScore.badges); // Array of earned badges
console.log(humanScore.details); // Detailed metrics and information
```

The response includes:
- **totalScore**: Overall score from 0-100
- **confidenceLevel**: Confidence level based on the score
- **breakdown**: Score breakdown by category (accountAgeScore, socialMetricsScore, emailConsistencyScore, providerCountScore)
- **badges**: Array of earned badges with levels (bronze, silver, gold, platinum)
- **details**: Detailed metrics including account ages, social metrics, email consistency, provider count, and raw user info

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
- `resolve(query: string): Promise<ResolveCredentialsResponse>` - Forward lookup: Resolve credentials by email or username
- `reverseResolve(partyId: string): Promise<ResolveCredentialsResponse>` - Reverse lookup: Resolve credentials by party ID
- `resolveCredentials(options: ResolveCredentialsOptions): Promise<ResolveCredentialsResponse>` - Automatically resolve using forward or reverse lookup
- `getHumanScore(partyId: string): Promise<HumanScoreResult>` - Get human score calculation for a specific party

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

#### ResolveCredentialsResponse
```typescript
interface ResolveCredentialsResponse {
  credentials: ResolvedCredential[];
}

interface ResolvedCredential {
  partyId?: string;
  userId: number;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  kycProvider: 'GOOGLE' | 'LINKEDIN' | 'GITHUB' | 'DISCORD' | 'TWITTER';
  contractId: string;
  metadata?: Record<string, any>;
}
```

#### HumanScoreResult
```typescript
interface HumanScoreResult {
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

interface HumanScoreBadge {
  id: string;
  name: string;
  description: string;
  level: BadgeLevel;
  category: string;
  icon?: string;
}

type BadgeLevel = 'bronze' | 'silver' | 'gold' | 'platinum';
type ConfidenceLevel = 'low' | 'medium-low' | 'medium' | 'medium-high' | 'high';
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

This will generate types from the OpenAPI specification into `src/generated-types.ts`.

## License

See LICENSE file for details.

## Support

For questions or issues, please contact support@fivenorth.io or visit the [5N ID API Integration documentation](https://id.devnet.cantonloop.com/api-integration).
