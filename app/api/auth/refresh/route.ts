import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { setAuthCookies, createToken } from '@/server/utils/authUtils';

// Ensure JWT secrets are defined
if (!process.env.JWT_REFRESH_SECRET || !process.env.JWT_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

// Import and initialize Prisma client correctly
const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Extract refresh token from cookies
    const refreshToken = req.cookies.get('refreshToken')?.value;
    
    if (!refreshToken) {
      return NextResponse.json({ message: 'Refresh token not found' }, { status: 401 });
    }

    // Verify refresh token
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as { userId: string };
    } catch (verifyError) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

    // Find user with matching refresh token
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.userId } 
    });

    // Validate user and refresh token
    if (!user || user.refreshToken !== refreshToken) {
      return NextResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }

    // Generate new access token
    const newToken = createToken(user.id, user.email);

    // Create response with new token
    const response = NextResponse.json({ 
      token: newToken, 
      userId: user.id,
      message: 'Token refreshed successfully' 
    });

    // Set new auth cookies
    setAuthCookies(response, newToken, refreshToken);

    return response;

  } catch (error) {
    console.error('Token refresh error:', error);
    
    // Differentiate between different types of errors
    if (error instanceof Error) {
      return NextResponse.json({ 
        message: 'Internal server error', 
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ message: 'Unexpected error occurred' }, { status: 500 });
  }
}