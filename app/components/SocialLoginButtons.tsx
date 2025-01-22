"use client";
import { signIn } from "next-auth/react";
import { FaGoogle, FaFacebook } from "react-icons/fa";
import { useState } from "react";

export const SocialLoginButtons = () => {
  const [isLoading, setIsLoading] = useState(false);

  const handleSocialLogin = async (provider: "google" | "facebook") => {
    try {
      setIsLoading(true);
      const result = await signIn(provider, {
        callbackUrl: '/ProfileSetup',
        redirect: false,
      });

      if (result?.error) {
        console.error(`${provider} login error:`, result.error);
        // Handle specific error cases
        if (result.error === "OAuthSignin") {
          console.error("OAuth configuration error");
        }
      }
    } catch (error) {
      console.error(`${provider} login error:`, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => handleSocialLogin("facebook")}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
      >
        <FaFacebook />
        {isLoading ? 'Connecting...' : 'Continue with Facebook'}
      </button>
      <button
        onClick={() => handleSocialLogin("google")}
        className="w-full flex items-center justify-center gap-2 bg-white text-gray-700 border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50"
      >
        <FaGoogle className="text-red-500" />
        Continue with Google
      </button>
    </div>
  );
}; 