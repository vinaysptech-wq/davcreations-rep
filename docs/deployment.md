# Deployment Guide

This guide explains how to deploy the admin application to different environments.

## Environments

- **Development**: Local development environment
- **Staging**: Pre-production testing environment
- **Production**: Live production environment

## Prerequisites

- Docker and Docker Compose (for containerized deployment)
- GitHub repository with proper branch structure
- Cloud hosting provider (AWS, GCP, Azure, etc.)
- Domain name and SSL certificate

## GitHub Actions CI/CD

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that:

1. Runs on pushes to `main`, `staging`, and `develop` branches
2. Installs dependencies for both backend and frontend
3. Runs tests
4. Builds the frontend
5. Deploys to the appropriate environment

### Environment Variables for CI/CD

Set the following secrets in your GitHub repository:

- `DB_HOST`: Database host
- `DB_PASSWORD`: Database password
- `JWT_SECRET`: JWT secret key
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

## Manual Deployment

### Backend Deployment

1. Clone the repository:

```bash
git clone https://github.com/your-repo/admin-app.git
cd admin-app
```

2. Navigate to backend:

```bash
cd admin-backend
```

3. Install dependencies:

```bash
npm install --production
```

4. Set up environment variables:

Copy the appropriate environment file and update values:

```bash
cp .env.production .env
# Edit .env with production values
```

5. Run database migrations:

```bash
npx prisma migrate deploy
```

6. Build the application:

```bash
npm run build
```

7. Start the server:

```bash
npm start
```

### Frontend Deployment

1. Navigate to frontend:

```bash
cd admin-frontend
```

2. Install dependencies:

```bash
npm install
```

3. Build the application:

```bash
npm run build
```

4. Deploy the `out` directory to your web server (nginx, Apache, etc.)

## Docker Deployment

### Using Docker Compose

1. Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./admin-backend
    environment:
      DATABASE_URL: postgresql://postgres:your_password@db:5432/postgres
      JWT_SECRET: your_jwt_secret
      NODE_ENV: production
    ports:
      - "5000:5000"
    depends_on:
      - db

  frontend:
    build: ./admin-frontend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

2. Build and run:

```bash
docker-compose up -d
```

## Environment-Specific Configuration

### Development

- Use `.env.development`
- CORS allows localhost origins
- Debug logging enabled
- Hot reload enabled

### Staging

- Use `.env.staging`
- CORS allows staging domain
- SSL enabled
- Info level logging

### Production

- Use `.env.production`
- CORS allows production domain
- SSL enforced
- Warn level logging
- Rate limiting enabled

## Monitoring and Maintenance

- Set up log aggregation (e.g., ELK stack, CloudWatch)
- Configure monitoring (e.g., PM2, Docker health checks)
- Set up automated backups for the database
- Configure SSL certificate renewal
- Monitor application performance and errors

## Rollback Strategy

1. Keep previous deployment versions
2. Use Git tags for releases
3. Have a quick rollback script
4. Test rollbacks in staging first