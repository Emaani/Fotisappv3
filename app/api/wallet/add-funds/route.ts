import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, amount, _paymentMethod } = await request.json();

    // Here you would integrate with your payment provider
    // For now, we'll just update the balance directly
    const updatedWallet = await prisma.wallet.update({
      where: { userId: userId },
      data: {
        balance: {
          increment: amount
        }
      }
    });

    return NextResponse.json({
      success: true,
      balance: updatedWallet.balance
    });
  } catch (error) {
    console.error('Add funds error:', error);
    return NextResponse.json(
      { message: 'Failed to add funds' },
      { status: 500 }
    );
  }
} 