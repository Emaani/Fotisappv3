import NextAuth from "next-auth";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "./prisma";
import type { User, Profile } from "next-auth";
import type { User as NextAuthUser } from "next-auth";
import { User as DefaultUser } from "next-auth";
import { AuthOptions } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    email?: string;
    name?: string;
  }
}

/**
 * Configure authentication options for NextAuth
 */
export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
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
    async signIn({ user, profile }: { user: User; profile?: Profile }) {
      if (!user.email) return false;

      const existingUser = await prisma.user.findUnique({
        where: { email: user.email },
        include: { profile: true },
      });

      if (!existingUser) {
        const socialProfile = profile as { first_name?: string; last_name?: string };
        await prisma.user.create({
          data: {
            email: user.email,
            name: user.name || "",
            password: "oauth-account", // Note: This might not be necessary for OAuth
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
    },
    async session({ session, user }: { session: any; user: User }) {
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
});

export const authOptions: AuthOptions = {
  // ... configuration
};