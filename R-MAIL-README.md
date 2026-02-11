# R-MAIL - SaaS Email Service

A comprehensive SaaS web-based email service module for the Ross Tax Prep monorepo. R-MAIL provides enterprise-grade email functionality with role-based access control, comprehensive audit logging, and both internal and external email delivery capabilities.

## Features

### Core Functionality
- **User Authentication**: Secure JWT-based authentication
- **Role-Based Access Control**: Four user roles (Admin, Support, Client, External)
- **Granular Permissions**: Fine-grained permission system (send, receive, manage_users, manage_domains, view_audit, manage_compliance)
- **Email Management**: Full email lifecycle (compose, send, receive, read, archive, delete)
- **Domain Management**: Custom domain support with verification
- **Audit Logging**: Comprehensive activity tracking for compliance

### Email Features
- Internal and external email delivery
- Email folders (Inbox, Sent, Drafts, Trash, Spam, Archive)
- Star/flag messages
- Mark as read/unread
- HTML and plain text support
- CC and BCC support
- Attachment support (ready for implementation)

### Admin Features
- User management dashboard
- Domain management and verification
- Audit log viewer with filtering
- System statistics and monitoring

## Architecture

This module is part of a monorepo structure:

```
ross-tax-prep-frontenddanc/
├── backend/
│   └── r-mail/              # R-MAIL Backend (Node.js/Express)
│       ├── models/          # MongoDB models
│       ├── routes/          # API routes
│       ├── middleware/      # Auth, permissions, audit
│       ├── utils/           # Helper functions
│       ├── server.js        # Express server
│       └── package.json     # Backend dependencies
│
└── app/
    └── r-mail/              # R-MAIL Frontend (Next.js)
        ├── auth/            # Authentication pages
        ├── compose/         # Email composition
        ├── inbox/           # Email inbox
        ├── admin/           # Admin dashboard
        ├── users/           # User management
        ├── domains/         # Domain management
        ├── audit/           # Audit logs
        ├── layout.tsx       # R-MAIL layout
        └── page.tsx         # R-MAIL home
```

## Setup Instructions

### Backend Setup

1. Navigate to the R-MAIL backend directory:
```bash
cd backend/r-mail
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `SMTP_*`: SMTP settings for external email delivery
- `ALLOWED_DOMAINS`: Comma-separated list of internal domains

4. Start the backend server:
```bash
npm start
```

The backend API will run on `http://localhost:5000`

### Frontend Setup

The frontend is integrated with the main Next.js application. No separate setup required.

1. From the root directory, start the Next.js development server:
```bash
npm run dev
```

2. Access R-MAIL at `http://localhost:3000/r-mail`

### MongoDB Setup

Ensure MongoDB is running:
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your existing MongoDB instance
```

## User Roles

### Admin
- Full system access
- All permissions automatically granted
- Can manage users, domains, and view audit logs

### Support
- User management capabilities
- Can view audit logs
- Cannot manage domains

### Client
- Standard email user
- Can send and receive emails
- No administrative access

### External
- Limited recipient access
- Restricted permissions
- For external email recipients

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

### Users (Admin/Support only)
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `POST /api/users` - Create user
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `POST /api/users/:id/password` - Update password

### Domains (Admin only)
- `GET /api/domains` - Get all domains
- `GET /api/domains/:id` - Get domain by ID
- `POST /api/domains` - Create domain
- `PATCH /api/domains/:id` - Update domain
- `DELETE /api/domains/:id` - Delete domain
- `POST /api/domains/:id/verify` - Verify domain

### Audit Logs (Admin/Support only)
- `GET /api/audit` - Get audit logs (with filters)
- `GET /api/audit/:id` - Get audit log by ID
- `GET /api/audit/stats/summary` - Get audit statistics

## Permissions System

The following permissions are available:

- `send` - Send emails
- `receive` - Receive and read emails
- `manage_users` - Create, update, delete users
- `manage_domains` - Create, update, delete domains
- `view_audit` - View audit logs and compliance data
- `manage_compliance` - Manage compliance settings

## Workflows

### Email Composition Workflow
1. User navigates to compose page
2. Fills in recipients, subject, and body
3. System validates email addresses
4. System determines if email is internal or external
5. For internal: Deliver immediately to recipient's inbox
6. For external: Queue for SMTP delivery
7. System creates audit log entry

### Email Delivery Workflow (Internal)
1. Email saved to sender's "sent" folder
2. Email copied to recipient's "inbox" folder
3. Mark as delivered immediately
4. Create audit log entry

### Email Delivery Workflow (External)
1. Email queued for delivery
2. System attempts SMTP delivery
3. Update status based on result
4. Retry logic for failures
5. Create audit log entry

### Compliance & Audit Workflow
1. All user actions logged automatically
2. Middleware captures request details
3. Audit log created with:
   - User information
   - Action performed
   - Resource affected
   - Timestamp
   - IP address
   - Status (success/failure)
4. Admin can filter and export logs

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Permission-based authorization
- Audit logging for compliance
- HTML sanitization for email bodies
- Input validation
- CORS protection
- Helmet.js security headers

## Future Enhancements

- File attachment handling
- Email search functionality
- Email templates
- Scheduled email sending
- Email forwarding and auto-reply
- Spam filtering
- Email encryption (PGP/S/MIME)
- Two-factor authentication
- Email signatures
- Contact management
- Calendar integration
- Mobile app support
- WebSocket for real-time updates
- Advanced audit analytics
- Compliance reporting (GDPR, HIPAA)

## Troubleshooting

### Backend won't start
- Ensure MongoDB is running
- Check `.env` file configuration
- Verify port 5000 is not in use

### Cannot login
- Verify backend is running on port 5000
- Check MongoDB connection
- Ensure user exists in database

### Emails not sending
- Check SMTP configuration in `.env`
- Verify external email recipients
- Review audit logs for errors

### Permission denied errors
- Verify user role and permissions
- Check JWT token is valid
- Ensure user is active

## Support

For issues or questions about R-MAIL, please refer to the main repository documentation or contact the development team.

## License

Part of the Ross Tax Prep project. All rights reserved.
