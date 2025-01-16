"use client";
import { signOut } from "next-auth/react";
import { clearBrowserStorage } from "@/app/utils/storage";

export const LogoutButton = () => {
  const handleLogout = async () => {
    // Clear all storage
    clearBrowserStorage();
    
    // Sign out from NextAuth
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <button
      onClick={handleLogout}
      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
    >
      Log out
    </button>
  );
}; 