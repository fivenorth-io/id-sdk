# SDK Reference

Complete reference for the 5N ID TypeScript/JavaScript SDK.

## Installation

```bash
npm install @fivenorth/id-sdk
# or
yarn add @fivenorth/id-sdk
# or
bun add @fivenorth/id-sdk
```

## Connection

### `idSdk.connect(options)`

Establishes a connection to the 5N ID service.

**Parameters**:
- `clientId` (string, required): Your client ID
- `clientSecret` (string, required): Your client secret
- `network` (string, optional): Network to connect to (`'devnet'` or `'mainnet'`). Defaults to `'mainnet'`

**Returns**: `Promise<IdSdkConnection>`

**Example**:
```typescript
import { idSdk } from '@fivenorth/id-sdk';

const connection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  network: 'devnet'
});
```

## Connection Methods

All methods below are called on the connection object returned by `idSdk.connect()`.

### `createCredentialsRequest(options)`

Creates a request to access credentials for a party.

**Parameters**:
- `partyId` (string, required): The party identifier
- `providers` (string[], optional): Array of provider names

**Returns**: `Promise<CredentialsRequestResponse>`

**Example**:
```typescript
const request = await connection.createCredentialsRequest({
  partyId: 'party::identifier',
  providers: ['provider1', 'provider2']
});

console.log(request.requestId);
console.log(request.status);
```

### `getCredentials(options?)`

Retrieves credentials associated with the authenticated institution.

**Parameters**:
- `offset` (number, optional): Pagination offset (default: 0)
- `limit` (number, optional): Number of results per page (default: 20, max: 100)

**Returns**: `Promise<CredentialsListResponse>`

**Example**:
```typescript
// Get first page
const firstPage = await connection.getCredentials({ offset: 0, limit: 20 });

// Get next page
const nextPage = await connection.getCredentials({
  offset: 20,
  limit: 20
});

console.log(firstPage.credentials);
console.log(`Total: ${firstPage.total}`);
```

### `getCredentialsByPartyId(partyId)`

Retrieves credentials for a specific party.

**Parameters**:
- `partyId` (string, required): The party identifier

**Returns**: `Promise<CredentialResponse>`

**Example**:
```typescript
const credential = await connection.getCredentialsByPartyId('party::identifier');

console.log(credential.contractId);
console.log(credential.status);
```

### `generateVerificationLink(options)`

Generates a verification link for a single credential.

**Parameters**:
- `contractId` (string, required): The contract ID of the credential

**Returns**: `Promise<VerificationLinkResponse>`

**Example**:
```typescript
const link = await connection.generateVerificationLink({
  contractId: 'contract_123'
});

console.log(link.link);
console.log(link.token);
console.log(link.expiresAt);
```

### `generateVerificationLinksBatch(options)`

Generates multiple verification links in a single request.

**Parameters**:
- `requests` (Array<{ contractId: string }>, required): Array of contract IDs

**Returns**: `Promise<BatchVerificationLinksResponse>`

**Example**:
```typescript
const links = await connection.generateVerificationLinksBatch({
  requests: [
    { contractId: 'contract_123' },
    { contractId: 'contract_456' }
  ]
});

links.links.forEach(link => {
  console.log(`${link.contractId}: ${link.link}`);
});
```

### `checkVerificationStatus(token)`

Checks the verification status of a token. This is a public method that does not require authentication.

**Parameters**:
- `token` (string, required): The verification token

**Returns**: `Promise<VerificationStatusResponse>`

**Example**:
```typescript
const status = await connection.checkVerificationStatus('verify_token_abc123');

console.log(status.status);
console.log(status.contractId);
if (status.verifiedAt) {
  console.log(`Verified at: ${status.verifiedAt}`);
}
```

### `getHumanScore(partyId)`

Gets the identity verification "human score" with detailed breakdown for a specific party.

**Parameters**:
- `partyId` (string, required): The party ID to get the human score for

**Returns**: `Promise<HumanScoreResponse>`

**Example**:
```typescript
const score = await connection.getHumanScore('party::identifier');

console.log(`Total Score: ${score.totalScore}`);
console.log('Badges:');
score.badges.forEach(badge => {
  console.log(`  ${badge.name}: ${badge.status}`);
});
console.log('Breakdown:', score.breakdown);
```

## Type Definitions

### `IdSdkConnection`

The connection object returned by `idSdk.connect()`.

### `CredentialsRequestResponse`

```typescript
{
  requestId: string;
  status: string;
  partyId: string;
}
```

### `CredentialsListResponse`

```typescript
{
  credentials: Credential[];
  total: number;
  offset: number;
  limit: number;
}
```

### `Credential`

```typescript
{
  contractId: string;
  partyId: string;
  status: string;
  createdAt: string;
  providers?: string[];
}
```

### `VerificationLinkResponse`

```typescript
{
  token: string;
  link: string;
  expiresAt: string;
}
```

### `BatchVerificationLinksResponse`

```typescript
{
  links: Array<{
    contractId: string;
    token: string;
    link: string;
    expiresAt: string;
  }>;
}
```

### `VerificationStatusResponse`

```typescript
{
  status: string;
  contractId: string;
  partyId: string;
  verifiedAt?: string;
}
```

### `HumanScoreResponse`

```typescript
{
  totalScore: number;
  badges: Array<{
    name: string;
    status: string;
  }>;
  breakdown: {
    identity?: number;
    document?: number;
    biometric?: number;
  };
}
```

## Error Handling

The SDK throws errors for failed requests. Always wrap SDK calls in try-catch blocks:

```typescript
try {
  const credential = await connection.getCredentialsByPartyId('party::identifier');
  console.log(credential);
} catch (error) {
  if (error instanceof IdSdkError) {
    console.error(`SDK Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Token Management

The SDK automatically handles OAuth2 token acquisition and refresh. You don't need to manually manage tokens when using the SDK. Tokens are cached and refreshed as needed.

## Next Steps

- [Examples](examples.md) - See practical code examples
- [API Reference](api-reference.md) - Understand the underlying REST API
