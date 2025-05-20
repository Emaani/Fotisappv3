import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

interface DecodedToken {
  id: string;
  email: string;
  role: string;
  iat: number;
  exp: number;
}

export async function validateJWT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return { error: 'No token provided' };
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return { error: 'No token provided' };
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_secret'
    ) as DecodedToken;

    return decoded;
  } catch (error) {
    console.error('JWT validation error:', error);
    return { error: 'Invalid token' };
  }
}
