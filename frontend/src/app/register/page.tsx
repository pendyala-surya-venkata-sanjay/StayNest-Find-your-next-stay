"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Input } from "@/components/Input";
import { Button } from "@/components/Button";
import { StayNestLogo } from "@/components/StayNestLogo";

export default function RegisterPage() {
  const router = useRouter();
  const { register, user } = useAuth();
  const { showToast } = useToast();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guest" | "host">("guest");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Auto-detect role from query parameter
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const roleParam = params.get("role");
      if (roleParam === "host" || roleParam === "guest") {
        setRole(roleParam);
      }
    }
  }, []);

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
      await register({ name, email, password, role });
      showToast(`Welcome! Account registered successfully as ${role}.`, "success");
      router.push("/explore");
    } catch (err: any) {
      const msg = err.message || "Registration failed. Please check your inputs.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6">
      <div className="flex flex-col items-center text-center gap-4 mb-8">
        <Link href="/" className="flex items-center gap-2.5 text-brand animate-fade-in">
          <StayNestLogo size={36} />
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight text-dark mt-2 font-serif">Create Account</h1>
        <p className="text-xs text-muted max-w-xs leading-relaxed">
          Sign up to search luxury cabins, reserve listings, or post your properties as a host.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border border-border-gray p-8 rounded-2xl shadow-premium flex flex-col gap-5">
        <h3 className="font-bold text-dark text-sm border-b border-border-gray pb-3 mb-2 uppercase tracking-wider">Registration</h3>
        
        {error && (
          <div className="p-3 bg-brand/10 border border-brand/20 text-brand text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        <Input
          type="text"
          label="Full Name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={loading}
        />

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

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-dark uppercase tracking-wide">Account Role</label>
          <div className="grid grid-cols-2 gap-3 mt-1">
            <button
              type="button"
              onClick={() => setRole("guest")}
              className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === "guest"
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-border-gray hover:border-dark text-dark bg-white"
              }`}
              disabled={loading}
            >
              Guest (to Book)
            </button>
            <button
              type="button"
              onClick={() => setRole("host")}
              className={`py-3 px-4 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                role === "host"
                  ? "border-brand bg-brand text-white shadow-sm"
                  : "border-border-gray hover:border-dark text-dark bg-white"
              }`}
              disabled={loading}
            >
              Host (to Rent)
            </button>
          </div>
        </div>

        <Button type="submit" variant="brand" fullWidth isLoading={loading} className="py-3 font-semibold mt-2">
          Register
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-border-gray"></div>
          <span className="flex-shrink mx-4 text-gray-400 text-[10px] uppercase">or</span>
          <div className="flex-grow border-t border-border-gray"></div>
        </div>

        <p className="text-xs text-muted text-center leading-relaxed">
          Already have an account?{" "}
          <Link href="/login" className="text-brand font-bold hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
