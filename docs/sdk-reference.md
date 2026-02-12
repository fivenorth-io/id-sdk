# SDK Reference

Complete reference for the 5N ID TypeScript/JavaScript SDK. All methods map one-to-one to the [API endpoints](api-reference.md).

## Installation

```bash
npm install @fivenorth/id-sdk
# or
yarn add @fivenorth/id-sdk
# or
bun add @fivenorth/id-sdk
```

## Connection

### `idSdk.connect(config)`

Establishes a connection to the 5N ID service.

**Parameters**:
- `clientId` (string, required): Your client ID
- `clientSecret` (string, required): Your client secret
- `network` (string, optional): `'devnet'` or `'mainnet'`. Defaults to `'mainnet'`

**Returns**: `Promise<Connection>`

**Example**:
```typescript
import { idSdk } from '@fivenorth/id-sdk';

const connection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  network: 'devnet',
});
```

## Connection Methods

All methods below are called on the `Connection` returned by `idSdk.connect()`.

### `getUsers(options?)`

Retrieves users (institution users / KYC data requests) with optional pagination and filters. Maps to `GET /institutions/me/users`.

**Parameters** (all optional):
- `offset` (number): Pagination offset (default: 0)
- `limit` (number): Page size (default: 10)
- `orderBy`, `orderType`, `status`, `reqStatus`, `kycStatus`, `search`: Filters

**Returns**: `Promise<UsersListResponse>` — `{ items: InstitutionUser[], pagination, totalCount? }`

**Example**:
```typescript
const result = await connection.getUsers({ offset: 0, limit: 20 });
console.log(result.items);
console.log(result.pagination.total);
```

### `getHumanScores(options?)`

Retrieves human scores with pagination or filtered by party IDs. Maps to `GET /institutions/me/human-scores`.

**Parameters** (optional):
- `offset`, `limit`: Pagination (when not using partyIds)
- `partyIds` (string[]): When set, returns human scores for these party IDs only

**Returns**: `Promise<HumanScoresListResponse>` — `{ items: { partyId, humanScore }[], pagination }`

**Example**:
```typescript
// By party IDs
const result = await connection.getHumanScores({ partyIds: ['party::user1', 'party::user2'] });

// Paginated (all approved users)
const page = await connection.getHumanScores({ offset: 0, limit: 10 });

for (const item of result.items) {
  console.log(item.partyId, item.humanScore.totalScore);
}
```

### `getHumanScoreByPartyId(partyId)`

Retrieves the human score for a single party. Maps to `GET /institutions/me/human-scores/:partyId`.

**Parameters**:
- `partyId` (string, required): The party ID

**Returns**: `Promise<HumanScoreItem>` — `{ partyId, humanScore }`

**Example**:
```typescript
const item = await connection.getHumanScoreByPartyId('party::user1');
console.log(item.humanScore.totalScore, item.humanScore.badges);
```

### `getCredentials(options?)`

Retrieves credentials with pagination and/or filter by party IDs. Maps to `GET /institutions/me/credentials`.

**Parameters** (optional):
- `offset`, `limit`: Pagination
- `partyIds` (string[]): When set, returns credentials for these party IDs only

**Returns**: `Promise<CredentialsListResponse>` — `{ items: Credential[], pagination }`

**Example**:
```typescript
const result = await connection.getCredentials({ offset: 0, limit: 20 });
// Or by party IDs
const byParty = await connection.getCredentials({ partyIds: ['party::user1'] });
```

### `getCredentialByPartyId(partyId)`

Retrieves credentials for a specific party. Maps to `GET /institutions/me/credentials/:partyId`.

**Parameters**:
- `partyId` (string, required): The party ID

**Returns**: `Promise<Credential[]>` — Array of credentials for that party

**Example**:
```typescript
const credentials = await connection.getCredentialByPartyId('party::user1');
credentials.forEach(c => console.log(c.provider, c.kycStatus));
```

### `resolveCredentials(options)`

Resolves credentials by email/username (forward lookup) or by party ID (reverse lookup). Maps to `GET /institutions/me/credentials/resolve`. Provide exactly one of `q` or `partyId`.

**Parameters**:
- `options.q` (string, optional): Email or username for forward lookup
- `options.partyId` (string, optional): Party ID for reverse lookup

**Returns**: `Promise<ResolveCredentialsResponse>` — `{ credentials: ResolvedCredential[] }`

**Example**:
```typescript
const byEmail = await connection.resolveCredentials({ q: 'user@example.com' });
const byParty = await connection.resolveCredentials({ partyId: 'party::123' });
```

Convenience methods: `resolve(query)` for forward lookup and `reverseResolve(partyId)` for reverse lookup.

### `createCredentialsRequest(request)`

Creates a credentials access request (proposal) for a user. Maps to `POST /institutions/me/credentials/request`.

**Parameters**:
- `request.partyId` (string, required): The party ID
- `request.providers` (CredentialProvider[], required): e.g. `['GOOGLE', 'LINKEDIN', 'GITHUB']`

**Returns**: `Promise<void>` on success

**Example**:
```typescript
await connection.createCredentialsRequest({
  partyId: 'party::user1',
  providers: ['GOOGLE', 'LINKEDIN'],
});
```

### `generateVerificationLink(request)`

Generates a short-lived verification link for a credential. Maps to `POST /verification/generate-link`.

**Parameters**:
- `request.contractId` (string, required): The credential contract ID

**Returns**: `Promise<GenerateVerificationLinkResponse>` — `{ verificationUrl, token }`

**Example**:
```typescript
const res = await connection.generateVerificationLink({ contractId: '...' });
console.log(res.verificationUrl, res.token);
```

### `generateVerificationLinksBatch(request)`

Generates verification links for multiple credentials (max 100). Maps to `POST /verification/generate-links-batch`.

**Parameters**:
- `request.requests` (Array<{ contractId: string }>, required): Up to 100 items

**Returns**: `Promise<BatchGenerateVerificationLinkResponse>` — `{ results: [...] }` (each result has `result` or `error`)

**Example**:
```typescript
const batch = await connection.generateVerificationLinksBatch({
  requests: [{ contractId: '...' }, { contractId: '...' }],
});
batch.results.forEach(r => {
  if (r.result) console.log(r.result.verificationUrl);
  if (r.error) console.error(r.error.message);
});
```

### `checkVerificationStatus(token)`

Checks verification status for a token. Public endpoint (no auth). Maps to `GET /verification/check/:token`.

**Parameters**:
- `token` (string, required): The verification token from the verification URL

**Returns**: `Promise<VerificationStatusResponse>` — status, color, isActive, credentialData, etc.

**Example**:
```typescript
const status = await connection.checkVerificationStatus('token-from-url');
console.log(status.status, status.isActive, status.credentialData);
```

## Type Definitions

- **CredentialsListResponse**: `{ items: Credential[], pagination: { offset, limit, total } }`
- **Credential**: `contractId`, `provider`, `kycStatus`, `expirationDate`, `issuedAt`, `freshness`, `metadata`
- **UsersListResponse**: `{ items: InstitutionUser[], pagination, totalCount? }`
- **HumanScoresListResponse**: `{ items: HumanScoreItem[], pagination }`
- **HumanScoreItem**: `{ partyId: string, humanScore: HumanScoreResult }`
- **HumanScoreResult**: `totalScore`, `confidenceLevel`, `breakdown`, `badges`, `details`
- **ResolveCredentialsResponse**: `{ credentials: ResolvedCredential[] }`
- **GenerateVerificationLinkResponse**: `{ verificationUrl, token }`
- **VerificationStatusResponse**: `status`, `color`, `isActive`, `contractId`, `credentialData`, etc.

## Error Handling

The SDK throws `UnauthorizedError` or `APIError` for failed requests. Use try/catch and check `error.status` or `error.message`.

## Token Management

The SDK handles OAuth2 token acquisition, caching, and refresh automatically.

## Next Steps

- [Examples](examples.md) - Code examples
- [API Reference](api-reference.md) - REST API endpoints
