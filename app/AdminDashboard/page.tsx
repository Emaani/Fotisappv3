"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const AdminPage = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const authStatus = sessionStorage.getItem("isAuthenticated");
      if (authStatus !== "true") {
        router.push("/login");
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, [router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-lg mb-6">Welcome to the Fotis Agro admin panel.</p>
        <button
          className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded transition-colors"
          onClick={() => {
            sessionStorage.removeItem("isAuthenticated");
            router.push("/login");
          }}
        >
          Log out
        </button>
      </div>
    </div>
  );
};

export default AdminPage;
