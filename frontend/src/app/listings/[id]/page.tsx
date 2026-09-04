"use client";

import React, { useState, useEffect, use } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, MapPin, ChevronLeft, ChevronRight, Heart, Wifi, Waves, Utensils, Car, Wind, Tv, Shield, Users, Calendar, ArrowRight, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { Listing, Review } from "@/types";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { ErrorState } from "@/components/ErrorState";
import { CalendarPicker } from "@/components/CalendarPicker";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-zinc-50 border border-border-gray rounded-2xl flex items-center justify-center text-xs text-muted">
      Loading location map...
    </div>
  ),
});

// Maps Lucide icons to specific amenity keywords
const getAmenityIcon = (name: string) => {
  const norm = name.toLowerCase();
  if (norm.includes("wi-fi") || norm.includes("wifi") || norm.includes("internet")) return <Wifi size={18} className="text-brand" />;
  if (norm.includes("pool") || norm.includes("swimming")) return <Waves size={18} className="text-brand" />;
  if (norm.includes("kitchen") || norm.includes("cooking")) return <Utensils size={18} className="text-brand" />;
  if (norm.includes("parking") || norm.includes("garage") || norm.includes("car")) return <Car size={18} className="text-brand" />;
  if (norm.includes("ac") || norm.includes("air cond") || norm.includes("cooling")) return <Wind size={18} className="text-brand" />;
  if (norm.includes("tv") || norm.includes("television") || norm.includes("cable")) return <Tv size={18} className="text-brand" />;
  return <Shield size={18} className="text-brand" />;
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ListingDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  // Resolve promise params
  const resolvedParams = use(params);
  const listingId = Number(resolvedParams.id);

  // States
  const [listing, setListing] = useState<Listing | null>(null);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Booking widget states
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState<"checkIn" | "checkOut">("checkIn");
  const isOwner = !!(user && listing && user.id === listing.host_id);

  // Review submission states
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [listingData, availabilityData, reviewsData] = await Promise.all([
        api.listings.getListing(listingId),
        api.listings.getBlockedDates(listingId),
        api.reviews.getReviews(listingId),
      ]);
      setListing(listingData);
      setBlockedDates(availabilityData.blocked_dates);
      setReviews(reviewsData);
      
      if (listingData.guests_count) {
        setGuestsCount(1);
      }
    } catch (err: any) {
      console.error("Failed to load listing details", err);
      setError(err.message || "Failed to retrieve listing details.");
    } finally {
      setLoading(false);
    }
  };

  const checkWishlistStatus = async () => {
    if (user) {
      try {
        const wishlist = await api.wishlist.getWishlist();
        const saved = wishlist.some((item) => item.listing_id === listingId);
        setIsWishlisted(saved);
      } catch (err) {
        console.error("Failed to query wishlist status", err);
      }
    } else {
      setIsWishlisted(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [listingId]);

  useEffect(() => {
    checkWishlistStatus();
  }, [listingId, user]);

  const toggleWishlist = async () => {
    if (!user) {
      showToast("Please log in or register to save items to your wishlist!", "info");
      return;
    }
    try {
      if (isWishlisted) {
        await api.wishlist.removeFromWishlist(listingId);
        setIsWishlisted(false);
        showToast("Stay removed from your wishlist.", "info");
      } else {
        await api.wishlist.addToWishlist(listingId);
        setIsWishlisted(true);
        showToast("Stay saved to your wishlist!", "success");
      }
    } catch (err: any) {
      console.error("Failed to toggle wishlist", err);
      showToast(err.message || "Failed to update wishlist.", "error");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || newComment.length < 2) {
      setReviewError("Comment must be at least 2 characters long.");
      return;
    }

    setReviewSubmitting(true);
    setReviewError(null);
    setReviewSuccess(false);

    try {
      await api.reviews.createReview(listingId, {
        rating: newRating,
        comment: newComment,
      });
      setReviewSuccess(true);
      setNewComment("");
      setNewRating(5);
      showToast("Review submitted successfully!", "success");

      // Reload reviews and listing details (recalculates stats)
      const [reviewsData, listingData] = await Promise.all([
        api.reviews.getReviews(listingId),
        api.listings.getListing(listingId),
      ]);
      setReviews(reviewsData);
      setListing(listingData);
    } catch (err: any) {
      console.error("Failed to submit review", err);
      const errMsg = err.message || "You must have a confirmed booking to review this stay.";
      setReviewError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      showToast("Please log in or register before reserving a stay.", "info");
      return;
    }

    if (!checkIn || !checkOut) {
      showToast("Please select check-in and check-out dates.", "info");
      return;
    }

    setBookingLoading(true);
    try {
      const newBooking = await api.bookings.createBooking({
        listing_id: listing!.id,
        check_in: checkIn,
        check_out: checkOut,
        guests_count: guestsCount,
      });
      showToast("Reservation successful! Redirecting to checkout...", "success");
      router.push(`/checkout/${newBooking.id}`);
    } catch (err: any) {
      const errMsg = err.message || "Failed to make booking. The dates might have been booked in the meantime.";
      showToast(errMsg, "error");
    } finally {
      setBookingLoading(false);
    }
  };

  // PREMIUM SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-4 animate-pulse">
        {/* Gallery placeholder */}
        <div className="relative aspect-[21/10] w-full rounded-3xl bg-white border border-border-gray/30 shadow-xs" />
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4">
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className="flex flex-col gap-3">
              <div className="h-8 bg-zinc-200/50 rounded-xl w-3/4" />
              <div className="h-4 bg-zinc-200/50 rounded-xl w-1/3" />
            </div>
            <hr className="border-border-gray/50" />
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-2 w-2/3">
                <div className="h-5 bg-zinc-200/50 rounded-xl w-1/2" />
                <div className="h-3 bg-zinc-200/50 rounded-xl w-1/3" />
              </div>
              <div className="w-12 h-12 rounded-full bg-zinc-200/50" />
            </div>
          </div>
          <div className="lg:col-span-4 border border-border-gray/40 rounded-3xl p-6 bg-white flex flex-col gap-4 h-[350px]" />
        </div>
      </div>
    );
  }

  // PREMIUM ERROR STATE
  if (error || !listing) {
    return (
      <div className="py-16 max-w-lg mx-auto px-4 flex flex-col items-center text-center gap-6">
        <div className="p-4 bg-brand-light text-brand rounded-full border border-brand/10 shadow-xs">
          <MapPin size={44} className="stroke-[1.8]" />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-3xl font-extrabold text-dark tracking-tight">Stay Not Found</h1>
          <p className="text-sm text-muted max-w-md">
            The boutique sanctuary you are trying to view could not be loaded. Please check your network connection or explore alternative listings.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-2">
          <Button variant="brand" onClick={fetchData} className="py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-xl">
            Retry Connection
          </Button>
          <Link href="/explore">
            <Button variant="secondary" className="py-2.5 px-6 font-bold text-xs uppercase tracking-wider rounded-xl w-full">
              Explore Stays
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Gallery setups
  const galleryImages = listing.images && listing.images.length > 0
    ? listing.images.map(img => img.image_url)
    : [
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=1200&q=80",
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?auto=format&fit=crop&w=800&q=80"
      ];

  // Calculate pricing breakdown in sync with the backend
  let nights = 0;
  let subtotal = 0;
  let cleaningFee = 0;
  let serviceFee = 0;
  let totalPrice = 0;

  if (checkIn && checkOut) {
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    nights = Math.max(1, Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24)));
    subtotal = listing.price_per_night * nights;
    cleaningFee = subtotal * 0.15;
    serviceFee = subtotal * 0.10;
    totalPrice = subtotal + cleaningFee + serviceFee;
  }

  // Calculate average rating dynamically
  const reviewsCount = reviews.length;
  const avgRating = reviewsCount > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviewsCount).toFixed(2)
    : "New";

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-2">
      
      {/* Cinematic Stays Landscape Gallery */}
      <div className="relative w-full aspect-[21/10] rounded-3xl overflow-hidden shadow-md border border-border-gray/30 group bg-zinc-50">
        <img
          src={galleryImages[activeImageIdx]}
          alt={`${listing.title} Gallery ${activeImageIdx + 1}`}
          className="w-full h-full object-cover transition-all duration-500 ease-out"
        />
        
        {/* Soft bottom atmospheric gradient for typography contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

        {/* Navigation Keys */}
        {galleryImages.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.preventDefault();
                setActiveImageIdx((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-dark shadow-sm border border-border-gray/20 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
              aria-label="Previous Image"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setActiveImageIdx((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-dark shadow-sm border border-border-gray/20 flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95"
              aria-label="Next Image"
            >
              <ChevronRight size={16} />
            </button>
          </>
        )}

        {/* Counter indicator */}
        <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-xs px-3 py-1 rounded-lg text-[10px] font-bold tracking-widest text-[#FAF9F6] uppercase border border-white/10">
          {activeImageIdx + 1} / {galleryImages.length}
        </div>

        {/* Wishlist Hearts button floating over gallery */}
        <button
          onClick={toggleWishlist}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-[#FAF9F6]/95 hover:bg-white backdrop-blur-md shadow-sm hover:scale-105 active:scale-95 transition-all text-dark border border-border-gray/30 focus:outline-none cursor-pointer"
          aria-label="Save to wishlist"
        >
          <Heart size={16} className={isWishlisted ? "fill-brand stroke-brand scale-110 transition-transform" : "text-dark"} />
        </button>
      </div>

      {/* Detail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-4 relative items-start">
        
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* Title & Metadata Header */}
          <div className="flex flex-col gap-3 border-b border-border-gray pb-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-brand-light text-brand px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border border-brand/10">
                {listing.category}
              </span>
              {reviewsCount > 0 && (
                <span className="flex items-center gap-1 bg-accent-light border border-accent/20 px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-accent-dark">
                  <Star size={10} className="fill-accent stroke-accent" />
                  <span>{avgRating} ({reviewsCount} review{reviewsCount !== 1 ? "s" : ""})</span>
                </span>
              )}
            </div>
            
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-dark leading-tight">
              {listing.title}
            </h1>
            
            <p className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5 mt-1">
              <MapPin size={12} className="text-brand" />
              <span>{listing.location_city}, {listing.location_country}</span>
            </p>
          </div>

          {/* Redesigned Host Section */}
          <div className="border-b border-border-gray pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-dark">
                Entire stay hosted by {listing.host.name}
              </h2>
              <p className="text-xs text-muted font-medium mt-0.5">
                Guests capacity: {listing.guests_count} · Bedrooms: {listing.bedrooms_count} · Bathrooms: {listing.bathrooms_count}
              </p>
            </div>
            <div className="flex items-center gap-3 bg-[#FAF9F6] border border-border-gray/40 px-4 py-2.5 rounded-2xl">
              <div className="w-10 h-10 rounded-full border border-border-gray overflow-hidden bg-zinc-50 shrink-0">
                {listing.host.avatar_url ? (
                  <img src={listing.host.avatar_url} alt={listing.host.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-brand font-bold bg-brand-light text-sm">
                    {listing.host.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-dark">{listing.host.name}</span>
                <span className="text-[9px] text-muted uppercase tracking-wider">Boutique Host</span>
              </div>
            </div>
          </div>

          {/* About Space Section */}
          <div className="border-b border-border-gray pb-6">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark mb-3">About this sanctuary</h3>
            <p className="text-xs sm:text-sm leading-relaxed text-dark font-light whitespace-pre-line">{listing.description}</p>
          </div>

          {/* Redesigned Amenities grid */}
          <div className="border-b border-border-gray pb-6">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark mb-4">What this sanctuary offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {listing.amenities.map((am) => (
                <div key={am.id} className="flex items-center gap-3 bg-white border border-border-gray/30 p-3 rounded-xl hover:shadow-2xs transition-all duration-200">
                  <div className="p-1.5 rounded-lg bg-brand-light text-brand">
                    {getAmenityIcon(am.name)}
                  </div>
                  <span className="text-xs font-bold text-dark">{am.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Check-in & Check-out Quick Display */}
          <div className="border-b border-border-gray pb-6 flex flex-col gap-4">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark">Selected Travel Dates</h3>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div 
                onClick={() => {
                  setCalendarOpen(true);
                  setSelectionMode("checkIn");
                }}
                className={`bg-white border border-border-gray/40 p-4 rounded-2xl shadow-xs hover:shadow-md cursor-pointer flex flex-col gap-1 transition-all ${selectionMode === "checkIn" && calendarOpen ? "ring-2 ring-brand" : ""}`}
              >
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Check-in</span>
                <span className="font-bold text-dark text-sm">{checkIn || "Select date"}</span>
              </div>
              <div 
                onClick={() => {
                  setCalendarOpen(true);
                  setSelectionMode("checkOut");
                }}
                className={`bg-white border border-border-gray/40 p-4 rounded-2xl shadow-xs hover:shadow-md cursor-pointer flex flex-col gap-1 transition-all ${selectionMode === "checkOut" && calendarOpen ? "ring-2 ring-brand" : ""}`}
              >
                <span className="text-[10px] font-bold text-muted uppercase tracking-wider">Checkout</span>
                <span className="font-bold text-dark text-sm">{checkOut || "Select date"}</span>
              </div>
            </div>
          </div>

          {/* Location Map Section */}
          <div className="border-b border-border-gray pb-6 flex flex-col gap-4">
            <h3 className="font-serif text-lg sm:text-xl font-bold text-dark">Where you'll be</h3>
            <p className="text-xs font-bold text-muted -mt-2 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin size={12} className="text-brand" />
              <span>{listing.location_city}, {listing.location_country}</span>
            </p>
            <div className="w-full h-[320px] rounded-2xl overflow-hidden mt-1 shadow-card border border-border-gray/40">
              <ListingMap
                listings={[listing]}
                center={listing.latitude && listing.longitude ? [listing.latitude, listing.longitude] : undefined}
                zoom={14}
                singleListing={true}
              />
            </div>
          </div>

          {/* Dynamic Reviews Section */}
          <div className="pb-6 flex flex-col gap-6">
            <div className="flex items-center gap-2 border-b border-border-gray pb-3">
              <Star size={16} className="fill-brand stroke-brand" />
              <h3 className="font-serif text-lg sm:text-xl font-bold text-dark">
                {avgRating} · {reviewsCount} review{reviewsCount !== 1 ? "s" : ""}
              </h3>
            </div>
            
            {/* Reviews list */}
            {reviewsCount === 0 ? (
              <div className="p-8 border border-dashed border-border-gray rounded-2xl text-center bg-zinc-50/50">
                <p className="text-xs text-muted italic">Be the first to review your premium stay experience at this property.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 animate-fade-in">
                {reviews.map((rev) => (
                  <div key={rev.id} className="flex flex-col gap-3 p-5 border border-border-gray/50 rounded-2xl bg-white shadow-card hover:shadow-md transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center font-bold text-brand text-xs uppercase border border-brand/10">
                        {rev.guest.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-dark">{rev.guest.name}</span>
                        <span className="text-[9px] text-muted uppercase tracking-wider">
                          {new Date(rev.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 text-accent">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={10}
                          className={i < rev.rating ? "fill-brand stroke-brand" : "stroke-brand fill-transparent"}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted leading-relaxed font-light mt-1">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Review Submission Form */}
            {user && (
              <form onSubmit={handleReviewSubmit} className="mt-4 border border-border-gray/40 p-6 rounded-2xl bg-white shadow-card flex flex-col gap-4 max-w-lg animate-fade-in">
                <h4 className="font-serif text-sm font-bold text-dark uppercase tracking-wider">Write a Review</h4>
                <p className="text-xs text-muted -mt-2 font-light">Only guests with verified, completed stays can submit reviews.</p>
                
                {reviewError && (
                  <div className="p-3 bg-red-50 border border-red-100 text-xs text-red-600 rounded-xl font-medium">
                    {reviewError}
                  </div>
                )}
                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-xs text-emerald-600 rounded-xl font-medium">
                    Review submitted successfully!
                  </div>
                )}

                {/* Interactive Star Picker */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-dark">Your Rating:</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        disabled={reviewSubmitting}
                        className="focus:outline-none cursor-pointer hover:scale-110 transition-transform"
                      >
                        <Star
                          size={16}
                          className={`
                            transition-all
                            ${
                              star <= newRating
                                ? "fill-brand stroke-brand scale-110"
                                : "stroke-brand fill-transparent"
                            }
                          `}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-bold text-dark uppercase tracking-wider">Review comments</label>
                  <textarea
                    placeholder="Share details of your boutique stay experience..."
                    rows={3}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    disabled={reviewSubmitting}
                    className="w-full border border-border-gray/60 focus:border-brand rounded-xl p-3.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-brand bg-white text-dark min-h-[4rem]"
                    required
                  />
                </div>

                <Button type="submit" variant="brand" isLoading={reviewSubmitting} className="py-2.5 font-bold text-xs uppercase tracking-wider px-6 self-start">
                  Submit Review
                </Button>
              </form>
            )}
          </div>

        </div>

        {/* Right Column (Sticky Booking Widget) */}
        <div className="lg:col-span-4 w-full">
          <div className="lg:sticky lg:top-28 border border-border-gray/40 rounded-3xl p-6 shadow-card bg-white flex flex-col gap-5 relative">
            
            <div className="flex items-end justify-between border-b border-border-gray pb-4">
              <div className="flex items-baseline gap-1 text-dark">
                <span className="font-serif text-2xl font-extrabold">₹{listing.price_per_night.toLocaleString("en-IN")}</span>
                <span className="text-xs text-muted">/ night</span>
              </div>
              {reviewsCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-dark bg-accent-light px-2 py-0.5 rounded-lg border border-accent/20">
                  <Star size={10} className="fill-accent stroke-accent" />
                  <span>{avgRating}</span>
                </span>
              )}
            </div>

            <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
              
              <div className="border border-border-gray/80 rounded-xl overflow-hidden divide-y divide-border-gray text-xs">
                <div className="grid grid-cols-2 divide-x divide-border-gray">
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarOpen(true);
                      setSelectionMode("checkIn");
                    }}
                    className={`p-3.5 flex flex-col gap-0.5 text-left cursor-pointer hover:bg-[#FAF9F6] transition-colors focus:outline-none w-full ${selectionMode === "checkIn" && calendarOpen ? "bg-[#FAF9F6] ring-1 ring-brand ring-inset" : ""}`}
                  >
                    <span className="font-bold text-[8px] uppercase tracking-widest text-dark">Check-in</span>
                    <span className="text-muted truncate font-medium">{checkIn || "Select date"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarOpen(true);
                      setSelectionMode("checkOut");
                    }}
                    className={`p-3.5 flex flex-col gap-0.5 text-left cursor-pointer hover:bg-[#FAF9F6] transition-colors focus:outline-none w-full ${selectionMode === "checkOut" && calendarOpen ? "bg-[#FAF9F6] ring-1 ring-brand ring-inset" : ""}`}
                  >
                    <span className="font-bold text-[8px] uppercase tracking-widest text-dark">Checkout</span>
                    <span className="text-muted truncate font-medium">{checkOut || "Select date"}</span>
                  </button>
                </div>
                
                <div className="p-3.5 flex flex-col gap-1">
                  <span className="font-bold text-[8px] uppercase tracking-widest text-dark">Guests</span>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-dark font-bold">
                      <Users size={12} className="text-brand" />
                      <span>{guestsCount} guest{guestsCount !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setGuestsCount((g) => Math.max(1, g - 1))}
                        disabled={guestsCount <= 1 || bookingLoading}
                        className="w-6 h-6 rounded-full border border-border-gray flex items-center justify-center text-dark disabled:opacity-30 transition-all cursor-pointer font-bold"
                      >
                        -
                      </button>
                      <button
                        type="button"
                        onClick={() => setGuestsCount((g) => Math.min(listing.guests_count, g + 1))}
                        disabled={guestsCount >= listing.guests_count || bookingLoading}
                        className="w-6 h-6 rounded-full border border-border-gray flex items-center justify-center text-dark disabled:opacity-30 transition-all cursor-pointer font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                variant={isOwner ? "secondary" : "brand"} 
                fullWidth 
                isLoading={bookingLoading} 
                disabled={isOwner || bookingLoading}
                className="py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active-press"
              >
                {isOwner ? "You own this listing" : "Reserve stay"}
              </Button>

              <p className="text-[10px] text-muted text-center leading-relaxed font-light">
                No charges yet. Confirmed under sandbox terms.
              </p>

              {checkIn && checkOut && (
                <div className="flex flex-col gap-3 mt-2 border-t border-border-gray pt-4 text-xs font-semibold text-dark">
                  <div className="flex items-center justify-between text-dark">
                    <span className="text-muted font-normal">
                      ₹{listing.price_per_night.toLocaleString("en-IN")} x {nights} nights
                    </span>
                    <span>₹{subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-dark">
                    <span className="text-muted font-normal">Cleaning fee (15%)</span>
                    <span>₹{cleaningFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between text-dark">
                    <span className="text-muted font-normal">Service fee (10%)</span>
                    <span>₹{serviceFee.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border-gray pt-3 font-bold text-dark text-base">
                    <span>Total price</span>
                    <span>₹{totalPrice.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              )}

            </form>

            {/* Responsive Calendar Picker Popover Overlay */}
            {calendarOpen && (
              <>
                {/* Click-out backdrop */}
                <div 
                  className="fixed inset-0 z-40 bg-black/20 lg:bg-transparent animate-backdrop-fade-in" 
                  onClick={() => setCalendarOpen(false)}
                />
                
                <div className="fixed inset-x-4 bottom-4 md:inset-auto md:absolute md:-right-6 md:left-auto md:top-[102%] md:w-[380px] z-50 bg-[#FAF9F6] border border-border-gray/50 rounded-3xl p-6 shadow-premium animate-responsive-calendar flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-border-gray/50 pb-2.5">
                    <span className="text-xs font-bold text-dark uppercase tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand animate-ping" />
                      {selectionMode === "checkIn" ? "Select check-in date" : "Select checkout date"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarOpen(false)}
                      className="text-xs font-bold text-brand hover:underline cursor-pointer bg-brand-light px-3 py-1 rounded-lg border border-brand/10"
                    >
                      Done
                    </button>
                  </div>
                  
                  <CalendarPicker
                    blockedDates={blockedDates}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(inDate, outDate) => {
                      setCheckIn(inDate);
                      setCheckOut(outDate);
                    }}
                    selectionMode={selectionMode}
                    setSelectionMode={setSelectionMode}
                    setCalendarOpen={setCalendarOpen}
                  />
                </div>
              </>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}
