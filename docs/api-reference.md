# API Reference

Complete reference for the 5N ID REST API endpoints. All institution endpoints are under `/api/v1/institutions/me/`. Verification endpoints are under `/api/v1/verification/`.

## Base URL

- **Devnet**: `https://id.devnet.cantonloop.com/api/v1`
- **Mainnet**: `https://id.cantonloop.com/api/v1`

## Authentication

All endpoints except verification check require OAuth2 using the `client_credentials` flow. Include the token in the request:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Obtain Access Token

**Endpoint**: `POST` (authorization server; see integration guide for token URL per environment)

**Content-Type**: `application/x-www-form-urlencoded`

**Body**: `grant_type=client_credentials&client_id=...&client_secret=...`

**Response**: `{ "access_token": "...", "expires_in": 3600, ... }`

### GET /institutions/me/users

Returns the list of users (KYC data requests) for the authenticated institution.

**Query Parameters** (optional): `offset`, `limit`, `orderBy`, `orderType`, `status`, `reqStatus`, `kycStatus`, `search`

**Response**: `{ "items": [...], "pagination": { "offset", "limit", "total" }, "totalCount"?: number }`

### GET /institutions/me/human-scores

Returns human scores with pagination or filtered by party IDs.

**Query Parameters** (optional): `offset`, `limit`, `partyIds` (repeatable or comma-separated)

**Response**: `{ "items": [{ "partyId", "humanScore" }, ...], "pagination": { "offset", "limit", "total" } }`

### GET /institutions/me/human-scores/:partyId

Returns the human score for a single party.

**Path**: `partyId` (required)

**Response**: `{ "partyId": "...", "humanScore": { "totalScore", "confidenceLevel", "breakdown", "badges", "details" } }`

### GET /institutions/me/credentials

Returns credentials with pagination and/or filter by party IDs.

**Query Parameters** (optional): `offset`, `limit`, `partyIds` (repeatable or comma-separated)

**Response**: `{ "items": [Credential, ...], "pagination": { "offset", "limit", "total" } }`

Each `Credential` includes: `partyId`, `contractId`, `provider`, `kycStatus`, `expirationDate`, `issuedAt`, `freshness`, `metadata`.

### GET /institutions/me/credentials/:partyId

Returns credentials disclosed by the given party to the institution.

**Path**: `partyId` (required)

**Response**: Array of credential objects.

Each credential includes: `partyId`, `contractId`, `provider`, `kycStatus`, `expirationDate`, `issuedAt`, `freshness`, `metadata`.

### GET /institutions/me/credentials/resolve

Resolve credentials by email/username (forward) or party ID (reverse). Provide exactly one of `q` or `partyId`.

**Query Parameters**: `q` (email/username) OR `partyId` (required, one of them)

**Response**: `{ "credentials": [ResolvedCredential, ...] }`

Each `ResolvedCredential` includes: `partyId`, `userId`, `email`, `username`, `firstName`, `lastName`, `kycProvider`, `contractId`, `metadata`.

### POST /institutions/me/credentials/request

Creates a credentials access request (proposal) for a user.

**Body**: `{ "partyId": "party::...", "providers": ["GOOGLE", "LINKEDIN", "GITHUB", "DISCORD", "TWITTER", "REDDIT"] }`

**Response**: `204 No Content` on success

### POST /verification/generate-link

Generate a short-lived verification link for a credential.

**Body**: `{ "contractId": "..." }`

**Response**: `{ "verificationUrl": "...", "token": "..." }`

### POST /verification/generate-links-batch

Generate verification links for multiple credentials (max 100). Body: `{ "requests": [{ "contractId": "..." }, ...] }`

**Response**: `{ "results": [{ "contractId", "result"?: { "verificationUrl", "token" }, "error"?: { "message" } }, ...] }`

### GET /verification/check/:token

**Public** (no authentication). Returns verification status for a token.

**Response**: `{ "status", "color", "isActive", "contractId", "credentialData", ... }`

## Error Responses

- `400` – Invalid parameters (e.g. both `q` and `partyId` provided to resolve)
- `401` / `403` – Invalid or expired token
- `404` – Resource not found (e.g. token not found for check)
- `429` – Rate limit exceeded
- `500` – Server error

## Next Steps

- [SDK Reference](sdk-reference.md) – TypeScript/JavaScript SDK
- [Examples](examples.md) – Code examples
