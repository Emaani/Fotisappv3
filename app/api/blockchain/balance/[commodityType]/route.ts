import { NextRequest, NextResponse } from 'next/server';
import { validateJWT } from '@/app/middleware/validateJWT';

export async function GET(
  request: NextRequest,
  { params }: { params: { commodityType: string } }
) {
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

    const { commodityType } = params;
    if (!commodityType) {
      return NextResponse.json(
        { success: false, message: 'Commodity type is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_API_URL}/blockchain/balance/${commodityType}`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting token balance:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get token balance' },
      { status: 500 }
    );
  }
}
