import { NextResponse } from 'next/server';
import prisma from "../../../lib/prisma";
import { uploadFile } from "../../../lib/fileUpload";
import { z } from 'zod';

// Input validation schema
const ProfileSetupSchema = z.object({
  userId: z.string().transform(val => Number(val)),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  phoneNumber: z.string().min(1),
  currency: z.string().min(1),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Convert FormData to plain object
    const profileData = {
      userId: formData.get('userId'),
      firstName: formData.get('firstName'),
      lastName: formData.get('lastName'),
      phoneNumber: formData.get('phoneNumber'),
      currency: formData.get('currency'),
      address: formData.get('address'),
      city: formData.get('city'),
      country: formData.get('country'),
    };

    // Validate input
    const validationResult = ProfileSetupSchema.safeParse(profileData);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Invalid input',
          errors: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // Handle profile picture upload
    const profilePicture = formData.get('profilePicture') as File | null;
    let profilePicturePath: string | null = null;

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

    // Destructure validated data
    const { 
      userId, 
      firstName, 
      lastName, 
      phoneNumber, 
      currency,
      address,
      city,
      country 
    } = validationResult.data;

    // Update user profile and create wallet in a transaction
    const [updatedProfile, wallet] = await prisma.$transaction([
      prisma.profile.update({
        where: { userId: String(userId) }, // Explicitly convert to number if needed
        data: {
          firstName,
          lastName,
          phoneNumber,
          address: address ?? null,
          city: city ?? null,
          country: country ?? null,
          profilePicture: profilePicturePath,
          profileCompleted: true,
        },
      }),
      prisma.wallet.upsert({
        where: { userId: String(userId) }, // Convert to string
        create: {
          userId: String(userId), // Ensure string type
          balance: 0,
          currency: String(currency), // If currency is numeric
        },
        update: {
          currency: String(currency) // If currency is numeric
        }
      }),
    ]);

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
      wallet,
    });
  } catch (error) {
    console.error('Profile setup error:', error);
    return NextResponse.json(
      { message: 'Failed to update profile' },
      { status: 500 }
    );
  }
}