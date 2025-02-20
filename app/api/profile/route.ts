import { NextRequest, NextResponse } from "next/server";
import prisma from "../../lib/prisma";
import { validateJWT } from "../../middleware/validateJWT";
import { JwtPayload } from "jsonwebtoken";

export async function POST(req: NextRequest) {
  try {
    // Validate JWT and get user ID
    const validation = await validateJWT(req);
    if (validation instanceof NextResponse) {
      return validation;
    }

    const jwtUserId = (validation as JwtPayload).id;
    if (!jwtUserId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    
    // Log the entire form data for debugging
    console.log('Received form data:', Object.fromEntries(formData.entries()));

    // Extract and validate required fields
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const phoneNumber = formData.get('phoneNumber') as string;
    const currency = formData.get('currency') as string || 'USD';

    // Validate required fields with specific error messages
    const missingFields = [];
    if (!firstName?.trim()) missingFields.push('First Name');
    if (!lastName?.trim()) missingFields.push('Last Name');
    if (!phoneNumber?.trim()) missingFields.push('Phone Number');

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Create the profile data object
    const profileData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber.trim(),
      currency,
      profileCompleted: true,
      address: (formData.get('address') as string)?.trim() || undefined,
      city: (formData.get('city') as string)?.trim() || undefined,
      country: (formData.get('country') as string)?.trim() || undefined,
    };

    // Update the profile
    const profile = await prisma.profile.update({
      where: {
        userId: jwtUserId,
      },
      data: profileData,
    });

    return NextResponse.json({ 
      success: true, 
      profile,
      message: 'Profile updated successfully' 
    });

  } catch (error: unknown) {
    console.error('Profile setup error:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to update profile',
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
