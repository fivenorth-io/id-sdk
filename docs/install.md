# Installation

This guide will help you get started with the 5N ID SDK or REST API integration.

## Prerequisites

Before you begin, you'll need:

1. **Client Credentials**: Request access to the 5N ID service to obtain:
   - Client ID
   - Client Secret

2. **Network Selection**: Choose your environment:
   - `devnet` - For development and testing
   - `mainnet` - For production use

3. **Node.js Environment** (for SDK): If using the SDK, ensure you have Node.js 16+ installed

## SDK Installation

Install the 5N ID SDK using your preferred package manager:

### npm

```bash
npm install @fivenorth/id-sdk
```

### yarn

```bash
yarn add @fivenorth/id-sdk
```

### bun

```bash
bun add @fivenorth/id-sdk
```

## Initialization

### SDK Initialization

After installing the package, initialize the SDK connection:

```typescript
import { idSdk } from '@fivenorth/id-sdk';

// Connect to devnet
const connection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret',
  network: 'devnet' // or 'mainnet' for production
});

// If network is not specified, it defaults to 'mainnet'
const mainnetConnection = await idSdk.connect({
  clientId: 'your-client-id',
  clientSecret: 'your-client-secret'
});
```

### REST API Setup

For REST API integration, you'll need to:

1. **Obtain an Access Token**: Use OAuth2 `client_credentials` flow

```bash
curl -X POST https://id.devnet.cantonloop.com/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=your-client-id" \
  -d "client_secret=your-client-secret"
```

2. **Use the Token**: Include the access token in subsequent API requests

```bash
curl -X GET "https://id.devnet.cantonloop.com/api/v1/institutions/me/credentials?offset=0&limit=10" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Environment Configuration

### Base URLs

- **Devnet**: `https://id.devnet.cantonloop.com`
- **Mainnet**: `https://id.mainnet.cantonloop.com` (or your mainnet URL)

### API Versioning

The API uses versioning in the path. Current version is `v1`. Institution endpoints are under `/api/v1/institutions/me/` (e.g. `/institutions/me/users`, `/institutions/me/credentials`, `/institutions/me/credentials/resolve`). Verification endpoints are under `/api/v1/verification/`.

## Authentication

Both SDK and REST API use OAuth2 `client_credentials` flow:

1. Client sends credentials to the token endpoint
2. Server returns an access token
3. Client includes the token in the `Authorization` header: `Bearer <token>`
4. Token expires after a set period (typically 1 hour)
5. SDK automatically refreshes tokens; REST API users must handle refresh manually

## Next Steps

- [API Reference](api-reference.md) - Learn about available REST API endpoints
- [SDK Reference](sdk-reference.md) - Explore SDK methods and usage
- [Examples](examples.md) - See code examples and integration patterns
