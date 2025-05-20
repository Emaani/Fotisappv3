import { NextRequest, NextResponse } from 'next/server';
import { validateJWT } from '@/app/middleware/validateJWT';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Commodity ID is required' },
        { status: 400 }
      );
    }

    // Get price from request body
    const body = await request.json();
    const { price } = body;

    if (!price || price <= 0) {
      return NextResponse.json(
        { success: false, message: 'Valid price is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_API_URL}/commodities/${id}/list`;
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify({ price })
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error listing commodity for sale:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to list commodity for sale' },
      { status: 500 }
    );
  }
}
