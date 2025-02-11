import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { sendEmail, emailTemplates } from '@/lib/email'
import { sign } from 'jsonwebtoken'

const prisma = new PrismaClient()

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = signupSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json(
        { message: 'User already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10)

    // Create new user with profile
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: hashedPassword,
        role: 'user',
        profile: {
          create: {
            firstName: '',
            lastName: '',
            phoneNumber: '',
            currency: 'USD', // Set default currency
          }
        },
        wallet: {
          create: {
            balance: 0.0,
            currency: 'USD',
          }
        }
      },
      select: {
        id: true,
        email: true,
        role: true
      }
    })

    // Try to send welcome email, but don't fail if it doesn't work
    try {
      if (emailTemplates && emailTemplates.welcomeEmail) {
        const { subject, html } = emailTemplates.welcomeEmail(validatedData.email)
        await sendEmail({
          to: validatedData.email,
          subject,
          html,
        })
      }
    } catch (emailError) {
      // Log the error but don't fail the signup
      console.warn('Failed to send welcome email:', emailError)
    }

    const token = sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );

    return NextResponse.json({
      message: 'User created successfully',
      userId: user.id,
      token
    }, { status: 201 })

  } catch (error) {
    console.error('Signup error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Invalid input data', errors: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}