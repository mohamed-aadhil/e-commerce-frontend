# Environment Configuration Guide

This document explains how to manage different environments in the Angular frontend application.

## Available Environments

1. **Development** (`environment.ts`)
   - Used for local development
   - API points to `http://localhost:3000`
   - Source maps enabled
   - No optimizations

2. **Staging** (`environment.staging.ts`)
   - Used for testing before production
   - API points to staging server
   - Optimized build with source maps
   - Example: `https://staging-api.yourdomain.com`

3. **Production** (`environment.prod.ts`)
   - Used for production deployment
   - API points to production server
   - Fully optimized build
   - No source maps

## Available Scripts

### Development
- `npm start` or `npm run start:dev` - Start development server
- `npm run build:dev` - Build for development

### Staging
- `npm run start:staging` - Start with staging configuration
- `npm run build:staging` - Build for staging

### Production
- `npm run start:prod` - Start with production configuration
- `npm run build:prod` - Build for production

## Adding New Environment Variables

1. Add the variable to all environment files:
   - `src/environments/environment.ts`
   - `src/environments/environment.staging.ts`
   - `src/environments/environment.prod.ts`

2. Access the variable in your code:
   ```typescript
   import { environment } from '../environments/environment';
   
   // Example usage
   const apiUrl = environment.apiUrl;
   ```

## Best Practices

1. Never commit sensitive data to environment files
2. Use environment-specific API endpoints
3. Test all environment builds before deployment
4. Keep environment configurations in sync across the team

## CI/CD Integration

When setting up your CI/CD pipeline, use the appropriate build command:

```bash
# For staging
npm run build:staging

# For production
npm run build:prod
```

## Troubleshooting

- If you see `environment.ts` file not found, ensure the file exists and the path in `angular.json` is correct
- For build errors, check that all required environment variables are defined in all environment files
