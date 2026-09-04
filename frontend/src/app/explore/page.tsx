"use client";

import React, { useState, useEffect, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { Umbrella, Home as CabinIcon, Building, Building2, Crown, Globe as DomeIcon, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { api } from "@/lib/api";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { ListingCard } from "@/components/ListingCard";
import { Loading } from "@/components/Loading";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { FilterModal } from "@/components/FilterModal";

const ListingMap = dynamic(() => import("@/components/ListingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[300px] bg-zinc-50 border border-border-gray rounded-2xl flex items-center justify-center text-xs text-muted">
      Loading map stays...
    </div>
  ),
});

// Horizontal scrollable categories mapping
const CATEGORIES = [
  { name: "Beachfront", icon: Umbrella },
  { name: "Cabins", icon: CabinIcon },
  { name: "Lofts", icon: Building },
  { name: "Townhouses", icon: Building2 },
  { name: "Mansions", icon: Crown },
  { name: "Domes", icon: DomeIcon },
];

function ListingSkeleton() {
  return (
    <div className="w-full flex flex-col gap-3 bg-white border border-border-gray/40 rounded-2xl p-3 shadow-card animate-pulse">
      <div className="relative aspect-[4/3] w-full rounded-xl bg-zinc-100/80" />
      <div className="flex items-center justify-between mt-1">
        <div className="h-3.5 bg-zinc-100/80 rounded-md w-1/3" />
        <div className="h-4 bg-zinc-100/80 rounded-md w-10" />
      </div>
      <div className="h-5 bg-zinc-100/80 rounded-md w-3/4 mt-1" />
      <div className="h-3 bg-zinc-100/80 rounded-md w-1/2 mt-1" />
      <div className="h-4 bg-zinc-100/80 rounded-md w-1/4 mt-3" />
    </div>
  );
}

function ExploreContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user } = useAuth();
  const { showToast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [savedListingIds, setSavedListingIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showMobileMap, setShowMobileMap] = useState(false);


  const fetchWishlist = async () => {
    if (user) {
      try {
        const data = await api.wishlist.getWishlist();
        setSavedListingIds(data.map((w) => w.listing_id));
      } catch (err) {
        console.error("Failed to fetch user wishlist", err);
      }
    } else {
      setSavedListingIds([]);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [user]);

  const handleToggleSave = async (listingId: number) => {
    if (!user) return;
    const isSaved = savedListingIds.includes(listingId);
    try {
      if (isSaved) {
        await api.wishlist.removeFromWishlist(listingId);
        setSavedListingIds((prev) => prev.filter((id) => id !== listingId));
        showToast("Stay removed from your wishlist.", "info");
      } else {
        await api.wishlist.addToWishlist(listingId);
        setSavedListingIds((prev) => [...prev, listingId]);
        showToast("Stay saved to your wishlist!", "success");
      }
    } catch (err: any) {
      console.error("Failed to toggle wishlist item", err);
      showToast("Unable to update wishlist. Try again.", "error");
    }
  };

  // Extract parameters from URL searchParams
  const category = searchParams.get("category") || undefined;
  const minPrice = searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined;
  const maxPrice = searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined;
  const location = searchParams.get("location") || undefined;
  const guests = searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined;
  const checkIn = searchParams.get("check_in") || undefined;
  const checkOut = searchParams.get("check_out") || undefined;
  const page = searchParams.get("page") ? Number(searchParams.get("page")) : 1;
  const limit = 12; // Listings page size limit
  const sortBy = searchParams.get("sort_by") || "newest";
  
  // Read multi-valued amenities parameters
  const amenities = searchParams.getAll("amenities");

  // Fetch listings from FastAPI whenever filters or page parameters change
  const fetchListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listings.getListings({
        category,
        min_price: minPrice,
        max_price: maxPrice,
        location,
        guests,
        check_in: checkIn,
        check_out: checkOut,
        page,
        limit,
        amenities: amenities.length > 0 ? amenities : undefined,
        sort_by: sortBy,
      });
      setListings(data);
    } catch (err: any) {
      console.error("Failed to load explore listings", err);
      setError(err.message || "Unable to load listings. Make sure the database server is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [searchParams]);

  // Toggle category filters in URL parameters
  const handleCategoryClick = (categoryName: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentCategory = params.get("category");

    if (currentCategory === categoryName) {
      params.delete("category");
    } else {
      params.set("category", categoryName);
    }
    params.set("page", "1"); // Reset pagination

    router.push(`/explore?${params.toString()}`);
  };

  // Sorting change handler
  const handleSortChange = (newSortBy: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newSortBy === "newest") {
      params.delete("sort_by");
    } else {
      params.set("sort_by", newSortBy);
    }
    params.set("page", "1"); // Reset pagination to page 1
    router.push(`/explore?${params.toString()}`);
  };

  // Reset all URL search/filter parameters
  const handleResetFilters = () => {
    router.push("/explore");
  };

  // Pagination page updater
  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`/explore?${params.toString()}`);
  };

  // Determine if active parameters are present in URL
  const hasActiveFilters = Array.from(searchParams.keys()).some(
    (key) => key !== "page"
  );

  // Active filter count builder
  const activeFiltersCount = Array.from(searchParams.keys()).filter((k) => k !== "page").length;

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Editorial Header Section */}
      <div className="flex flex-col gap-2.5 mb-2 max-w-2xl">
        <span className="text-brand font-bold tracking-widest text-[10px] uppercase">StayNest Collections</span>
        <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-dark tracking-tight leading-[1.1] text-dark">
          Find a place that feels<br />
          like your <span className="italic font-light">next story</span>.
        </h1>
        <p className="text-xs sm:text-sm text-muted leading-relaxed font-light mt-1 max-w-lg">
          Explore timber cabins, geodesic dome stays, high-ceiling lofts, country farmhouses, and luxury villas around the world.
        </p>
      </div>


      {/* Category Bar + Filters Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-gray pb-4">
        
        {/* Categories scroll container */}
        <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar py-1 pr-4">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => handleCategoryClick(cat.name)}
                className={`
                  flex items-center gap-2 px-4 py-2.5 border rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer hover:border-brand/40
                  ${
                    isActive
                      ? "border-brand bg-brand text-[#FAF9F6] shadow-xs"
                      : "border-border-gray/70 bg-white text-muted hover:text-dark"
                  }
                `}
              >
                <Icon size={14} className={isActive ? "text-accent stroke-[2.2]" : "text-muted"} />
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Sort and Filters Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="border border-border-gray/70 hover:border-brand/40 transition-all rounded-xl py-2 px-3 text-xs font-bold text-dark cursor-pointer bg-white focus:border-brand focus:ring-1 focus:ring-brand outline-none h-10 min-w-[8.5rem]"
          >
            <option value="newest">Newest Stays</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>

          <button
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2 border border-border-gray/70 hover:border-brand/40 transition-all rounded-xl py-2 px-4 text-xs font-bold text-dark cursor-pointer bg-white h-10 shadow-xs"
          >
            <SlidersHorizontal size={14} className="stroke-[2.2] text-brand" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <span className="ml-1 bg-brand text-[#FAF9F6] w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

      </div>

      {/* Active Search/Filters Ribbon */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-light/75 px-5 py-3 rounded-2xl border border-brand/10 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-2 font-medium text-dark">
            <span className="text-brand font-bold uppercase tracking-wider text-[9px] mr-1">Applied:</span>
            {location && <span className="bg-white border border-border-gray/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-dark shadow-2xs">Location: {location}</span>}
            {category && <span className="bg-white border border-border-gray/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-dark shadow-2xs">Category: {category}</span>}
            {guests && <span className="bg-white border border-border-gray/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-dark shadow-2xs">{guests} guests</span>}
            {(minPrice || maxPrice) && (
              <span className="bg-white border border-border-gray/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-dark shadow-2xs">
                Price: ₹{minPrice || 0} - ₹{maxPrice || "any"}
              </span>
            )}
            {amenities.map((am) => (
              <span key={am} className="bg-white border border-border-gray/50 px-2.5 py-1 rounded-lg text-xs font-semibold text-dark shadow-2xs">
                {am}
              </span>
            ))}
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 text-accent hover:text-accent-dark font-bold hover:underline cursor-pointer text-xs"
          >
            <RotateCcw size={12} className="stroke-[2.5]" />
            <span>Clear all</span>
          </button>
        </div>
      )}

      {/* Listings Display Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ListingSkeleton key={idx} />
          ))}
        </div>
      ) : error ? (
        <div className="w-full max-w-lg mx-auto py-8">
          <ErrorState 
            title="Failed to retrieve stays" 
            message={error} 
            onRetry={fetchListings} 
          />
        </div>
      ) : listings.length === 0 ? (
        <div className="w-full max-w-lg mx-auto py-12 px-4">
          <EmptyState
            title="No stays match your criteria"
            description="Try widening your price margins, broadening search dates, or resetting explore filters to explore StayNest."
            actionText="Clear Explore Filters"
            onAction={handleResetFilters}
          />
        </div>
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-6 w-full relative">
            {/* Listings Grid (Left Column) */}
            <div className={`w-full ${showMobileMap ? "hidden md:block" : "block"} md:w-3/5 lg:w-[58%] flex flex-col gap-6`}>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-8 animate-fade-in">
                {listings.map((listing) => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    isSaved={savedListingIds.includes(listing.id)}
                    onToggleSave={handleToggleSave}
                  />
                ))}
              </div>

              {/* Pagination Navigation Bar */}
              <div className="flex items-center justify-center gap-6 border-t border-border-gray pt-8 mt-4">
                <button
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1 border border-border-gray hover:border-dark hover:bg-light-gray rounded-xl p-2 px-4 text-xs font-semibold text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <span className="text-xs font-bold text-dark font-serif">
                  Page {page}
                </span>
                <button
                  onClick={() => handlePageChange(page + 1)}
                  disabled={listings.length < limit}
                  className="flex items-center gap-1 border border-border-gray hover:border-dark hover:bg-light-gray rounded-xl p-2 px-4 text-xs font-semibold text-dark disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white transition-colors cursor-pointer"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* Map View (Right Column) */}
            <div className={`w-full ${showMobileMap ? "block" : "hidden md:block"} md:w-2/5 lg:w-[42%] md:sticky md:top-28 h-[400px] md:h-[calc(100vh-9.5rem)] rounded-2xl overflow-hidden border border-border-gray/40 shadow-xs bg-zinc-50`}>
              <ListingMap listings={listings} />
            </div>
          </div>

          {/* Floating Mobile Map/List Toggle Button */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:hidden z-25">
            <button
              onClick={() => setShowMobileMap((prev) => !prev)}
              className="bg-brand hover:bg-brand-dark text-white font-bold py-3 px-5 rounded-xl shadow-lg flex items-center gap-2 text-xs tracking-wide hover:scale-105 active:scale-95 transition-all focus:outline-none cursor-pointer"
            >
              {showMobileMap ? (
                <>
                  <span>Show Listings List</span>
                  <SlidersHorizontal size={14} />
                </>
              ) : (
                <>
                  <span>Show Map View</span>
                  <span>🗺️</span>
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Advanced Filter Modal Overlay */}
      <FilterModal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<Loading />}>
      <ExploreContent />
    </Suspense>
  );
}
