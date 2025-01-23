import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  // Configure your email service here
  // For development, you can use a test service like Mailtrap
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const emailTemplates = {
  welcomeEmail: (userEmail: string) => ({
    subject: 'Welcome to Fotis Agro!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Fotis Agro!</h1>
        <p>Dear ${userEmail.split('@')[0]},</p>
        <p>Thank you for joining Fotis Agro. We're excited to have you on board!</p>
        <p>To get started, please complete your profile setup.</p>
        <p>Best regards,<br>The Fotis Agro Team</p>
      </div>
    `,
  }),
};

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailParams): Promise<boolean> => {
  try {
    // Check if email sending is enabled
    if (!process.env.EMAIL_ENABLED || process.env.EMAIL_ENABLED === 'false') {
      console.log('Email sending is disabled. Would have sent:', { to, subject });
      return true;
    }

    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'admin@fotisagro.com',
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}; 