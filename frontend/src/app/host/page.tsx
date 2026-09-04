"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Building, Calendar, Users, DollarSign, Star, UserX, AlertTriangle, ShieldCheck, Tag, Ban, Edit, Settings, ChevronRight, LayoutDashboard, Home, BookOpen, ClipboardList, MapPin, ChevronLeft, Sparkles } from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, parseISO, startOfToday } from "date-fns";
import { api } from "@/lib/api";
import { Listing, Booking } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { Modal } from "@/components/Modal";
import { useToast } from "@/context/ToastContext";

// HOST CALENDAR GRID SUB-COMPONENT
interface HostCalendarViewProps {
  blockedDates: string[];
  bookings: Booking[];
  onSelectBooking: (booking: Booking | null) => void;
  selectedBooking: Booking | null;
}

const HostCalendarView: React.FC<HostCalendarViewProps> = ({
  blockedDates,
  bookings,
  onSelectBooking,
  selectedBooking,
}) => {
  const today = startOfToday();
  const [currentMonth, setCurrentMonth] = useState(today);
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

  const start = startOfMonth(currentMonth);
  const end = endOfMonth(currentMonth);
  const startDayOfWeek = start.getDay();
  const daysInMonth = eachDayOfInterval({ start, end });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => {
    if (isAfter(startOfMonth(currentMonth), today)) {
      setCurrentMonth(subMonths(currentMonth, 1));
    }
  };

  const getBookingForDate = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    return bookings.find((b) => {
      if (b.status === "cancelled") return false;
      return formatted >= b.check_in && formatted <= b.check_out;
    });
  };

  const isBlocked = (date: Date) => {
    const formatted = format(date, "yyyy-MM-dd");
    return blockedDates.includes(formatted);
  };

  const isPast = (date: Date) => {
    return isBefore(date, today);
  };

  const handleDateClick = (date: Date) => {
    const booking = getBookingForDate(date);
    if (booking) {
      onSelectBooking(booking);
    } else {
      onSelectBooking(null);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Month Navigation Banner */}
      <div className="flex items-center justify-between border-b border-border-gray/20 pb-3 mb-2">
        <h4 className="text-xs font-bold text-dark font-serif uppercase tracking-wider">
          {format(currentMonth, "MMMM yyyy")}
        </h4>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isSameDay(startOfMonth(currentMonth), startOfMonth(today))}
            className="p-1 rounded-full border border-border-gray hover:border-brand disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer text-dark hover:text-brand"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1 rounded-full border border-border-gray hover:border-brand transition-colors cursor-pointer text-dark hover:text-brand"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Weekday Labels Header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold uppercase tracking-wider text-muted mb-2">
        <span>Su</span>
        <span>Mo</span>
        <span>Tu</span>
        <span>We</span>
        <span>Th</span>
        <span>Fr</span>
        <span>Sa</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1.5 justify-items-center text-xs font-semibold">
        {/* Padding empty slots */}
        {Array.from({ length: startDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8" />
        ))}

        {/* Month Dates */}
        {daysInMonth.map((day) => {
          const booking = getBookingForDate(day);
          const past = isPast(day);
          const blocked = isBlocked(day);
          
          let selected = false;
          if (selectedBooking && booking) {
            selected = selectedBooking.id === booking.id;
          }

          return (
            <button
              type="button"
              key={day.toString()}
              onClick={() => handleDateClick(day)}
              className={`
                w-8 h-8 flex flex-col items-center justify-center rounded-full transition-all relative text-[10px] font-bold
                ${past ? "bg-zinc-100 text-zinc-400 cursor-default" : "text-dark cursor-pointer"}
                ${blocked && !past ? "bg-brand text-[#FAF9F6]" : ""}
                ${selected && !past ? "bg-accent text-white" : ""}
                ${!blocked && !past ? "hover:bg-brand/10 border border-border-gray/30 bg-white" : ""}
              `}
            >
              <span>{format(day, "d")}</span>
              {booking && !past && (
                <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};


// MAIN DASHBOARD COMPONENT
export default function HostDashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { showToast } = useToast();

  // Selected tab
  const [activeTab, setActiveTab] = useState<"listings" | "bookings">("listings");

  // Host data states
  const [listings, setListings] = useState<Listing[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Deactivation state
  const [deactivatingId, setDeactivatingId] = useState<number | null>(null);
  const [deactivateConfirmId, setDeactivateConfirmId] = useState<number | null>(null);

  // Availability calendar states
  const [selectedListingForCalendar, setSelectedListingForCalendar] = useState<Listing | null>(null);
  const [listingBlockedDates, setListingBlockedDates] = useState<string[]>([]);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedBookingForDetails, setSelectedBookingForDetails] = useState<Booking | null>(null);

  const fetchHostData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingsData, bookingsData] = await Promise.all([
        api.host.getListings(),
        api.host.getBookings(),
      ]);
      setListings(listingsData);
      setBookings(bookingsData);
    } catch (err: any) {
      console.error("Failed to load host dashboard details", err);
      setError(err.message || "Failed to retrieve host information from the server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === "host") {
      fetchHostData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchAvailabilityForListing = async (listingId: number) => {
    setAvailabilityLoading(true);
    setSelectedBookingForDetails(null);
    try {
      const data = await api.listings.getBlockedDates(listingId);
      setListingBlockedDates(data.blocked_dates);
    } catch (err) {
      console.error("Failed to load availability dates", err);
      showToast("Failed to fetch availability dates for listing.", "error");
    } finally {
      setAvailabilityLoading(false);
    }
  };

  const handleDeactivateListing = (listingId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDeactivateConfirmId(listingId);
  };

  const executeDeactivation = async (listingId: number) => {
    setDeactivatingId(listingId);
    try {
      await api.listings.deleteListing(listingId);
      showToast("Listing deactivated successfully.", "success");
      await fetchHostData();
    } catch (err: any) {
      const errMsg = err.message || "Failed to deactivate listing. Please try again.";
      showToast(errMsg, "error");
    } finally {
      setDeactivatingId(null);
    }
  };

  if (authLoading) {
    return <Loading fullPage />;
  }

  // 1. UNAUTHORIZED / NON-HOST ROLE STATE
  if (!user || user.role !== "host") {
    return (
      <div className="w-full max-w-lg mx-auto py-16 px-4 flex flex-col items-center text-center gap-6">
        <div className="p-4 bg-red-50 text-red-500 rounded-full border border-red-100 shadow-xs">
          <ShieldCheck size={44} className="stroke-[1.8] text-red-500" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-extrabold tracking-tight text-dark">Host Access Required</h1>
          <p className="text-sm text-muted max-w-md font-light leading-relaxed">
            This workspace section is restricted to hosts only. If you own properties and want to host stays, please log in with a Host account.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
          <Button variant="secondary" onClick={() => router.push("/")} className="py-2.5 px-6 font-semibold rounded-xl">
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  // 2. PREMIUM DASHBOARD SKELETON LOADER
  if (loading) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-4 sm:px-6 flex flex-col gap-8 animate-pulse bg-[#FAF9F6]">
        <div className="flex flex-col gap-2">
          <div className="h-8 bg-zinc-200/50 rounded-xl w-1/4" />
          <div className="h-4 bg-zinc-200/50 rounded-xl w-1/3" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="h-24 bg-zinc-200/50 rounded-2xl w-full" />
          ))}
        </div>
        <div className="h-96 bg-zinc-200/50 rounded-3xl w-full" />
      </div>
    );
  }

  // 3. ERROR STATE
  if (error) {
    return (
      <div className="w-full max-w-lg mx-auto py-12 px-4">
        <ErrorState
          title="Could not load host dashboard"
          message={error}
          onRetry={fetchHostData}
        />
      </div>
    );
  }

  const activeListingsCount = listings.filter((l) => l.is_active).length;

  return (
    <div className="w-full max-w-7xl mx-auto py-2 px-4 sm:px-6 flex flex-col gap-8 bg-[#FAF9F6]">
      
      {/* Dashboard Stats Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-gray/40 pb-6">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-dark flex items-center gap-2">
            <LayoutDashboard className="text-brand shrink-0" size={32} />
            Host Console
          </h1>
          <p className="text-xs text-muted">Welcome back, {user.name} · Managing your properties</p>
        </div>
        
        <Link href="/host/listings/new">
          <Button variant="brand" className="py-3 px-5 font-bold flex items-center gap-1.5 shadow-md text-xs uppercase tracking-wider rounded-xl">
            <Plus size={14} className="stroke-[3]" />
            New Listing
          </Button>
        </Link>
      </div>

      {/* Grid Stats Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-5 border border-border-gray/40 rounded-3xl bg-white shadow-card flex flex-col justify-between h-28">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <Home size={10} className="text-brand" />
            Total Listings
          </span>
          <p className="text-2xl font-bold text-dark font-serif mt-1">{listings.length}</p>
        </div>
        <div className="p-5 border border-border-gray/40 rounded-3xl bg-white shadow-card flex flex-col justify-between h-28 border-l-4 border-l-brand">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <ShieldCheck size={10} className="text-brand" />
            Active Properties
          </span>
          <p className="text-2xl font-bold text-brand font-serif mt-1">{activeListingsCount}</p>
        </div>
        <div className="p-5 border border-border-gray/40 rounded-3xl bg-white shadow-card flex flex-col justify-between h-28">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <BookOpen size={10} className="text-brand" />
            Bookings Count
          </span>
          <p className="text-2xl font-bold text-dark font-serif mt-1">{bookings.length}</p>
        </div>
        <div className="p-5 border border-border-gray/40 rounded-3xl bg-white shadow-card flex flex-col justify-between h-28 border-l-4 border-l-accent">
          <span className="text-[9px] font-bold text-muted uppercase tracking-wider flex items-center gap-1">
            <DollarSign size={10} className="text-accent" />
            Est. Revenue
          </span>
          <p className="text-2xl font-bold text-dark font-serif mt-1">
            ₹{bookings.reduce((sum, b) => b.status === "confirmed" ? sum + b.total_price : sum, 0).toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 5. PROPERTY AVAILABILITY CALENDAR WORKSPACE CONDITIONAL */}
      {selectedListingForCalendar ? (
        <div className="flex flex-col gap-6 animate-fade-in bg-white border border-border-gray/40 rounded-3xl p-6 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-gray/40 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedListingForCalendar(null)}
                className="text-xs font-bold text-brand hover:underline flex items-center gap-1 bg-brand-light px-3 py-1.5 rounded-xl border border-brand/10"
              >
                <ChevronLeft size={14} />
                Back to Console
              </button>
              <div>
                <h3 className="font-serif text-lg sm:text-xl font-extrabold text-dark leading-tight">
                  {selectedListingForCalendar.title}
                </h3>
                <p className="text-xs text-muted mt-0.5">Availability Calendar & Bookings Manager</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Property Category:</span>
              <span className="bg-brand-light text-brand px-2 py-0.5 rounded-lg border border-brand/15 text-[10px] font-bold uppercase tracking-widest">
                {selectedListingForCalendar.category}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Calendar grid block: lg:col-span-7 */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              
              {/* Legend Indicator list */}
              <div className="flex flex-wrap items-center gap-4 text-[9px] font-bold uppercase tracking-wider text-muted bg-[#FAF9F6] p-4 rounded-2xl border border-border-gray/40">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-white border border-border-gray/60" />
                  <span>Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-brand" />
                  <span>Reserved</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-accent" />
                  <span>Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded-full bg-zinc-100 border border-zinc-200" />
                  <span>Past Dates</span>
                </div>
              </div>

              {/* Calendar Grid Container */}
              <div className="border border-border-gray/40 rounded-3xl p-6 bg-white shadow-xs">
                {availabilityLoading ? (
                  <div className="h-64 flex items-center justify-center text-xs text-muted">
                    <Loading />
                  </div>
                ) : (
                  <HostCalendarView
                    blockedDates={listingBlockedDates}
                    bookings={bookings.filter((b) => b.listing_id === selectedListingForCalendar.id)}
                    onSelectBooking={(b) => setSelectedBookingForDetails(b)}
                    selectedBooking={selectedBookingForDetails}
                  />
                )}
              </div>

            </div>

            {/* Right side: Booking details panel block: lg:col-span-5 */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <h3 className="font-serif text-base font-extrabold text-dark flex items-center gap-1.5 border-b border-border-gray/40 pb-3">
                <ClipboardList size={18} className="text-brand" />
                Reservation Details
              </h3>

              {selectedBookingForDetails ? (
                <div className="bg-[#FAF9F6] border border-border-gray/40 rounded-3xl p-6 shadow-card flex flex-col gap-4 animate-fade-in text-xs font-semibold text-dark">
                  <div className="flex items-center justify-between border-b border-border-gray/30 pb-3">
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Ref ID: #{selectedBookingForDetails.id}</span>
                    {selectedBookingForDetails.status === "cancelled" ? (
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-red-50 text-red-700 border border-red-100">
                        Cancelled
                      </span>
                    ) : (
                      <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Confirmed
                      </span>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-muted uppercase font-bold tracking-wider font-mono">Guest Details</span>
                    <p className="text-sm font-bold text-dark">{selectedBookingForDetails.guest?.name || "Guest User"}</p>
                    <p className="text-xs text-muted font-normal font-light">{selectedBookingForDetails.guest?.email || "guest@staynest.com"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-border-gray/30 pt-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Check-in</span>
                      <p className="text-xs text-dark">{selectedBookingForDetails.check_in}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Checkout</span>
                      <p className="text-xs text-dark">{selectedBookingForDetails.check_out}</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Nights</span>
                      <p className="text-xs text-dark">{selectedBookingForDetails.number_of_nights} nights</p>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Guests Limit</span>
                      <p className="text-xs text-dark">{selectedBookingForDetails.guests_count} Guests</p>
                    </div>
                  </div>

                  <div className="border-t border-border-gray/30 pt-4 flex items-center justify-between text-dark">
                    <div className="flex flex-col">
                      <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Total earnings</span>
                      <span className="font-serif text-lg font-bold text-brand mt-0.5">
                        ₹{selectedBookingForDetails.total_price.toLocaleString("en-IN")}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedBookingForDetails(null)}
                      className="text-xs font-bold text-brand hover:underline"
                    >
                      Deselect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-border-gray/50 rounded-3xl text-center bg-white flex flex-col items-center gap-3">
                  <Calendar className="text-brand shrink-0" size={24} />
                  <p className="text-xs text-muted font-light leading-relaxed">
                    Select a booked date range on the calendar to inspect reservation logs.
                  </p>
                </div>
              )}

            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Tabs Selector Navigation */}
          <div className="flex items-center gap-6 border-b border-border-gray/40 pb-0.5">
            <button
              onClick={() => setActiveTab("listings")}
              className={`
                pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5
                ${
                  activeTab === "listings"
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-dark"
                }
              `}
            >
              <Home size={12} />
              My Listings ({listings.length})
            </button>
            <button
              onClick={() => setActiveTab("bookings")}
              className={`
                pb-3 text-xs uppercase tracking-wider font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5
                ${
                  activeTab === "bookings"
                    ? "border-brand text-brand"
                    : "border-transparent text-muted hover:text-dark"
                }
              `}
            >
              <ClipboardList size={12} />
              Guest Reservations ({bookings.length})
            </button>
          </div>

          {/* 4. ACTIVE TAB CONTENT SECTION */}
          {activeTab === "listings" ? (
            
            // --- TABS VIEW 1: MY LISTINGS ---
            listings.length === 0 ? (
              <EmptyState
                title="Create your first listing!"
                description="Expose your cabins or villas to guests worldwide. Start hosting today."
                actionText="Create Listing"
                onAction={() => router.push("/host/listings/new")}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {listings.map((listing) => {
                  const imageUrl = listing.images && listing.images.length > 0
                    ? listing.images[0].image_url
                    : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

                  return (
                    <div key={listing.id} className="border border-border-gray/40 rounded-3xl overflow-hidden shadow-card bg-white flex flex-col justify-between hover-lift">
                      <div className="relative h-48 bg-zinc-100">
                        <img src={imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                        
                        {/* Status Badge indicator */}
                        <div className="absolute top-3 left-3">
                          {listing.is_active ? (
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-red-100 text-red-800 border border-red-200">
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 right-3 bg-white/95 px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-brand shadow-xs border border-brand/10">
                          {listing.category}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col gap-4 flex-1 justify-between">
                        <div className="flex flex-col gap-1">
                          <h4 className="font-serif text-lg font-extrabold text-dark truncate leading-tight">{listing.title}</h4>
                          <p className="text-xs text-muted truncate flex items-center gap-1">
                            <MapPin size={10} className="text-brand" />
                            <span>{listing.location_city}, {listing.location_country}</span>
                          </p>
                          
                          <div className="grid grid-cols-2 gap-2 mt-2 py-2 border-t border-b border-border-gray/20 text-[10px] text-muted font-semibold uppercase tracking-wider">
                            <span className="flex items-center gap-1">
                              <Users size={12} className="text-brand" />
                              {listing.guests_count} Guests
                            </span>
                            <span className="flex items-center gap-1">
                              <Building size={12} className="text-brand" />
                              {listing.bedrooms_count} Bedrooms
                            </span>
                          </div>

                          <p className="text-sm font-bold text-dark mt-2 font-serif">
                            ₹{listing.price_per_night.toLocaleString("en-IN")} <span className="font-normal text-xs text-muted font-sans">/ night</span>
                          </p>
                        </div>

                        {/* Roster Actions */}
                        <div className="border-t border-border-gray/40 pt-4 flex flex-col gap-2">
                          <div className="flex items-center gap-3">
                            <Link href={`/host/listings/${listing.id}/edit`} className="flex-1">
                              <Button variant="secondary" fullWidth className="py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider rounded-xl">
                                <Edit size={12} />
                                Edit
                              </Button>
                            </Link>
                            
                            <Button
                              variant="secondary"
                              onClick={() => {
                                setSelectedListingForCalendar(listing);
                                fetchAvailabilityForListing(listing.id);
                              }}
                              className="flex-1 py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-wider rounded-xl bg-brand-light text-brand hover:bg-brand/10 border border-brand/10 cursor-pointer"
                            >
                              <Calendar size={12} />
                              Calendar
                            </Button>
                          </div>

                          {listing.is_active && (
                            <Button
                              variant="outline"
                              onClick={(e) => handleDeactivateListing(listing.id, e)}
                              isLoading={deactivatingId === listing.id}
                              className="w-full py-2.5 flex items-center justify-center gap-1.5 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                            >
                              <Ban size={12} />
                              Deactivate
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            
            // --- TABS VIEW 2: GUEST RESERVATIONS ---
            bookings.length === 0 ? (
              <div className="p-12 border border-dashed border-border-gray/50 rounded-3xl text-center bg-white flex flex-col items-center gap-3 max-w-md mx-auto shadow-xs">
                <Calendar className="text-brand animate-pulse" size={32} />
                <h4 className="font-serif text-base font-extrabold text-dark">No reservations yet</h4>
                <p className="text-xs text-muted font-light">When a guest books one of your listings, details will appear here.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4 animate-fade-in">
                {bookings.map((booking) => {
                  const isCancelled = booking.status === "cancelled";
                  return (
                    <div
                      key={booking.id}
                      className={`
                        border border-border-gray/40 rounded-3xl p-5 bg-white flex flex-col md:flex-row justify-between md:items-center gap-4 hover:shadow-card transition-all duration-300
                        ${isCancelled ? "opacity-75 bg-zinc-50/50" : ""}
                      `}
                    >
                      <div className="flex flex-col gap-1.5 overflow-hidden">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-brand uppercase tracking-wider">Ref ID: #{booking.id}</span>
                          {isCancelled ? (
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-red-50 text-red-700 border border-red-100">
                              Cancelled
                            </span>
                          ) : (
                            <span className="inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Confirmed
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-serif text-base font-extrabold text-dark truncate leading-snug">{booking.listing.title}</h4>
                        
                        <div className="flex items-center gap-4 text-xs text-muted mt-1 flex-wrap font-semibold">
                          <span>Guest: <strong className="text-dark font-bold">{booking.guest?.name || "Guest User"}</strong></span>
                          <span>Dates: <strong className="text-brand font-bold">{booking.check_in} to {booking.check_out}</strong></span>
                          <span>Nights: <strong className="text-dark font-bold">{booking.number_of_nights}</strong></span>
                          <span>Guests: <strong className="text-dark font-bold">{booking.guests_count}</strong></span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-border-gray/20 pt-3 md:pt-0">
                        <div className="flex flex-col text-left md:text-right">
                          <span className="text-[9px] text-muted uppercase font-bold tracking-wider">Total earnings</span>
                          <span className={`text-base font-bold text-dark font-serif ${isCancelled ? "text-muted line-through" : "text-brand"}`}>
                            ₹{booking.total_price.toLocaleString("en-IN")}
                          </span>
                        </div>
                        
                        <Link href={`/checkout/${booking.id}`}>
                          <button className="flex items-center gap-1 text-xs font-bold text-dark hover:underline underline-offset-4 cursor-pointer focus:outline-none bg-brand-light px-3 py-1.5 rounded-lg border border-brand/10">
                            Details
                            <ChevronRight size={14} />
                          </button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}

      {/* Listing Deactivation Custom Modal */}
      <Modal
        isOpen={deactivateConfirmId !== null}
        onClose={() => setDeactivateConfirmId(null)}
        title="Deactivate this listing?"
        size="sm"
      >
        <div className="flex flex-col gap-4 text-xs font-medium">
          <p className="text-sm leading-relaxed text-muted font-light">
            Are you sure you want to deactivate this listing? It will no longer appear in Explore search results, but historical reservation logs will remain intact.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Button
              variant="outline"
              fullWidth
              onClick={() => setDeactivateConfirmId(null)}
              className="py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl"
            >
              Cancel
            </Button>
            <Button
              variant="brand"
              fullWidth
              onClick={async () => {
                const id = deactivateConfirmId;
                setDeactivateConfirmId(null);
                if (id !== null) {
                  await executeDeactivation(id);
                }
              }}
              className="py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl"
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  );
}
