// import NextAuth from "next-auth"; ← Delete this line

// Import DefaultSession from next-auth
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession["user"];
  }
  
  interface User {
    id: string;
  }
} 