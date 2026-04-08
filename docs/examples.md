# Examples

Practical code examples for the 5N ID SDK and API.

## SDK Examples

### Connection

```typescript
import { idSdk } from '@fivenorth/id-sdk';

const connection = await idSdk.connect({
  clientId: process.env.ID_CLIENT_ID!,
  clientSecret: process.env.ID_CLIENT_SECRET!,
  network: 'devnet',
});
```

### getUsers

```typescript
const result = await connection.getUsers({ offset: 0, limit: 20 });
console.log(result.items.length, result.pagination.total);
result.items.forEach(u => console.log(u.partyId, u.kycStatus));
```

### getHumanScores (pagination or party IDs)

```typescript
// By party IDs
const byParties = await connection.getHumanScores({
  partyIds: ['party::user1', 'party::user2'],
});
byParties.items.forEach(item => {
  console.log(item.partyId, item.email, item.humanScore.totalScore);
});

// Paginated
const page = await connection.getHumanScores({ offset: 0, limit: 10 });
```

### getHumanScoreByPartyId

```typescript
const item = await connection.getHumanScoreByPartyId('party::user1');
console.log(item.email, item.humanScore.totalScore, item.humanScore.badges);
```

### getCredentials

```typescript
const result = await connection.getCredentials({ offset: 0, limit: 20 });
console.log(result.items, result.pagination);

const byParty = await connection.getCredentials({ partyIds: ['party::user1'] });

const byRegisteredEmail = await connection.getCredentials({
  emails: ['user@example.com'],
});
```

### getCredentialByPartyId

```typescript
const credentials = await connection.getCredentialByPartyId('party::user1');
credentials.forEach(c => console.log(c.provider, c.kycStatus, c.email));
```

### resolveCredentials

Forward `q` matches metadata email/username/domain or the user’s ID service account username (often their registration email). See [SDK reference](sdk-reference.md#resolvecredentialsoptions).

```typescript
const byEmail = await connection.resolveCredentials({ q: 'user@example.com' });
const byParty = await connection.resolveCredentials({ partyId: 'party::123' });
// Or use resolve(query) and reverseResolve(partyId)
```

### createCredentialsRequest

```typescript
await connection.createCredentialsRequest({
  partyId: 'party::user1',
  providers: ['GOOGLE', 'LINKEDIN', 'GITHUB'],
});
```

### generateVerificationLink / Batch

```typescript
const link = await connection.generateVerificationLink({ contractId: '...' });
console.log(link.verificationUrl, link.token);

const batch = await connection.generateVerificationLinksBatch({
  requests: [{ contractId: '...' }, { contractId: '...' }],
});
batch.results.forEach(r => {
  if (r.result) console.log(r.result.verificationUrl);
});
```

### checkVerificationStatus

```typescript
const status = await connection.checkVerificationStatus('token-from-url');
console.log(status.status, status.isActive, status.credentialData);
```

### Error handling

```typescript
import { UnauthorizedError, APIError } from '@fivenorth/id-sdk';

try {
  const credentials = await connection.getCredentialByPartyId('party::user1');
  return credentials;
} catch (error) {
  if (error instanceof UnauthorizedError) {
    console.error('Authentication failed');
  } else if (error instanceof APIError) {
    console.error('API error:', error.status, error.message);
  }
  throw error;
}
```

## REST API (curl)

### Token (example; use your auth server URL)

```bash
curl -X POST "$TOKEN_URL" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials&client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET"
```

### GET credentials

```bash
curl -X GET "https://id.devnet.cantonloop.com/api/v1/institutions/me/credentials?offset=0&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### GET human scores (with optional `emails` query, same as credentials list)

```bash
curl -X GET "https://id.devnet.cantonloop.com/api/v1/institutions/me/human-scores?emails=user%40example.com&offset=0&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### POST credentials request

```bash
curl -X POST "https://id.devnet.cantonloop.com/api/v1/institutions/me/credentials/request" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"partyId":"party::user1","providers":["GOOGLE","LINKEDIN"]}'
```

### Check verification (public)

```bash
curl -X GET "https://id.devnet.cantonloop.com/api/v1/verification/check/$TOKEN"
```

## Next Steps

- [SDK Reference](sdk-reference.md)
- [API Reference](api-reference.md)
