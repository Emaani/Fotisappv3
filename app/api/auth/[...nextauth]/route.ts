import NextAuth from "next-auth";
import type { NextAuthOptions } from "next-auth";
import type { Profile as OAuthProfile } from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "../../../lib/prisma";

interface ExtendedProfile extends OAuthProfile {
  first_name?: string;
  last_name?: string;
}

const options: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'email,public_profile',
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
        if (!user.email) return false;

        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          include: { profile: true },
        });

        if (!existingUser) {
          const socialProfile = profile as ExtendedProfile;
          await prisma.user.create({
            data: {
              email: user.email,
              name: user.name || "",
              password: "oauth-account",
              profile: {
                create: {
                  firstName: socialProfile?.first_name || "",
                  lastName: socialProfile?.last_name || "",
                  phoneNumber: "",
                  currency: "USD",
                }
              },
              wallet: {
                create: {
                  balance: 0.0,
                  currency: "USD",
                }
              }
            },
          });
        }
        return true;
      } catch (error) {
        console.error("Error in signIn callback:", error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user = token.id;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
};

const handler = NextAuth(options);
export { handler as GET, handler as POST };