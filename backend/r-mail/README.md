# R-MAIL Backend

SaaS email service backend built with Node.js, Express, and MongoDB.

## Features

- User authentication with JWT
- Role-based access control (admin, support, client, external)
- Permission system (send, receive, manage_users, manage_domains, view_audit, manage_compliance)
- Internal and external email delivery
- Email folders (inbox, sent, drafts, trash, spam, archive)
- Domain management
- Comprehensive audit logging
- SMTP integration for external email delivery

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/verify` - Verify token

### Emails
- `GET /api/emails` - Get user's emails (with folder filter)
- `GET /api/emails/:id` - Get single email
- `POST /api/emails` - Compose and send email
- `PATCH /api/emails/:id` - Update email (mark read, star, move)
- `DELETE /api/emails/:id` - Delete email

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user (admin only)
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user (admin only)
- `POST /api/users/:id/password` - Update password

### Domains
- `GET /api/domains` - Get all domains
- `GET /api/domains/:id` - Get domain by ID
- `POST /api/domains` - Create domain
- `PATCH /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain
- `POST /api/domains/:id/verify` - Verify domain

### Audit Logs
- `GET /api/audit` - Get audit logs
- `GET /api/audit/:id` - Get audit log by ID
- `GET /api/audit/stats/summary` - Get audit statistics

## User Roles

- **admin**: Full access to all features
- **support**: Can manage users and view audit logs
- **client**: Can send and receive emails
- **external**: Limited external recipient access

## Permissions

- `send`: Send emails
- `receive`: Receive and read emails
- `manage_users`: Create, update, delete users
- `manage_domains`: Create, update, delete domains
- `view_audit`: View audit logs
- `manage_compliance`: Manage compliance settings

## Environment Variables

See `.env.example` for all available configuration options.
