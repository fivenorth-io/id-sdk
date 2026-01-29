# Overview

Welcome to the **5N ID SDK**, a unified identity layer for the Canton ecosystem. The 5N ID service provides secure, tamper-proof identity verification and credential management through smart contracts on the Canton network.

The 5N ID SDK offers both a REST API and a TypeScript/JavaScript SDK, giving you flexibility in how you integrate identity verification into your applications. The SDK provides type-safe methods with automatic OAuth2 token management, making it easier to work with the identity service.

## Features

- **Unified Identity Layer**: Single source of identity across the Canton ecosystem
- **Smart Contract Storage**: Identity data stored on-chain for tamper-proof, auditable records
- **Dual Integration Options**: Choose between REST API or TypeScript/JavaScript SDK
- **Type-Safe SDK**: Full TypeScript support with automatic type checking
- **Automatic Token Management**: SDK handles OAuth2 token acquisition and refresh
- **Network Support**: Works with both devnet and mainnet environments
- **Human Score Verification**: Get identity verification scores with detailed breakdowns
- **Batch Operations**: Generate multiple verification links in a single request

## What is 5N ID?

5N ID is an identity verification system that provides a unified identity layer across the Canton ecosystem. It enables institutions and applications to:

- Request and manage identity credentials for parties
- Generate verification links for credential verification
- Check verification status of credentials
- Access human score metrics for identity verification

All identity data is stored on smart contracts, ensuring tamper-proof, auditable records that work seamlessly across devnet and mainnet environments.

## Integration Options

### REST API

The REST API provides fine-grained control over all operations. You'll need to:

- Manually handle OAuth2 authentication using the `client_credentials` flow
- Make direct HTTP requests to the API endpoints
- Manage token expiration and refresh

### TypeScript/JavaScript SDK

The SDK (`@fivenorth/id-sdk`) provides a simpler, type-safe interface that:

- Automatically handles OAuth2 token acquisition and refresh
- Provides type-safe methods for all operations
- Maps directly to the REST API endpoints
- Simplifies error handling and retries

## Use Cases

- **Identity Verification**: Verify the identity of parties in your Canton applications
- **Credential Management**: Request, store, and manage identity credentials
- **Audit Trails**: Maintain tamper-proof audit trails of identity verification activities
- **Multi-Party Applications**: Manage identities across multiple parties in distributed applications

## Next Steps

- [Installation Guide](install.md) - Get started with the SDK or REST API
- [API Reference](api-reference.md) - Complete REST API documentation
- [SDK Reference](sdk-reference.md) - TypeScript/JavaScript SDK methods
- [Examples](examples.md) - Code examples and integration patterns
