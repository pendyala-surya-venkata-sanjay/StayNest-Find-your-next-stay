"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plane, Calendar, Users, Info, Building, Trash2, ArrowRight, ShieldAlert, Sparkles, Star, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { StayNestLogo } from "@/components/StayNestLogo";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";

export default function TripsPage() {
  const router = useRouter();
  const { user, loading: authLoading, login } = useAuth();
  const { showToast } = useToast();

  // Trips data states
  const [trips, setTrips] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelConfirmId, setCancelConfirmId] = useState<number | null>(null);

  // Local login form state (for unauthenticated view)
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Cancellation state
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const fetchTrips = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.bookings.getMyTrips();
      // Sort bookings: nearest check-in date first
      data.sort((a, b) => new Date(a.check_in).getTime() - new Date(b.check_in).getTime());
      setTrips(data);
    } catch (err: any) {
      console.error("Failed to load user trips", err);
      setError(err.message || "Failed to fetch booking history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTrips();
    } else {
      setLoading(false);
    }
  }, [user]);

  const handleLocalLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      await login({ email, password });
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleCancelBooking = (bookingId: number) => {
    setCancelConfirmId(bookingId);
  };

  const executeCancellation = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      await api.bookings.cancelBooking(bookingId);
      showToast("Booking cancelled successfully.", "success");
      await fetchTrips();
    } catch (err: any) {
      const errMsg = err.message || "Failed to cancel booking. Please try again later.";
      showToast(errMsg, "error");
    } finally {
      setCancellingId(null);
    }
  };

  if (authLoading) {
    return <Loading fullPage />;
  }

  // 1. UNAUTHENTICATED PROMPT STATE
  if (!user) {
    return (
      <div className="w-full max-w-md mx-auto py-12 px-4 sm:px-6">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="p-4 bg-brand-light text-brand rounded-full border border-brand/10 shadow-xs">
            <Plane size={36} className="rotate-45 stroke-[1.8]" />
          </div>
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-dark">Trips</h1>
          <p className="text-xs text-muted leading-relaxed max-w-xs">
            Log in to see your booked trips, check reservation details, and manage upcoming stays.
          </p>
        </div>

        <form onSubmit={handleLocalLoginSubmit} className="bg-white border border-border-gray/40 p-6 rounded-3xl shadow-card flex flex-col gap-4">
          <h3 className="font-serif text-base font-extrabold text-dark border-b border-border-gray/40 pb-3 mb-2">Guest Log In</h3>
          
          {loginError && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
              {loginError}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-dark uppercase tracking-wider">Email Address</label>
            <input
              type="email"
              placeholder="e.g. john@guest.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loginLoading}
              className="w-full border border-border-gray/60 focus:border-brand focus:ring-brand rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 bg-white text-dark"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-dark uppercase tracking-wider">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loginLoading}
              className="w-full border border-border-gray/60 focus:border-brand focus:ring-brand rounded-xl p-3.5 text-xs focus:outline-none focus:ring-1 bg-white text-dark"
              required
            />
          </div>

          <Button type="submit" variant="brand" fullWidth isLoading={loginLoading} className="py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md mt-2">
            Log In
          </Button>

          <p className="text-[10px] text-muted text-center leading-relaxed mt-2 font-light">
            Seed accounts: <span className="font-semibold text-dark">john@guest.com</span> / <span className="font-semibold text-dark">password123</span>
          </p>
        </form>
      </div>
    );
  }

  // 2. PREMIUM SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto py-6 px-4 sm:px-6 flex flex-col gap-8 animate-pulse bg-[#FAF9F6]">
        <div className="flex flex-col gap-2">
          <div className="h-8 bg-zinc-200/50 rounded-xl w-1/4" />
          <div className="h-4 bg-zinc-200/50 rounded-xl w-1/3" />
        </div>
        <div className="h-64 bg-zinc-200/50 rounded-3xl w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4">
          <div className="h-40 bg-zinc-200/50 rounded-2xl w-full" />
          <div className="h-40 bg-zinc-200/50 rounded-2xl w-full" />
        </div>
      </div>
    );
  }

  // 3. API LOAD ERROR STATE
  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-4">
        <ErrorState
          title="Could not load your trips"
          message={error}
          onRetry={fetchTrips}
        />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const upcomingTrips = trips.filter(
    (t) => t.status === "confirmed" && t.check_out >= todayStr
  );
  const pastCancelledTrips = trips.filter(
    (t) => t.status === "cancelled" || t.check_out < todayStr
  );

  // 4. EMPTY STAYS STATE
  if (trips.length === 0) {
    return (
      <div className="w-full max-w-md mx-auto py-16 px-4 flex flex-col items-center text-center gap-6">
        <div className="p-4 bg-brand-light text-brand rounded-full border border-brand/10 shadow-xs">
          <StayNestLogo variant="mark" size={44} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-extrabold text-dark tracking-tight">No journeys yet</h1>
          <p className="text-sm text-muted max-w-xs font-light">
            Your next memorable sanctuary is waiting. Explore property collections to book your first escape.
          </p>
        </div>
        <Link href="/explore" className="w-full mt-2">
          <Button variant="brand" className="w-full py-3 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md">
            Explore Stays
          </Button>
        </Link>
      </div>
    );
  }

  const renderBookingCard = (booking: Booking, isMuted: boolean, isFeatured = false) => {
    const { listing } = booking;
    const imageUrl = listing.images && listing.images.length > 0
      ? listing.images[0].image_url
      : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

    const isCancelled = booking.status === "cancelled";
    const isUpcomingActive = booking.status === "confirmed" && booking.check_in >= todayStr;

    if (isFeatured) {
      return (
        <div 
          key={booking.id}
          className="flex flex-col lg:flex-row border border-border-gray/40 rounded-3xl overflow-hidden bg-white shadow-card hover-lift"
        >
          {/* Featured left thumbnail */}
          <div className="w-full lg:w-[45%] h-60 lg:h-auto shrink-0 relative bg-zinc-100 min-h-[16rem]">
            <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 bg-brand text-[#FAF9F6] px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-white/10 shadow-sm flex items-center gap-1.5">
              <Sparkles size={10} className="text-accent" />
              <span>Next Escape</span>
            </div>
          </div>
          
          {/* Featured right content */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{listing.category}</span>
              <h3 className="font-serif text-2xl font-extrabold text-dark tracking-tight">{listing.title}</h3>
              <p className="text-xs text-muted flex items-center gap-1">
                <MapPin size={12} className="text-brand" />
                <span>{listing.location_city}, {listing.location_country}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-border-gray/40 pt-4 text-xs font-semibold text-dark">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand" />
                <span>Check-in: {booking.check_in}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-brand" />
                <span>Checkout: {booking.check_out}</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-brand" />
                <span>Guests: {booking.guests_count} guest{booking.guests_count !== 1 ? "s" : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Building size={14} className="text-brand" />
                <span>Nights: {booking.number_of_nights} night{booking.number_of_nights !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between border-t border-border-gray/40 pt-4 gap-4">
              <div className="flex items-baseline gap-1 text-sm font-bold">
                <span className="text-xs text-muted font-normal">Total paid:</span>
                <span className="text-brand font-serif text-lg">₹{booking.total_price.toLocaleString("en-IN")}</span>
              </div>

              <div className="flex items-center gap-4">
                <Link href={`/listings/${listing.id}`} className="text-xs font-bold text-dark hover:underline">
                  View Space
                </Link>
                <span className="text-border-gray text-xs">|</span>
                <Link href={`/checkout/${booking.id}`} className="text-xs font-bold text-brand hover:underline">
                  Details
                </Link>
                {isUpcomingActive && (
                  <>
                    <span className="text-border-gray text-xs">|</span>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="text-xs font-bold text-red-600 hover:underline cursor-pointer focus:outline-none flex items-center gap-1"
                    >
                      <Trash2 size={12} />
                      <span>{cancellingId === booking.id ? "..." : "Cancel"}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={booking.id}
        className={`
          flex flex-col sm:flex-row border border-border-gray/30 rounded-2xl overflow-hidden bg-white hover-lift
          ${isMuted ? "opacity-75 filter grayscale-30 contrast-85" : ""}
        `}
      >
        {/* Left Side: Thumbnail Image */}
        <div className="w-full sm:w-48 h-36 shrink-0 relative bg-zinc-100">
          <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
          <div className="absolute top-2.5 left-2.5 bg-[#FAF9F6]/95 backdrop-blur-xs px-2 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider text-dark">
            {listing.category}
          </div>
        </div>

        {/* Right Side: Stay Specs & Actions */}
        <div className="flex-1 p-5 flex flex-col justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
            <div className="flex flex-col gap-0.5 overflow-hidden">
              <h3 className={`font-serif text-base font-extrabold text-dark truncate ${isCancelled ? "line-through text-muted" : ""}`}>
                {listing.title}
              </h3>
              <p className="text-xs text-muted truncate">
                {listing.location_city}, {listing.location_country}
              </p>
            </div>
            
            {/* Status Badges */}
            <div>
              {isCancelled ? (
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-red-50 text-red-700 border border-red-100">
                  Cancelled
                </span>
              ) : booking.check_out < todayStr ? (
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-zinc-100 text-zinc-500 border border-zinc-200/50">
                  Completed
                </span>
              ) : (
                <span className="inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-100">
                  Confirmed
                </span>
              )}
            </div>
          </div>

          {/* Specs list */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-muted">
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-brand" />
              <span>In: {booking.check_in}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar size={12} className="text-brand" />
              <span>Out: {booking.check_out}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-brand" />
              <span>{booking.guests_count} guest{booking.guests_count !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Building size={12} className="text-brand" />
              <span>{booking.number_of_nights} night{booking.number_of_nights !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Pricing + Action Links footer */}
          <div className="flex flex-col sm:flex-row items-baseline sm:items-center justify-between border-t border-border-gray/30 pt-3 gap-3">
            <div className="flex items-baseline gap-1 text-dark text-xs font-semibold">
              <span className="text-muted font-normal">Total paid:</span>
              <span className={`font-serif text-sm font-bold ${isCancelled ? "text-muted" : "text-brand"}`}>
                ₹{booking.total_price.toLocaleString("en-IN")}
              </span>
              <span className="text-[9px] text-muted font-normal font-mono">
                (Ref: #{booking.id})
              </span>
            </div>

            {/* Link Options */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs font-bold">
              <Link href={`/listings/${listing.id}`} className="text-dark hover:underline">
                View Stay
              </Link>
              <span className="text-border-gray">|</span>
              <Link href={`/checkout/${booking.id}`} className="text-brand hover:underline">
                Details
              </Link>
              {isUpcomingActive && (
                <>
                  <span className="text-border-gray">|</span>
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={cancellingId === booking.id}
                    className="text-red-600 hover:underline cursor-pointer focus:outline-none flex items-center gap-1"
                  >
                    <Trash2 size={12} />
                    <span>{cancellingId === booking.id ? "..." : "Cancel"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-2 px-4 sm:px-6 flex flex-col gap-12 bg-[#FAF9F6]">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-border-gray/40 pb-4">
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-dark">My Journeys</h1>
        <span className="text-xs text-muted font-medium">Logged in as {user.name}</span>
      </div>

      {/* 5. ACTIVE/UPCOMING TRIPS SECTION */}
      <div className="flex flex-col gap-6">
        <h2 className="font-serif text-lg sm:text-xl font-bold text-dark">Upcoming Trips</h2>
        {upcomingTrips.length === 0 ? (
          <div className="p-8 border border-dashed border-border-gray/50 rounded-3xl text-center bg-white flex flex-col items-center gap-3 shadow-xs">
            <StayNestLogo variant="mark" size={28} className="animate-spin-slow" />
            <p className="text-xs text-muted font-light max-w-xs leading-relaxed">You have no upcoming confirmed stays booked currently. Start exploring sanctuaries to begin your escape.</p>
            <Link href="/explore" className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-1.5 mt-1 bg-brand-light px-4 py-2 rounded-xl border border-brand/10 shadow-xs">
              Explore Listings
              <ArrowRight size={12} />
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Nearest stay highlighted */}
            {renderBookingCard(upcomingTrips[0], false, true)}
            
            {/* Rest of the upcoming stays */}
            {upcomingTrips.slice(1).length > 0 && (
              <div className="flex flex-col gap-6 mt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Other Upcoming Journeys</h3>
                {upcomingTrips.slice(1).map((booking) => renderBookingCard(booking, false))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Past & Cancelled Trips Section */}
      {pastCancelledTrips.length > 0 && (
        <div className="flex flex-col gap-6 mt-4">
          <h2 className="font-serif text-lg sm:text-xl font-bold text-dark">Past & Cancelled stays</h2>
          <div className="flex flex-col gap-6">
            {pastCancelledTrips.map((booking) => renderBookingCard(booking, true))}
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Custom Modal */}
      <Modal
        isOpen={cancelConfirmId !== null}
        onClose={() => setCancelConfirmId(null)}
        title="Cancel this reservation?"
        size="sm"
      >
        <div className="flex flex-col gap-4 text-xs font-medium">
          <p className="text-sm leading-relaxed text-muted font-light">
            This action will cancel your stay and release reserved dates. Are you sure you want to proceed?
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setCancelConfirmId(null)}
              className="py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl"
            >
              Keep reservation
            </Button>
            <Button
              variant="brand"
              fullWidth
              onClick={async () => {
                const id = cancelConfirmId;
                setCancelConfirmId(null);
                if (id !== null) {
                  await executeCancellation(id);
                }
              }}
              className="py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
