import NextAuth from "next-auth"; // Keep this for v4
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma"; // Ensure the import path is correct
import type { Session, User } from "next-auth";
import type { Adapter } from "next-auth/adapters";

export const authOptions: {
  debug: boolean;
  providers: any[];
  adapter: Adapter;
  callbacks: {
    session: (session: Session, user: User) => Promise<Session>;
  };
  pages: {
    signIn: string;
  };
} = {
  debug: process.env.NODE_ENV === "development",
  providers: [
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: PrismaAdapter(prisma),
  callbacks: {
    async session(session: Session, user: User) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
