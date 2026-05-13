# Auth0 Integration Research

## Overview

The platform uses Auth0 Universal Login (hosted forms) with the **Authorization Code Flow**. Tokens are never stored in the browser. Instead, the backend encrypts tokens using a rotating key strategy and stores them in PostgreSQL. The browser holds only a signed session cookie containing a token reference ID and safe user claims.

---

## Authentication Flow

```
1. React redirects user to Auth0 Universal Login
   GET https://{AUTH0_DOMAIN}/authorize
     ?response_type=code
     &client_id={CLIENT_ID}
     &redirect_uri=https://app.contractintel.io/auth/callback
     &scope=openid profile email offline_access
     &state={csrf_token}

2. User authenticates on Auth0 hosted page

3. Auth0 redirects back to NestJS callback endpoint
   GET /api/v1/auth/callback?code=xxx&state=yyy

4. NestJS exchanges code for tokens
   POST https://{AUTH0_DOMAIN}/oauth/token
   {
     grant_type: "authorization_code",
     client_id: AUTH0_CLIENT_ID,
     client_secret: AUTH0_CLIENT_SECRET,
     code: "xxx",
     redirect_uri: "https://app.contractintel.io/auth/callback"
   }
   Response: { access_token, id_token, refresh_token, expires_in }

5. NestJS encrypts and stores tokens (see Token Storage below)

6. NestJS sets httpOnly session cookie and redirects React to dashboard

7. Every subsequent API request includes cookie automatically

8. NestJS reads cookie → decrypts token → validates → processes request

9. On token expiry → use refresh token → new tokens → new encrypted row
```

---

## Token Storage Strategy

Adapted from a proven implementation using rotating encryption keys.

### Encryption Scheme

```
Login / Token Exchange:
│
├─► GetRandomKeyName()
│     → selects a random key name from configured list
│     → e.g., "ContractIntel-Token-Key-3"
│
├─► SecretsService.getSecret("ContractIntel-Token-Key-3")
│     → fetches 256-bit base key from GCP Secret Manager (prod)
│     → or from env var (local/demo)
│
├─► crypto.randomBytes(32) → salt
│
├─► PBKDF2(key, salt, iterations=100000, keylen=32, digest='sha256')
│     → derives 256-bit AES key
│
├─► crypto.randomBytes(16) → IV
│
├─► AES-256-CBC encrypt(accessToken + ":" + refreshToken + ":" + idToken)
│
├─► Base64URL(IV + ciphertext) → stored as TokenRecord.encryptedPayload
│
└─► Store in DB:
      TokenRecord {
        id: UUID,
        encryptedPayload: string,   ← IV + ciphertext, base64url
        salt: string,               ← base64url
        keyName: string,            ← e.g. "ContractIntel-Token-Key-3"
        userId: string,
        expiresAt: Date,
        createdAt: Date
      }
```

### Session Cookie

After storing the token record, NestJS sets a signed session cookie:

```
Cookie: session=<signed_payload>
  httpOnly: true
  secure: true (production)
  sameSite: Strict
  path: /
  maxAge: 7 days (matches refresh token lifetime)
```

**Cookie payload (signed with APP_SECRET, not encrypted):**
```json
{
  "tokenRecordId": "uuid-of-token-record",
  "keyName": "ContractIntel-Token-Key-3",
  "userId": "auth0|abc123",
  "email": "user@lawfirm.com",
  "name": "Jane Smith",
  "roles": ["lead_reviewer"],
  "iat": 1234567890
}
```

The cookie contains **no sensitive data** — only the reference to the encrypted token record and safe user claims. The actual tokens never leave the server.

---

## Every API Request Flow

```
Request arrives with session cookie
│
├─► Parse + verify cookie signature (APP_SECRET)
│     → extract tokenRecordId, keyName, userId, roles
│
├─► Fetch TokenRecord from DB by tokenRecordId
│     → get encryptedPayload, salt
│
├─► SecretsService.getSecret(keyName)
│     → fetch base key
│
├─► PBKDF2(key, salt) → re-derive AES key
│
├─► AES-256-CBC decrypt(encryptedPayload)
│     → recover accessToken, refreshToken, idToken
│
├─► Check access token expiry (decode JWT, check exp claim)
│     → if valid: attach user to request context, proceed
│     → if expired: trigger token refresh (see below)
│
└─► Attach to request:
      req.user = {
        id: userId,
        email,
        name,
        roles,
        accessToken  ← available for downstream API calls if needed
      }
```

---

## Token Refresh Flow

```
Access token expired:
│
├─► Use refreshToken from decrypted payload
│
├─► POST https://{AUTH0_DOMAIN}/oauth/token
│     { grant_type: "refresh_token", refresh_token: "..." }
│
├─► Receive new access_token, id_token, (possibly new refresh_token)
│
├─► Generate new salt + select new random key name
│
├─► Encrypt new token set → new TokenRecord row in DB
│
├─► Delete old TokenRecord row
│
├─► Update session cookie with new tokenRecordId + keyName
│
└─► Continue processing original request
```

If the refresh token is expired or revoked → return `401 Unauthorized` → React redirects to login.

---

## Prisma Schema

```prisma
model TokenRecord {
  id               String   @id @default(uuid())
  userId           String
  encryptedPayload String   // Base64URL(IV + AES-256-CBC ciphertext)
  salt             String   // Base64URL(32 random bytes)
  keyName          String   // e.g. "ContractIntel-Token-Key-3"
  expiresAt        DateTime
  createdAt        DateTime @default(now())

  @@index([userId])
  @@index([expiresAt]) // for cleanup job
}
```

---

## NestJS Implementation

### Auth Module Structure

```
src/modules/auth/
  domain/
    token-record.entity.ts
    token-record.repository.ts    ← interface
  application/
    commands/
      exchange-code.command.ts
      exchange-code.handler.ts
      refresh-tokens.command.ts
      refresh-tokens.handler.ts
    queries/
      get-current-user.query.ts
      get-current-user.handler.ts
  infrastructure/
    auth0.adapter.ts              ← wraps Auth0 /oauth/token calls
    token-encryption.service.ts  ← PBKDF2 + AES-256-CBC
    prisma-token-record.repository.ts
    auth.controller.ts            ← /auth/callback, /auth/logout, /auth/me
    session-cookie.service.ts     ← sign/verify/set/clear cookie
    auth.module.ts
    guards/
      session-auth.guard.ts       ← reads cookie, decrypts token
      roles.guard.ts
    decorators/
      current-user.decorator.ts
      roles.decorator.ts
      public.decorator.ts
```

### Key Endpoints

```
GET  /api/v1/auth/login          → redirect to Auth0 Universal Login
GET  /api/v1/auth/callback       → exchange code, set cookie, redirect to app
POST /api/v1/auth/logout         → clear cookie, revoke refresh token at Auth0
GET  /api/v1/auth/me             → return current user from cookie claims
```

### SessionAuthGuard

```typescript
@Injectable()
export class SessionAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest()

    // Skip for @Public() endpoints
    if (this.reflector.get(IS_PUBLIC_KEY, context.getHandler())) {
      return true
    }

    // Parse and verify session cookie
    const session = this.sessionCookieService.parse(request)
    if (!session) throw new UnauthorizedException()

    // Fetch token record from DB
    const tokenRecord = await this.tokenRepo.findById(session.tokenRecordId)
    if (!tokenRecord) throw new UnauthorizedException()

    // Decrypt tokens
    const tokens = await this.tokenEncryption.decrypt(tokenRecord)

    // Check expiry, refresh if needed
    const validTokens = await this.ensureValidTokens(tokens, tokenRecord, request)

    // Attach user to request
    request.user = {
      id: session.userId,
      email: session.email,
      name: session.name,
      roles: session.roles,
      accessToken: validTokens.accessToken,
    }

    return true
  }
}
```

---

## Security Considerations

- **Tokens never touch the browser** — only a signed reference cookie
- **Rotating encryption keys** — compromise of one key does not expose all tokens
- **PBKDF2 key derivation** — brute-force resistant even if DB is compromised
- **Per-token salt** — prevents rainbow table attacks across token records
- **httpOnly + Secure + SameSite=Strict** — cookie cannot be read by JS, not sent cross-origin
- **Token record cleanup** — a scheduled job deletes expired TokenRecord rows daily
- **Refresh token rotation** — Auth0 issues a new refresh token on each use (configure in Auth0 dashboard)

---

## Auth0 Dashboard Configuration

```
Application Type: Regular Web Application
Allowed Callback URLs: 
  https://app.contractintel.io/api/v1/auth/callback
  http://localhost:3000/api/v1/auth/callback

Allowed Logout URLs:
  https://app.contractintel.io
  http://localhost:3000

Refresh Token Rotation: Enabled
Refresh Token Expiration: Absolute (90 days)
Access Token Lifetime: 3600 seconds (1 hour)

Scopes requested: openid profile email offline_access
```

---

## Environment Variables

```
# Auth0
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_CLIENT_ID=...
AUTH0_CLIENT_SECRET=...           ← from Secret Manager in production
AUTH0_AUDIENCE=https://api.contractintel.io
AUTH0_CALLBACK_URL=https://app.contractintel.io/api/v1/auth/callback

# Session cookie signing
APP_SECRET=...                    ← 64-byte random secret, from Secret Manager

# Encryption key names (comma-separated list, randomly selected per token)
TOKEN_KEY_NAMES=ContractIntel-Token-Key-1,ContractIntel-Token-Key-2,ContractIntel-Token-Key-3
```

---

## React Integration

```typescript
// React initiates login by navigating to the backend login endpoint
// No Auth0 SDK needed in the frontend — the backend handles everything

const login = () => {
  window.location.href = '/api/v1/auth/login'
}

const logout = async () => {
  await fetch('/api/v1/auth/logout', { method: 'POST' })
  window.location.href = '/'
}

// Check if user is logged in
const { data: user } = useQuery({
  queryKey: ['currentUser'],
  queryFn: () => apiClient.get('/api/v1/auth/me'),
  retry: false,
})
```

The cookie is sent automatically with every request — no token management in React at all.
