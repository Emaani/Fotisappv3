import fetch from 'node-fetch';
import { transporter } from '../app/lib/email-config';
import prisma from '../app/lib/prisma';

async function verifyDeployment() {
  const checks = {
    database: false,
    email: false,
    api: false,
  };

  try {
    // Check database
    await prisma.$connect();
    checks.database = true;
    console.log('✅ Database connection verified');

    // Check email
    await transporter.verify();
    checks.email = true;
    console.log('✅ Email configuration verified');

    // Check API
    const apiResponse = await fetch('https://fotisagro.com/api/health');
    checks.api = apiResponse.ok;
    console.log('✅ API health check passed');

    if (Object.values(checks).every(Boolean)) {
      console.log('✅ All deployment checks passed');
    } else {
      throw new Error('Some checks failed');
    }
  } catch (error) {
    console.error('❌ Deployment verification failed:', error);
    console.log('Checks status:', checks);
    process.exit(1);
  }
}

verifyDeployment().catch(console.error); 