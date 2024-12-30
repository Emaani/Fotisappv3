import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    // Ensure params is properly awaited
    const { userId } = await Promise.resolve(params);
    
    if (!userId) {
      return NextResponse.json(
        { message: 'User ID is required' },
        { status: 400 }
      );
    }

    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      return NextResponse.json(
        { message: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // First, check if user exists
    const user = await prisma.user.findUnique({
      where: { id: parsedUserId },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    // Find or create wallet
    const wallet = await prisma.wallet.upsert({
      where: { 
        userId: parsedUserId 
      },
      create: {
        userId: parsedUserId,
        balance: 0,
        currency: 'USD'
      },
      update: {},
    });

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      currency: {
        code: wallet.currency,
        symbol: getCurrencySymbol(wallet.currency)
      },
      userName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'User',
    });
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch wallet data' },
      { status: 500 }
    );
  }
}

function getCurrencySymbol(currencyCode: string): string {
  const symbols: { [key: string]: string } = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'UGX': 'USh',
    'KES': 'KSh',
    'TZS': 'TSh',
    'RWF': 'RF',
    'BIF': 'FBu',
  };
  return symbols[currencyCode] || currencyCode;
} 