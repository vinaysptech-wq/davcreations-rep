# Backend

This is the backend for the multivendor ecommerce platform, built with Node.js, Express, and Prisma.

## Prerequisites

- Node.js (version 18 or higher)
- npm
- Database (configured in `.env`)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up the database:
   - Ensure your database is running and configured in `.env`.
   - Run Prisma migrations:
     ```
     npx prisma migrate dev
     ```
   - Generate Prisma client:
     ```
     npx prisma generate
     ```

## Running

Start the development server:
```
npm run dev
```

The server will run on port 5000.

## Scripts

- `npm run dev`: Start development server with nodemon
- `npm start`: Start production server
- `npm test`: Run tests (not implemented)