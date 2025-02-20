// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import type { User } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/app/lib/prisma";

// Fix the User type extension to be compatible with the base User interface
interface AuthUser extends Omit<User, 'name'> {
  email: string;
  name?: string | null; // Matches the base User interface's name property type
}

export const authOptions = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "email,public_profile",
        },
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async signIn({ user, profile }) {
      try {
        const typedUser = user as AuthUser;
        if (!typedUser.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: typedUser.email },
          include: { profile: true },
        });

        if (!existingUser) {
          const socialProfile = profile as { first_name?: string; last_name?: string };
          await prisma.user.create({
            data: {
              email: typedUser.email,
              name: typedUser.name || "",
              password: "oauth-account",
              profile: {
                create: {
                  firstName: socialProfile?.first_name || "",
                  lastName: socialProfile?.last_name || "",
                  phoneNumber: "",
                  currency: "USD",
                },
              },
              wallet: {
                create: {
                  balance: 0.0,
                  currency: "USD",
                },
              },
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === "production" ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };