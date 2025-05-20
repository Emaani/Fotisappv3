import { NextRequest, NextResponse } from 'next/server';
import { validateJWT } from '@/app/middleware/validateJWT';

export async function POST(request: NextRequest) {
  try {
    // Validate JWT
    const validation = await validateJWT(request);
    if (typeof validation === 'object' && 'error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 401 });
    }

    const userId = validation.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found' },
        { status: 401 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_API_URL}/blockchain/wallet`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ userId })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error creating blockchain wallet:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create blockchain wallet' },
      { status: 500 }
    );
  }
}
