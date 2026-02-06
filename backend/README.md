# Ross Tax Prep Backend API

## Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Start the server:
   ```bash
   npm start
   ```
   The API will run on http://localhost:4000 by default.

## API Endpoints

### Authentication
- `POST /api/auth/login` — Login with email and password
- `POST /api/auth/mfa` — Validate MFA code

### Tasks
- `GET /api/tasks` — Get all tasks
- `POST /api/tasks/update` — Update a task's completion status

### Workflow
- `GET /api/workflow/progress` — Get workflow progress

### Refund
- `GET /api/refund/status` — Get refund status

### Bank Product
- `POST /api/bank-product/apply` — Apply for Refund Advantage bank product

## Notes
- This is a demo/mock backend. Replace with real database and business logic for production.
- All endpoints return JSON.
- Update user and task data as needed for your workflow.
