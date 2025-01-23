import { transporter, emailConfig } from '../app/lib/email-config';
import { emailTemplates } from '../app/lib/email-templates';

async function testEmails() {
  try {
    // Verify credentials
    console.log('Testing email configuration...');
    console.log('Using email:', process.env.EMAIL_USER);
    
    // Test SMTP connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Test welcome email
    const testAddress = process.env.EMAIL_USER;
    const welcomeEmail = emailTemplates.welcome('Test User');
    
    console.log(`Sending test email to ${testAddress}...`);
    await transporter.sendMail({
      from: emailConfig.addresses.from,
      to: testAddress,
      ...welcomeEmail,
    });
    console.log('✅ Welcome email test successful');

    console.log('✅ All email tests passed');
  } catch (error) {
    console.error('❌ Email test failed:', error);
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Missing email credentials in environment variables');
      console.error('Please check your .env.email file');
    }
    process.exit(1);
  }
}

testEmails().catch(console.error); 