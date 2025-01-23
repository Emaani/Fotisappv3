import { verifyEmailConfig } from './verify-email-config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runPreDeploymentChecks() {
  const checks = {
    email: false,
    database: false,
    environment: false
  };

  try {
    console.log('\n🔍 Running pre-deployment checks...\n');
    
    // 1. Email Check
    console.log('1. Checking email configuration...');
    checks.email = await verifyEmailConfig();
    
    // 2. Database Check
    console.log('\n2. Checking database connection...');
    await prisma.$connect();
    checks.database = true;
    console.log('✅ Database connection successful');
    
    // 3. Environment Variables Check
    console.log('\n3. Checking environment variables...');
    const requiredVars = {
      'NEXTAUTH_URL': 'https://fotisagro.com',
      'NEXTAUTH_SECRET': 'Generate using: npm run generate:secret'
    };
    
    const missingVars = Object.entries(requiredVars)
      .filter(([key]) => !process.env[key])
      .map(([key, value]) => ({
        name: key,
        suggestion: value
      }));

    if (missingVars.length === 0) {
      checks.environment = true;
      console.log('✅ All required environment variables are set');
    } else {
      console.error('\n❌ Missing environment variables:');
      missingVars.forEach(({ name, suggestion }) => {
        console.error(`   ${name}: ${suggestion}`);
      });
      console.error('\nTo fix:');
      console.error('1. Generate NEXTAUTH_SECRET: npm run generate:secret');
      console.error('2. Add the variables to .env.production');
      console.error('3. Update Vercel environment variables');
    }

    const allChecksPass = Object.values(checks).every(Boolean);
    
    if (allChecksPass) {
      console.log('\n✅ All pre-deployment checks passed!\n');
      return true;
    }
    
    console.error('\n❌ Deployment checks summary:');
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`   ${value ? '✅' : '❌'} ${key}`);
    });
    return false;
  } catch (error) {
    console.error('\n❌ Pre-deployment checks failed:', error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

// Run checks if this is the main module
if (require.main === module) {
  runPreDeploymentChecks()
    .then(success => {
      if (!success) process.exit(1);
    })
    .catch(error => {
      console.error('Error during pre-deployment checks:', error);
      process.exit(1);
    });
} 