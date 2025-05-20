import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { commodityType: string } }
) {
  try {
    const { commodityType } = params;
    if (!commodityType) {
      return NextResponse.json(
        { success: false, message: 'Commodity type is required' },
        { status: 400 }
      );
    }

    // Forward request to backend
    const backendUrl = `${process.env.BACKEND_API_URL}/market/${commodityType}`;
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error getting market data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get market data' },
      { status: 500 }
    );
  }
}
