import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load email environment variables
dotenv.config({ path: '.env.email' });

// Validate required environment variables
const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

export const emailConfig = {
  main: {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false
    },
    debug: process.env.NODE_ENV !== 'production',
    logger: process.env.NODE_ENV !== 'production'
  },
  addresses: {
    from: process.env.EMAIL_USER || 'admin@fotisagro.com',
    info: 'info@fotisagro.com',
    admin: 'admin@fotisagro.com',
    support: 'support@fotisagro.com',
  },
};

export const transporter = nodemailer.createTransport(emailConfig.main); 