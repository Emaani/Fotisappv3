import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

function generateSecret(length: number = 64): string {
  return crypto.randomBytes(length).toString('hex');
}

function updateEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const jwtSecret = generateSecret();
  const jwtRefreshSecret = generateSecret();
  const nextAuthSecret = generateSecret();

  const envContent = `
# JWT Configuration
JWT_SECRET=${jwtSecret}
JWT_REFRESH_SECRET=${jwtRefreshSecret}
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# NextAuth Configuration
NEXTAUTH_SECRET=${nextAuthSecret}
NEXTAUTH_URL=http://localhost:3000

# Add other environment variables below
`;

  fs.writeFileSync(envPath, envContent.trim());
  console.log('Environment secrets generated successfully!');
}

updateEnvFile(); 