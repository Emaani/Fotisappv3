import { transporter } from '../app/lib/email-config';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.email' });

// Add this type at the top
interface SMTPError {
  code?: string;
  responseCode?: number;
  command?: string;
  message: string;
}

export async function verifyEmailConfig(): Promise<boolean> {
  try {
    console.log('\n📧 Verifying email configuration...\n');
    
    // Check environment variables
    console.log('Environment Variables:');
    console.log('HOST:', process.env.EMAIL_HOST);
    console.log('PORT:', process.env.EMAIL_PORT);
    console.log('USER:', process.env.EMAIL_USER);
    console.log('PASS:', process.env.EMAIL_PASS ? '********' : 'NOT SET');
    console.log('\nTesting SMTP Connection...\n');

    const verifyResult = await transporter.verify();
    
    if (verifyResult) {
      console.log('✅ Email configuration is valid');
      return true;
    }
    return false;  // Explicit return false
  } catch (error: unknown) {
    console.error('\n❌ Email configuration error:');
    const smtpError = error as SMTPError;
    console.error('\nFull error:', smtpError.message);
    return false;  // Return false on error
  }
}

// Only run verification if this is the main module
if (require.main === module) {
  verifyEmailConfig()
    .then(success => {
      if (!success) process.exit(1);
    })
    .catch(error => {
      console.error('Unexpected error:', error);
      process.exit(1);
    });
} 