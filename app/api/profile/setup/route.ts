import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { uploadFile } from '@/app/lib/fileUpload';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Extract and validate required fields
    const userId = formData.get('userId');
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const phoneNumber = formData.get('phoneNumber');
    const currency = formData.get('currency');
    const address = formData.get('address');
    const city = formData.get('city');
    const country = formData.get('country');
    const profilePicture = formData.get('profilePicture') as File | null;

    if (!userId || !firstName || !lastName || !phoneNumber || !currency) {
      return NextResponse.json(
        { message: 'Required fields are missing' },
        { status: 400 }
      );
    }

    let profilePicturePath: string | null = null;

    // Handle profile picture upload
    if (profilePicture && profilePicture instanceof File) {
      try {
        profilePicturePath = await uploadFile(profilePicture, 'uploads/profiles');
      } catch (error) {
        console.error('Profile picture upload error:', error);
        return NextResponse.json(
          { message: 'Failed to upload profile picture' },
          { status: 500 }
        );
      }
    }

    // Update user profile and create wallet
    const [updatedProfile, wallet] = await prisma.$transaction([
      prisma.profile.update({
        where: {
          userId: Number(userId),
        },
        data: {
          firstName: String(firstName),
          lastName: String(lastName),
          phoneNumber: String(phoneNumber),
          address: address ? String(address) : null,
          city: city ? String(city) : null,
          country: country ? String(country) : null,
          profilePicture: profilePicturePath,
          profileCompleted: true,
        },
      }),
      prisma.wallet.upsert({
        where: {
          userId: Number(userId),
        },
        create: {
          userId: Number(userId),
          balance: 0,
          currency: String(currency),
        },
        update: {
          currency: String(currency),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      wallet: wallet,
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
} 