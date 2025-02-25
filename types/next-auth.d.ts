import { User as DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: string;
    email: string;
    name?: string;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
    } & DefaultSession["user"];
  }

  interface Profile {
    first_name?: string;
    last_name?: string;
    picture?: string;
    email?: string;
  }
} 