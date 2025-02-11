import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { setAuthCookies } from '@/server/utils/authUtils';
import * as jwt from 'jsonwebtoken';

// Ensure JWT secret is defined
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

// Initialize Prisma client
const prisma = new PrismaClient();

// Token generation helper functions
function createAccessToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    process.env.JWT_SECRET!,
    { expiresIn: '24h' }
  );
}

async function POST(req: NextRequest) {
  try {
    // Extract refresh token from cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;

    if (!refreshToken) {
      return NextResponse.json({ message: 'No refresh token provided' }, { status: 401 });
    }

    // Verify the refresh token
    let decoded: { userId: string }; // Explicitly type as string
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    } catch (error) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

    // Find user with matching refresh token
    const user = await prisma.user.findUnique({ 
      where: { 
        id: decoded.userId // Ensure userId is treated as a string
      } 
    });

    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

    // Generate new access token
    const newAccessToken = createAccessToken(user.id, user.email);

    // Create response with new token
    const response = NextResponse.json({
      token: newAccessToken,
      userId: user.id,
      message: 'Token refreshed successfully'
    });

    // Set new auth cookies
    setAuthCookies(response, newAccessToken, refreshToken);

    return response;
  } catch (error) {
    console.error('Token refresh error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export { POST };