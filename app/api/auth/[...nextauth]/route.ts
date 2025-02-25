import NextAuthHandler from "next-auth/next";
import { authOptions } from "@/app/lib/auth"; // Ensure this path is correct

export const { GET, POST } = NextAuthHandler(authOptions);