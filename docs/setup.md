# Setup Guide

This guide will help you set up the development environment for the admin application.

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 13 or higher
- Git

## Database Setup

1. Install PostgreSQL on your system
2. Create a database named `postgres`
3. Run the initial schema:

```bash
psql -U postgres -d postgres -f database/schema/initial_schema.sql
```

## Backend Setup

1. Navigate to the backend directory:

```bash
cd admin-backend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Copy the appropriate environment file and update the values:

```bash
cp .env.development .env
# Edit .env with your actual values
```

4. Run database migrations:

```bash
npx prisma migrate dev
```

5. Generate Prisma client:

```bash
npx prisma generate
```

6. Start the development server:

```bash
npm run dev
```

The backend will be running on http://localhost:5000

## Frontend Setup

1. Navigate to the frontend directory:

```bash
cd admin-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.local .env.local
# Edit .env.local with your actual values
```

4. Start the development server:

```bash
npm run dev
```

The frontend will be running on http://localhost:3000

## Testing

### Backend Tests

```bash
cd admin-backend
npm test
```

### Frontend Tests

```bash
cd admin-frontend
npm test
```

## Branching Strategy

See the main README.md for information about the branching strategy and environment handling.