import { sendEmail } from '../app/lib/email';

async function testEmail() {
  try {
    const result = await sendEmail({
      to: 'your-test-email@example.com',
      subject: 'Test Email',
      html: '<h1>Test Email</h1><p>This is a test email to verify SMTP configuration.</p>'
    });

    console.log('Email test result:', result);
  } catch (error) {
    console.error('Email test failed:', error);
  }
}

testEmail(); 