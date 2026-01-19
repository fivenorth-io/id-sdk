# API Reference

Complete reference for the 5N ID REST API endpoints.

## Base URL

- **Devnet**: `https://id.devnet.cantonloop.com`
- **Mainnet**: `https://id.mainnet.cantonloop.com`

## Authentication

All endpoints (except public endpoints) require OAuth2 authentication using the `client_credentials` flow. Include the access token in the `Authorization` header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Obtain Access Token

Request an OAuth2 access token using client credentials.

**Endpoint**: `POST /oauth/token`

**Content-Type**: `application/x-www-form-urlencoded`

**Parameters**:
- `grant_type`: `client_credentials` (required)
- `client_id`: Your client ID (required)
- `client_secret`: Your client secret (required)

**Response**:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIs...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Create Credentials Access Request

Initiate a request to access credentials for a party.

**Endpoint**: `POST /api/v1/credentials-access-request`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "partyId": "party::identifier",
  "providers": ["provider1", "provider2"]
}
```

**Response**:
```json
{
  "requestId": "req_123456",
  "status": "pending",
  "partyId": "party::identifier"
}
```

### Get Credentials

Retrieve credentials associated with the authenticated institution.

**Endpoint**: `GET /api/v1/credentials`

**Headers**:
- `Authorization: Bearer <token>`

**Query Parameters**:
- `offset`: Pagination offset (default: 0)
- `limit`: Number of results per page (default: 20, max: 100)

**Response**:
```json
{
  "credentials": [
    {
      "contractId": "contract_123",
      "partyId": "party::identifier",
      "status": "verified",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "offset": 0,
  "limit": 20
}
```

### Get Credentials by Party ID

Retrieve credentials for a specific party.

**Endpoint**: `GET /api/v1/credentials/:partyId`

**Headers**:
- `Authorization: Bearer <token>`

**Path Parameters**:
- `partyId`: The party identifier

**Response**:
```json
{
  "contractId": "contract_123",
  "partyId": "party::identifier",
  "status": "verified",
  "createdAt": "2024-01-01T00:00:00Z",
  "providers": ["provider1", "provider2"]
}
```

### Generate Verification Link

Generate a verification link for a single credential.

**Endpoint**: `POST /api/v1/generate-link`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "contractId": "contract_123"
}
```

**Response**:
```json
{
  "token": "verify_token_abc123",
  "link": "https://id.devnet.cantonloop.com/verify/token_abc123",
  "expiresAt": "2024-01-02T00:00:00Z"
}
```

### Generate Verification Links (Batch)

Generate multiple verification links in a single request.

**Endpoint**: `POST /api/v1/generate-links-batch`

**Headers**:
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body**:
```json
{
  "requests": [
    { "contractId": "contract_123" },
    { "contractId": "contract_456" }
  ]
}
```

**Response**:
```json
{
  "links": [
    {
      "contractId": "contract_123",
      "token": "verify_token_abc123",
      "link": "https://id.devnet.cantonloop.com/verify/token_abc123",
      "expiresAt": "2024-01-02T00:00:00Z"
    },
    {
      "contractId": "contract_456",
      "token": "verify_token_def456",
      "link": "https://id.devnet.cantonloop.com/verify/token_def456",
      "expiresAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

### Check Verification Status (Public)

Check the verification status of a token. This is a public endpoint that does not require authentication.

**Endpoint**: `GET /api/v1/check/:token`

**Path Parameters**:
- `token`: The verification token

**Response**:
```json
{
  "status": "verified",
  "contractId": "contract_123",
  "partyId": "party::identifier",
  "verifiedAt": "2024-01-01T12:00:00Z"
}
```

### Get Human Score

Get the identity verification "human score" with detailed breakdown.

**Endpoint**: `GET /api/v1/kyc/human-score`

**Headers**:
- `Authorization: Bearer <token>`

**Response**:
```json
{
  "totalScore": 95,
  "badges": [
    {
      "name": "identity_verified",
      "status": "verified"
    },
    {
      "name": "document_verified",
      "status": "verified"
    }
  ],
  "breakdown": {
    "identity": 100,
    "document": 90,
    "biometric": 95
  }
}
```

## Error Responses

All endpoints may return error responses in the following format:

```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {}
}
```

### Common Error Codes

- `401 Unauthorized`: Invalid or expired access token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `400 Bad Request`: Invalid request parameters
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

## Rate Limiting

API requests are subject to rate limiting. When the rate limit is exceeded, the API returns a `429 Too Many Requests` response. Include retry logic with exponential backoff in your integration.

## Next Steps

- [SDK Reference](sdk-reference.md) - Use the SDK for easier integration
- [Examples](examples.md) - See practical code examples
