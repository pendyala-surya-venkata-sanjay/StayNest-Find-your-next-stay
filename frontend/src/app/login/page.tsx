"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { StayNestLogo } from "@/components/StayNestLogo";

export default function LoginPage() {
  const router = useRouter();
  const { login, user } = useAuth();
  const { showToast } = useToast();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect to explore
  useEffect(() => {
    if (user) {
      router.push("/explore");
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ email, password });
      showToast("Welcome back! Logged in successfully.", "success");
      router.push("/explore");
    } catch (err: any) {
      const msg = err.message || "Invalid credentials. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="flex flex-col items-center text-center gap-4 mb-8">
        <Link href="/" className="flex items-center gap-2.5 text-brand">
          <StayNestLogo size={36} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-dark mt-2 font-serif">Welcome Back</h1>
        <p className="text-xs text-muted max-w-xs leading-relaxed">
          Log in to manage stays, check upcoming bookings, or create new listings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-border-gray p-8 rounded-2xl shadow-premium flex flex-col gap-5">
        <h3 className="font-bold text-dark text-sm border-b border-border-gray pb-3 mb-2 uppercase tracking-wider">Account Login</h3>
        
        {error && (
          <div className="p-3 bg-brand/10 border border-brand/20 text-brand text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <Input
          type="email"
          label="Email Address"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />

        <Button type="submit" variant="brand" fullWidth isLoading={loading} className="py-3 font-semibold mt-2">
          Log In
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-gray"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase">or</span>
          <div className="flex-grow border-t border-border-gray"></div>
        </div>

        <p className="text-xs text-muted text-center leading-relaxed">
          Don't have an account?{" "}
          <Link href="/register" className="text-brand font-bold hover:underline">
            Register stays
          </Link>
        </p>
      </form>
    </div>
  );
}
