# Examples

Practical code examples for integrating with the 5N ID SDK and REST API.

## SDK Examples

### Basic Connection

```typescript
import { idSdk } from '@fivenorth/id-sdk';

// Connect to devnet
const connection = await idSdk.connect({
  clientId: process.env.ID_CLIENT_ID!,
  clientSecret: process.env.ID_CLIENT_SECRET!,
  network: 'devnet'
});

console.log('Connected to 5N ID service');
```

### Create Credentials Request

```typescript
// Request credentials for a party
const request = await connection.createCredentialsRequest({
  partyId: 'party::alice',
  providers: ['provider1', 'provider2']
});

console.log(`Request ID: ${request.requestId}`);
console.log(`Status: ${request.status}`);
```

### List All Credentials

```typescript
// Get all credentials with pagination
let offset = 0;
const limit = 20;
let allCredentials = [];

while (true) {
  const response = await connection.getCredentials({ offset, limit });
  allCredentials = allCredentials.concat(response.credentials);

  if (response.credentials.length < limit) {
    break; // Last page
  }

  offset += limit;
}

console.log(`Total credentials: ${allCredentials.length}`);
allCredentials.forEach(cred => {
  console.log(`- ${cred.contractId}: ${cred.partyId} (${cred.status})`);
});
```

### Get Credentials for Specific Party

```typescript
try {
  const credential = await connection.getCredentialsByPartyId('party::alice');
  console.log(`Contract ID: ${credential.contractId}`);
  console.log(`Status: ${credential.status}`);
  console.log(`Created: ${credential.createdAt}`);
} catch (error) {
  console.error('Credential not found:', error);
}
```

### Generate Verification Link

```typescript
// Generate a single verification link
const link = await connection.generateVerificationLink({
  contractId: 'contract_123'
});

console.log(`Verification link: ${link.link}`);
console.log(`Token: ${link.token}`);
console.log(`Expires at: ${link.expiresAt}`);

// Share this link with the user for verification
```

### Generate Multiple Verification Links

```typescript
// Generate links for multiple credentials at once
const links = await connection.generateVerificationLinksBatch({
  requests: [
    { contractId: 'contract_123' },
    { contractId: 'contract_456' },
    { contractId: 'contract_789' }
  ]
});

links.links.forEach(link => {
  console.log(`${link.contractId}: ${link.link}`);
});
```

### Check Verification Status

```typescript
// Check if a verification token has been used
const token = 'verify_token_abc123';
const status = await connection.checkVerificationStatus(token);

if (status.status === 'verified') {
  console.log(`Credential ${status.contractId} verified for party ${status.partyId}`);
  console.log(`Verified at: ${status.verifiedAt}`);
} else {
  console.log('Verification pending or not found');
}
```

### Get Human Score

```typescript
// Get identity verification score for a specific party
const score = await connection.getHumanScore('party::identifier');

console.log(`Total Score: ${score.totalScore}/100`);

console.log('\nBadges:');
score.badges.forEach(badge => {
  const icon = badge.status === 'verified' ? '✓' : '✗';
  console.log(`  ${icon} ${badge.name}: ${badge.status}`);
});

console.log('\nBreakdown:');
if (score.breakdown.identity) {
  console.log(`  Identity: ${score.breakdown.identity}/100`);
}
if (score.breakdown.document) {
  console.log(`  Document: ${score.breakdown.document}/100`);
}
if (score.breakdown.biometric) {
  console.log(`  Biometric: ${score.breakdown.biometric}/100`);
}
```

### Forward Lookup: Resolve Credentials by Email or Username

```typescript
// Find credentials when you have a user's email or username
const result = await connection.resolve('user@example.com');

if (result.credentials.length > 0) {
  console.log(`Found ${result.credentials.length} credential(s):`);
  result.credentials.forEach(cred => {
    console.log(`\nParty ID: ${cred.partyId}`);
    console.log(`Provider: ${cred.kycProvider}`);
    console.log(`Email: ${cred.email}`);
    console.log(`Username: ${cred.username}`);
    console.log(`Contract ID: ${cred.contractId}`);
  });
} else {
  console.log('No credentials found for this email/username');
}

// You can also search by username
const result2 = await connection.resolve('johndoe');
```

### Reverse Lookup: Resolve Credentials by Party ID

```typescript
// Find all credentials when you have a user's party ID
const partyId = 'party::04a5835d6cc470817989e9acc1f20c0a::12200d35764b9b490251e499af00626b54516c4f3f1c021c2eb72bf7c72f38662cb0';
const result = await connection.reverseResolve(partyId);

if (result.credentials.length > 0) {
  console.log(`Found ${result.credentials.length} credential(s) for party ${partyId}:`);
  result.credentials.forEach(cred => {
    console.log(`\nProvider: ${cred.kycProvider}`);
    console.log(`Email: ${cred.email}`);
    console.log(`Username: ${cred.username}`);
    console.log(`Name: ${cred.firstName} ${cred.lastName}`);
    console.log(`Contract ID: ${cred.contractId}`);
  });
} else {
  console.log('No credentials found for this party ID');
}
```

### Resolve Credentials (Automatic Forward/Reverse Lookup)

```typescript
// The SDK automatically determines forward or reverse lookup
// Forward lookup by email
const result1 = await connection.resolveCredentials({
  q: 'user@example.com'
});

// Reverse lookup by party ID
const result2 = await connection.resolveCredentials({
  partyId: 'party::123'
});

// This will throw an error - cannot provide both
try {
  await connection.resolveCredentials({
    q: 'user@example.com',
    partyId: 'party::123'
  });
} catch (error) {
  console.error('Error:', error.message);
  // Error: Cannot provide both q and partyId...
}
```

### Complete Workflow Example

```typescript
import { idSdk } from '@fivenorth/id-sdk';

async function verifyPartyIdentity(partyId: string) {
  // 1. Connect to the service
  const connection = await idSdk.connect({
    clientId: process.env.ID_CLIENT_ID!,
    clientSecret: process.env.ID_CLIENT_SECRET!,
    network: 'devnet'
  });

  // 2. Check if credentials already exist
  let credential;
  try {
    credential = await connection.getCredentialsByPartyId(partyId);
    console.log(`Found existing credential: ${credential.contractId}`);
  } catch (error) {
    // 3. Create credentials request if not found
    console.log('No existing credential, creating request...');
    const request = await connection.createCredentialsRequest({
      partyId,
      providers: ['default']
    });
    console.log(`Request created: ${request.requestId}`);

    // Wait for credential to be created (in real app, use polling or webhooks)
    // For this example, we'll assume it's created
    credential = await connection.getCredentialsByPartyId(partyId);
  }

  // 4. Generate verification link
  const link = await connection.generateVerificationLink({
    contractId: credential.contractId
  });

  console.log(`\nVerification link: ${link.link}`);
  console.log(`Share this link with the user to verify their identity`);

  // 5. Get human score
  const score = await connection.getHumanScore(partyId);
  console.log(`\nCurrent human score: ${score.totalScore}/100`);

  return {
    credential,
    verificationLink: link.link,
    score: score.totalScore
  };
}

// Usage
verifyPartyIdentity('party::alice')
  .then(result => console.log('Verification setup complete:', result))
  .catch(error => console.error('Error:', error));
```

## REST API Examples

### Obtain Access Token

```bash
# Get OAuth2 access token
TOKEN_RESPONSE=$(curl -X POST https://id.devnet.cantonloop.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=$CLIENT_ID" \
  -d "client_secret=$CLIENT_SECRET")

ACCESS_TOKEN=$(echo $TOKEN_RESPONSE | jq -r '.access_token')
echo "Access token: $ACCESS_TOKEN"
```

### Create Credentials Request

```bash
curl -X POST https://id.devnet.cantonloop.com/api/v1/credentials-access-request \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "partyId": "party::alice",
    "providers": ["provider1", "provider2"]
  }'
```

### Get Credentials

```bash
# Get first page of credentials
curl -X GET "https://id.devnet.cantonloop.com/api/v1/credentials?offset=0&limit=20" \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### Generate Verification Link

```bash
curl -X POST https://id.devnet.cantonloop.com/api/v1/generate-link \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contractId": "contract_123"
  }'
```

### Check Verification Status (Public)

```bash
# This endpoint doesn't require authentication
curl -X GET https://id.devnet.cantonloop.com/api/v1/check/verify_token_abc123
```

## Error Handling

### SDK Error Handling

```typescript
import { idSdk, IdSdkError } from '@fivenorth/id-sdk';

async function safeGetCredentials(partyId: string) {
  try {
    const connection = await idSdk.connect({
      clientId: process.env.ID_CLIENT_ID!,
      clientSecret: process.env.ID_CLIENT_SECRET!,
      network: 'devnet'
    });

    const credential = await connection.getCredentialsByPartyId(partyId);
    return credential;
  } catch (error) {
    if (error instanceof IdSdkError) {
      switch (error.code) {
        case 'NOT_FOUND':
          console.error('Credential not found');
          return null;
        case 'UNAUTHORIZED':
          console.error('Authentication failed. Check your credentials.');
          throw error;
        case 'RATE_LIMIT':
          console.error('Rate limit exceeded. Please retry later.');
          // Implement retry with exponential backoff
          throw error;
        default:
          console.error(`SDK Error: ${error.message}`);
          throw error;
      }
    } else {
      console.error('Unexpected error:', error);
      throw error;
    }
  }
}
```

## Best Practices

1. **Store Credentials Securely**: Never commit client IDs and secrets to version control. Use environment variables or secret management services.

2. **Handle Token Expiration**: The SDK handles this automatically, but if using REST API, implement token refresh logic.

3. **Implement Retry Logic**: Network requests can fail. Implement retry logic with exponential backoff for transient errors.

4. **Validate Inputs**: Always validate party IDs and contract IDs before making API calls.

5. **Use Pagination**: When fetching lists, use pagination to avoid loading too much data at once.

6. **Monitor Rate Limits**: Be aware of rate limits and implement appropriate throttling.

7. **Error Logging**: Log errors appropriately for debugging while being careful not to expose sensitive information.

## Next Steps

- [SDK Reference](sdk-reference.md) - Complete SDK method documentation
- [API Reference](api-reference.md) - Complete REST API documentation
