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

All methods below are called on the `Connection` returned by `idSdk.connect()`. Verification providers (for `createCredentialsRequest` and credential `provider` fields) are: `GOOGLE`, `LINKEDIN`, `GITHUB`, `DISCORD`, `TWITTER`, `REDDIT`.

**Method summary**

| Method                                    | Returns                                          | Description                               |
| ----------------------------------------- | ------------------------------------------------ | ----------------------------------------- |
| `getUsers(options?)`                      | `Promise<UsersListResponse>`                     | Institution users with pagination/filters |
| `getHumanScores(options?)`                | `Promise<HumanScoresListResponse>`               | Human scores (pagination / partyIds / emails) |
| `getHumanScoreByPartyId(partyId)`         | `Promise<HumanScoreItem>`                        | Human score for one party                 |
| `getCredentials(options?)`                | `Promise<CredentialsListResponse>`               | Credentials with pagination or partyIds   |
| `getCredentialByPartyId(partyId)`         | `Promise<Credential[]>`                          | Credentials for one party                 |
| `resolveCredentials(options)`             | `Promise<ResolveCredentialsResponse>`            | Resolve by `q`, `partyId`, or `a`         |
| `createCredentialsRequest(request)`       | `Promise<void>`                                  | Create credentials access request         |
| `generateVerificationLink(request)`       | `Promise<GenerateVerificationLinkResponse>`      | Single verification link                  |
| `generateVerificationLinksBatch(request)` | `Promise<BatchGenerateVerificationLinkResponse>` | Batch verification links                  |
| `checkVerificationStatus(token)`          | `Promise<VerificationStatusResponse>`            | Check status (public)                     |
| `resolve(query)`                          | `Promise<ResolveCredentialsResponse>`            | Forward lookup by `q` (metadata or account username) |
| `reverseResolve(partyId)`                 | `Promise<ResolveCredentialsResponse>`            | Reverse lookup by party ID                |
| `resolveByAlias(alias)`                   | `Promise<ResolveCredentialsResponse>`            | Resolve lookup by alias/FQDN              |

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

Retrieves human scores with pagination and/or filters by party IDs and/or registered account emails. Maps to `GET /institutions/me/human-scores`.

**Parameters** (optional):
- `offset`, `limit`: Pagination
- `partyIds` (string[]): When set, narrows to these party IDs (institution users)
- `emails` (string[]): When set, narrows by **registered account email** (`user.email`). If both `partyIds` and `emails` are set, the API matches either (OR).

**Returns**: `Promise<HumanScoresListResponse>` — `{ items: { partyId, email, humanScore }[], pagination }`

**Example**:
```typescript
// By party IDs
const result = await connection.getHumanScores({ partyIds: ['party::user1', 'party::user2'] });

// By registration emails
const byEmail = await connection.getHumanScores({ emails: ['user@example.com'] });

// Paginated (all approved users)
const page = await connection.getHumanScores({ offset: 0, limit: 10 });

for (const item of result.items) {
  console.log(item.partyId, item.email, item.humanScore.totalScore);
}
```

### `getHumanScoreByPartyId(partyId)`

Retrieves the human score for a single party. Maps to `GET /institutions/me/human-scores/:partyId`.

**Parameters**:
- `partyId` (string, required): The party ID

**Returns**: `Promise<HumanScoreItem>` — `{ partyId, email, humanScore }`

**Example**:
```typescript
const item = await connection.getHumanScoreByPartyId('party::user1');
console.log(item.email, item.humanScore.totalScore, item.humanScore.badges);
```

### `getCredentials(options?)`

Retrieves credentials with pagination and/or filter by party IDs and/or registered account emails. Maps to `GET /institutions/me/credentials`.

**Parameters** (optional):
- `offset`, `limit`: Pagination
- `partyIds` (string[]): When set, returns credentials for these party IDs only
- `emails` (string[]): When set, filters by **registered account email** (`user.email` on the backend) only—not credential metadata. Repeated values map to repeated `emails` query params. If both `partyIds` and `emails` are set, the API matches either (OR). Note: putting emails in query strings can expose them to proxies and access logs.

**Returns**: `Promise<CredentialsListResponse>` — `{ items: Credential[], pagination }`. Each `Credential` includes top-level `partyId` and `email` (registered account email).

**Example**:
```typescript
const result = await connection.getCredentials({ offset: 0, limit: 20 });
// Or by party IDs
const byParty = await connection.getCredentials({ partyIds: ['party::user1'] });
// Or by registered account emails
const byEmail = await connection.getCredentials({ emails: ['user@example.com'] });
```

### `getCredentialByPartyId(partyId)`

Retrieves credentials for a specific party. Maps to `GET /institutions/me/credentials/:partyId`.

**Parameters**:
- `partyId` (string, required): The party ID

**Returns**: `Promise<Credential[]>` — Array of credentials for that party (each with top-level `partyId`, `email`, and contract fields).

**Example**:
```typescript
const credentials = await connection.getCredentialByPartyId('party::user1');
credentials.forEach(c => console.log(c.partyId, c.email, c.provider, c.kycStatus));
```

### `resolveCredentials(options)`

Resolves credentials by forward lookup (`q`), party ID (`partyId`, reverse), or alias/FQDN (`a`, alias lookup). Maps to `GET /institutions/me/credentials/resolve`. Provide exactly one of `q`, `partyId`, or `a`.

**Forward lookup (`q`)** matches, case-insensitively: email, username, or domain stored in **credential metadata** (e.g. DNS domain), **or** the user’s **ID service account username** (`user.username` on the backend). That account username is usually the email address the user used to register, even when it does not appear the same way in provider metadata.

**Parameters**:
- `options.q` (string, optional): Value for forward lookup (metadata email/username/domain or ID service account username)
- `options.partyId` (string, optional): Party ID for reverse lookup
- `options.a` (string, optional): Alias/FQDN for alias lookup (e.g. `alice.5n.xyz`)

**Returns**: `Promise<ResolveCredentialsResponse>` — `{ credentials: ResolvedCredential[] }`

**Example**:
```typescript
const byEmail = await connection.resolveCredentials({ q: 'user@example.com' });
const byParty = await connection.resolveCredentials({ partyId: 'party::123' });
const byAlias = await connection.resolveCredentials({ a: 'alice.5n.xyz' });
```

Convenience methods: `resolve(query)` for forward lookup, `reverseResolve(partyId)` for reverse lookup, and `resolveByAlias(alias)` for alias lookup.

### `resolveByAlias(alias)`

Resolves credentials by purchased alias/FQDN. Maps to `GET /institutions/me/credentials/resolve?a=...`.

**Parameters**:
- `alias` (string, required): Alias label or FQDN, e.g. `alice` or `alice.5n.xyz`

**Returns**: `Promise<ResolveCredentialsResponse>` — `{ credentials: ResolvedCredential[] }`

**Example**:
```typescript
const result = await connection.resolveByAlias('alice.5n.xyz');
```

### `createCredentialsRequest(request)`

Creates a credentials access request (proposal) for a user. Maps to `POST /institutions/me/credentials/request`.

**Parameters**:
- `request.partyId` (string, required): The party ID
- `request.providers` (CredentialProvider[], required): e.g. `['GOOGLE', 'LINKEDIN', 'GITHUB', 'DISCORD', 'TWITTER', 'REDDIT']`

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
- **Credential**: `partyId`, `email` (registered account), `contractId`, `provider`, `kycStatus`, `expirationDate`, `issuedAt`, `freshness`, `metadata`
- **UsersListResponse**: `{ items: InstitutionUser[], pagination, totalCount? }`
- **HumanScoresListResponse**: `{ items: HumanScoreItem[], pagination }`
- **HumanScoreItem**: `{ partyId: string, email: string, humanScore: HumanScoreResult }`
- **HumanScoreResult**: `totalScore`, `confidenceLevel`, `breakdown`, `badges`, `details`
- **ResolveCredentialsResponse**: `{ credentials: ResolvedCredential[] }`
- **ResolvedCredential**: `partyId`, `userId`, `email` (registered account), `username`, `firstName`, `lastName`, `kycProvider`, `contractId`, `metadata`
- **GenerateVerificationLinkResponse**: `{ verificationUrl, token }`
- **VerificationStatusResponse**: `status`, `color`, `isActive`, `contractId`, `credentialData`, etc.

## Error Handling

The SDK throws `UnauthorizedError` or `APIError` for failed requests. Use try/catch and check `error.status` or `error.message`.

## Token Management

The SDK handles OAuth2 token acquisition, caching, and refresh automatically.

## Next Steps

- [Examples](examples.md) - Code examples
- [API Reference](api-reference.md) - REST API endpoints
