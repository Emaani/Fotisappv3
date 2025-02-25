import { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email
    pass: process.env.EMAIL_PASS, // Your email password or app-specific password
  },
});

export default async function forgotPassword(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    // Generate a JWT token (valid for 15 minutes)
    const resetToken = jwt.sign({ email }, process.env.JWT_SECRET!, { expiresIn: '15m' });

    // Generate reset link
    const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/forgot-password/reset?token=${resetToken}`;

    // Send the email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <p>You requested a password reset. Click the link below to reset your password:</p>
        <a href="${resetLink}" target="_blank">${resetLink}</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res.status(200).json({ message: 'Password reset link sent successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
}
