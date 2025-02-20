import { NextRequest, NextResponse } from 'next/server';
import jwt, { SignOptions } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { setAuthCookies, createToken } from '@/server/utils/authUtils';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

// Move this check to server startup
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

// Import and initialize Prisma client correctly
const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const refreshToken = request.headers.get('x-refresh-token');

    if (!refreshToken) {
      return NextResponse.json(
        { error: 'Refresh token is required' },
        { status: 401 }
      );
    }

    // Type assertion to handle the null case
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as jwt.JwtPayload;

    const signOptions: SignOptions = {
      expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as any,
      algorithm: 'HS256'
    };

    // Generate new access token
    const accessToken = jwt.sign(
      { id: decoded.id, email: decoded.email },
      JWT_SECRET,
      signOptions
    );

    return NextResponse.json({
      accessToken,
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired refresh token' },
      { status: 401 }
    );
  }
}