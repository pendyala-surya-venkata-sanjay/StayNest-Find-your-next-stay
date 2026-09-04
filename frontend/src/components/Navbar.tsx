"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { Menu, User as UserIcon, Globe, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { LoginModal, RegisterModal } from "./AuthModals";
import { SearchModal } from "./SearchModal";
import { StayNestLogo } from "./StayNestLogo";

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const openLogin = () => {
    setDropdownOpen(false);
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  const openRegister = () => {
    setDropdownOpen(false);
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    showToast("Logged out successfully.", "info");
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-border-gray bg-white/95 backdrop-blur-md py-4 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Section */}
          <Link href="/" className="flex items-center gap-2.5 text-brand hover:opacity-90 transition-opacity">
            <StayNestLogo />
          </Link>

          {/* Search Trigger and Explore Link */}
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-xs font-bold text-dark hover:text-brand transition-colors tracking-wide uppercase">
              Explore Stays
            </Link>
            <span className="text-border-gray font-light">|</span>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2.5 border border-border-gray hover:border-brand/60 transition-all rounded-xl py-2.5 px-4 text-xs font-semibold text-muted bg-[#FAF9F6] shadow-xs cursor-pointer"
            >
              <Search size={14} className="text-brand stroke-[2.5]" />
              <span>Search destinations or stays...</span>
            </button>
          </div>

          {/* User Menu Actions */}
          <div className="flex items-center gap-3 relative" ref={dropdownRef}>
            
            {/* Host Dashboard Link */}
            {user ? (
              user.role === "host" ? (
                <Link
                  href="/host"
                  className="hidden md:block text-xs font-bold hover:bg-brand-light py-2.5 px-4 rounded-xl text-brand transition-colors border border-brand/20 hover:border-brand/40"
                >
                  Host Dashboard
                </Link>
              ) : (
                <Link
                  href="/trips"
                  className="hidden md:block text-xs font-bold hover:bg-brand-light py-2.5 px-4 rounded-xl text-brand transition-colors border border-brand/20 hover:border-brand/40"
                >
                  My Trips
                </Link>
              )
            ) : (
              <Link
                href="/login"
                className="hidden md:block text-xs font-semibold hover:bg-light-gray py-2.5 px-4 rounded-xl text-dark transition-colors"
              >
                Become a Host
              </Link>
            )} <button className="hidden sm:flex text-muted hover:bg-light-gray p-2.5 rounded-xl transition-colors">
              <Globe size={16} />
            </button>

            {/* Profile Dropdown Trigger */}
            <button
              onClick={toggleDropdown}
              className="flex items-center border border-border-gray hover:border-brand/40 transition-all rounded-xl p-1.5 pl-3.5 gap-3 bg-white shadow-xs cursor-pointer"
            >
              <Menu size={16} className="text-dark" />
              <div className="bg-brand text-white rounded-full p-1.5 w-7 h-7 flex items-center justify-center overflow-hidden font-bold text-xs">
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user ? user.name.charAt(0).toUpperCase() : <UserIcon size={14} />
                )}
              </div>
            </button>

            {/* Dropdown Menu Overlay */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-60 rounded-xl bg-white shadow-premium border border-border-gray py-2 flex flex-col z-50 text-sm">
                {user ? (
                  <>
                    <div className="px-4 py-2 border-b border-border-gray mb-1">
                      <p className="font-bold text-dark truncate">Hello, {user.name}</p>
                      <p className="text-xs text-muted truncate">{user.email}</p>
                    </div>
                    {user.role === "host" ? (
                      <>
                        <Link
                          href="/host"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left font-semibold"
                        >
                          Manage Listings
                        </Link>
                        <Link
                          href="/host/bookings"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                        >
                          Reservations
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/trips"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left font-semibold"
                        >
                          My Trips
                        </Link>
                        <Link
                          href="/wishlist"
                          onClick={() => setDropdownOpen(false)}
                          className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                        >
                          Wishlist
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-border-gray" />
                    <button
                      onClick={handleLogout}
                      className="px-4 py-2 hover:bg-light-gray text-brand text-left font-semibold"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/register"
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left font-semibold"
                    >
                      Sign up
                    </Link>
                    <Link
                      href="/login"
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                    >
                      Log in
                    </Link>
                    <hr className="my-1 border-border-gray" />
                    <Link
                      href="/register?role=host"
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                    >
                      Rent your home
                    </Link>
                    <button
                      onClick={() => setDropdownOpen(false)}
                      className="px-4 py-2 hover:bg-light-gray text-dark text-left"
                    >
                      Help Center
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Auth Modals */}
      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
        switchToOther={openRegister}
      />
      <RegisterModal
        isOpen={registerOpen}
        onClose={() => setRegisterOpen(false)}
        switchToOther={openLogin}
      />
      <Suspense fallback={null}>
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
        />
      </Suspense>
    </>
  );
};
export default Navbar;
