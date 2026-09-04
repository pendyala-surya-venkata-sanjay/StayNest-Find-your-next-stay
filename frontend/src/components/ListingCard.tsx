import React from "react";
import Link from "next/link";
import { Star, Heart } from "lucide-react";
import { Listing } from "@/types";
import { useAuth } from "@/context/AuthContext";

interface ListingCardProps {
  listing: Listing;
  isSaved?: boolean;
  onToggleSave?: (listingId: number) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  isSaved = false,
  onToggleSave,
}) => {
  const { user } = useAuth();

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      alert("Please log in or register using the profile menu to save items to your wishlist!");
      return;
    }

    if (onToggleSave) {
      onToggleSave(listing.id);
    }
  };

  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0].image_url
    : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

  // Dynamic reviews rating calculations
  const reviewsCount = listing.reviews?.length || 0;
  const avgRating = reviewsCount > 0 && listing.reviews
    ? (listing.reviews.reduce((sum: number, r) => sum + r.rating, 0) / reviewsCount).toFixed(2)
    : "New";

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col gap-3 w-full cursor-pointer bg-white border border-border-gray/40 rounded-2xl p-3 shadow-card hover-lift"
    >
      {/* Property Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-50">
        <img
          src={imageUrl}
          alt={listing.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 img-transition"
          loading="lazy"
        />

        {/* Wishlist Heart Toggle */}
        <button
          onClick={handleWishlistClick}
          className="absolute top-2.5 right-2.5 p-2 rounded-full bg-white/95 hover:bg-white backdrop-blur-md shadow-xs active-press transition-all text-dark border border-border-gray/30 focus:outline-none"
          aria-label="Save to wishlist"
        >
          <Heart
            size={16}
            className={`
              transition-all duration-200
              ${
                isSaved
                  ? "fill-brand stroke-brand scale-110"
                  : "stroke-dark fill-transparent hover:stroke-brand"
              }
            `}
          />
        </button>

        {/* Category Badge overlay */}
        <div className="absolute bottom-2.5 left-2.5 bg-brand-light/95 backdrop-blur-xs border border-brand/10 px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest text-brand">
          {listing.category}
        </div>
      </div>

      {/* Description Content */}
      <div className="flex flex-col flex-1 px-1 py-1">
        {/* Rating and Location Header */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
            {listing.location_city}, {listing.location_country}
          </span>

          {/* Star Rating Badge */}
          <span className="flex items-center gap-1 bg-accent-light/60 border border-accent/20 px-2 py-0.5 rounded-lg text-[10px] font-extrabold text-accent-dark">
            <Star size={10} className="fill-accent stroke-accent" />
            <span>{avgRating}</span>
          </span>
        </div>

        {/* Serif Title */}
        <h3 className="font-serif text-base font-bold text-dark mt-2 line-clamp-1 group-hover:text-brand transition-colors">
          {listing.title}
        </h3>

        {/* Metadata Details */}
        <p className="text-xs text-muted mt-1 font-medium">
          {listing.guests_count} guest{listing.guests_count !== 1 ? "s" : ""} · {listing.bedrooms_count} bedroom{listing.bedrooms_count !== 1 ? "s" : ""}
        </p>

        {/* Pricing breakdown */}
        <div className="flex items-baseline gap-1 mt-auto pt-3 border-t border-border-gray/40">
          <span className="font-serif text-base font-extrabold text-brand">
            ₹{listing.price_per_night.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-muted font-medium">/ night</span>
        </div>
      </div>
    </Link>
  );
};
export default ListingCard;
