# API Documentation

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "555-1234",
  "role": "client"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "user_...",
  "message": "User registered successfully. Please verify your email.",
  "verificationToken": "verify_..."
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123",
  "mfaCode": "123456"
}
```

**Response (without 2FA):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "id": "user_...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client"
  }
}
```

**Response (2FA required):**
```json
{
  "mfa_required": true,
  "message": "MFA code required"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 2FA (Two-Factor Authentication)

#### Setup 2FA
```http
POST /api/auth/mfa/setup
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrUrl": "otpauth://totp/RossTax:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=RossTax",
  "message": "Scan the QR code with your authenticator app"
}
```

#### Verify and Enable 2FA
```http
POST /api/auth/mfa/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA enabled successfully"
}
```

#### Disable 2FA
```http
POST /api/auth/mfa/disable
Authorization: Bearer <token>
Content-Type: application/json

{
  "password": "SecurePass123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "2FA disabled successfully"
}
```

### User Management

#### Get Current User
```http
GET /api/users/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user_...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "client",
    "status": "active"
  }
}
```

### Document Management

#### Upload Document
```http
POST /api/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary>
returnId: tax_return_123
documentType: w2
```

**Response:**
```json
{
  "success": true,
  "documentId": "doc_...",
  "key": "2024/user_.../doc_...",
  "size": 1234567,
  "message": "Document uploaded successfully"
}
```

#### List Documents
```http
GET /api/documents?returnId=tax_return_123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "documents": [
    {
      "id": "doc_...",
      "fileName": "w2-2024.pdf",
      "fileType": "application/pdf",
      "fileSize": 1234567,
      "documentType": "w2",
      "uploadedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### Download Document
```http
GET /api/documents/{documentId}
Authorization: Bearer <token>
```

**Response:** Binary file data with appropriate Content-Type header

### IRS Integration

#### Transmit Return to IRS
```http
POST /api/irs/transmit
Authorization: Bearer <token>
Content-Type: application/json

{
  "returnId": "tax_return_123",
  "taxYear": 2024,
  "taxpayerSSN": "123456789",
  "filingStatus": "Single",
  "returnData": {...}
}
```

**Response:**
```json
{
  "success": true,
  "transmissionId": "T1234567890",
  "submissionId": "12345678901234567890",
  "message": "Return transmitted to IRS successfully"
}
```

#### Check IRS Status
```http
GET /api/irs/status?submissionId=12345678901234567890
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "status": "acknowledged",
  "ackCode": "0000",
  "ackMessage": "Accepted - Return transmitted successfully",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Health Check

#### System Health
```http
GET /api/health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Error Responses

All endpoints return errors in a consistent format:

```json
{
  "error": "Error message",
  "details": "Additional details if available"
}
```

### Common HTTP Status Codes

- **200 OK** - Request succeeded
- **201 Created** - Resource created successfully
- **400 Bad Request** - Invalid input data
- **401 Unauthorized** - Authentication required or invalid token
- **403 Forbidden** - Insufficient permissions
- **404 Not Found** - Resource not found
- **409 Conflict** - Resource already exists
- **500 Internal Server Error** - Server error
- **501 Not Implemented** - Endpoint not yet implemented

## Rate Limiting

Rate limiting is applied per user:
- Authentication endpoints: 10 requests per minute
- General API endpoints: 100 requests per minute
- File uploads: 20 requests per hour

Exceeded limits return:
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

## CORS

The API supports CORS for the following origins:
- Development: `http://localhost:3000`, `http://localhost:8788`
- Production: Configured per deployment

## Webhooks (Future)

Webhook endpoints for IRS acknowledgment notifications will be added in future updates.

## SDK Examples

### JavaScript/TypeScript

```typescript
// Login
const response = await fetch('https://api.rosstax.com/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'SecurePass123'
  })
});

const { token } = await response.json();

// Make authenticated request
const userResponse = await fetch('https://api.rosstax.com/api/users/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const user = await userResponse.json();
```

### cURL

```bash
# Login
TOKEN=$(curl -X POST https://api.rosstax.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123"}' \
  | jq -r '.token')

# Get current user
curl https://api.rosstax.com/api/users/me \
  -H "Authorization: Bearer $TOKEN"
```

## Testing

Use the following test accounts (development only):

- **Admin**: admin@rosstax.com / Admin@123
- **ERO**: ero@rosstax.com / Ero@123
- **Client**: client@rosstax.com / Client@123
- **Demo**: demo@rosstax.com / Demo@123

**Note:** Change these passwords immediately in production environments.
