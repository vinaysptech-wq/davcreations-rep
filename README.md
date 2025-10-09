# Project

This is a monorepo containing the admin backend and frontend applications.

## 🌱 Branching Strategy for Environments

Use branches instead of folders for different environments:

| Branch   | Purpose                  | Deployed To     |
|----------|--------------------------|-----------------|
| main     | Production-ready code   | Production (Live) |
| staging  | Pre-release testing environment | Staging Server |
| develop  | Active development branch | Development Server |
| feature/* | For individual new features/fixes | Merged into develop |

### Workflow:
1. Developers create `feature/feature-name` branches from `develop`.
2. Merge finished features into `develop`.
3. When ready for testing → merge `develop` → `staging`.
4. After testing → merge `staging` → `main` for production.

## ⚙️ Handling Environment Configurations

Keep your environment-specific values (API URLs, DB credentials, etc.) outside the repository, for example using:
- .env files (but do not commit them)
- GitHub Secrets (for CI/CD)
- Environment variables on your server

Example:
```
backend/
  .env.development
  .env.staging
  .env.production
```

## Project Structure

- `admin-backend/`: Backend application
- `admin-frontend/`: Frontend application
- `database/`: Database schema and migrations
- `docs/`: Project documentation
- `.github/`: GitHub workflows