import nodemailer from 'nodemailer';


// Email configuration
const transporter = nodemailer.createTransport({
  // Configure your email service here
  // For development, you can use a test service like Mailtrap
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: true,
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

// At the top level of the file
const getPasswordResetTemplate = (resetLink: string): string => `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h1 style="color: #2563eb;">Reset Your Password</h1>
    <p>Click the link below to reset your password:</p>
    <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 4px;">Reset Password</a>
    <p>If you didn't request this, please ignore this email.</p>
    <p>Best regards,<br>The Fotis Agro Team</p>
  </div>
`;

export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<void> {
  const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
  
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: getPasswordResetTemplate(resetLink),
    });
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
} 