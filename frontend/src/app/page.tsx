"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Star, Heart, Users, Sparkles, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/Button";
import { DiscoverIndiaSlideshow } from "@/components/DiscoverIndiaSlideshow";
import { ListingCard } from "@/components/ListingCard";
import { api } from "@/lib/api";
import { Listing } from "@/types";

export default function LandingPage() {
  const [featuredStays, setFeaturedStays] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const data = await api.listings.getListings({ limit: 3 });
        setFeaturedStays(data.slice(0, 3));
      } catch (err) {
        console.error("Failed to load featured stays", err);
      } finally {
        setLoading(false);
      }
    };
    loadFeatured();
  }, []);

  return (
    <div className="flex flex-col gap-24 w-full py-4 sm:py-8 select-none">
      
      {/* 1. PREMIUM HERO SECTION */}
      <section className="relative rounded-3xl overflow-hidden aspect-[4/3] sm:aspect-[21/9] bg-brand text-white flex flex-col justify-center px-6 sm:px-16 shadow-premium">
        
        {/* Soft atmospheric overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark/95 via-brand-dark/60 to-transparent z-0 pointer-events-none" />
        <div 
          className="absolute inset-0 opacity-50 mix-blend-overlay bg-cover bg-center z-0 pointer-events-none"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1600&q=80')" }}
        />

        <div className="relative z-10 max-w-xl flex flex-col gap-6">
          <span className="text-accent font-bold tracking-widest text-xs uppercase flex items-center gap-1.5 animate-fade-in">
            <Sparkles size={12} className="text-accent" /> Premium Boutique Escapes
          </span>
          <h1 className="font-serif text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1] text-[#FAF9F6]">
            Find places <br />
            <span className="italic font-light text-accent">worth staying</span> for.
          </h1>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/80 leading-relaxed max-w-md font-light">
            From quiet backwater havens across India to architectural masterworks nestled deep in nature around the world.
          </p>
          
          {/* Subtle decoration accent line */}
          <div className="flex items-center gap-3.5 mt-1">
            <div className="h-[1px] w-8 bg-[#FAF9F6]/40" />
            <span className="text-[10px] uppercase tracking-wider text-[#FAF9F6]/60 font-medium">India & the World</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-2">
            <Link href="/explore">
              <Button variant="brand" className="bg-accent hover:bg-accent-dark border-none text-white py-3.5 px-8 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all">
                Explore Stays
              </Button>
            </Link>
            <Link href="/register?role=host">
              <Button variant="secondary" className="bg-white/10 border border-white/20 hover:bg-white/20 hover:border-white/40 text-[#FAF9F6] py-3.5 px-6 font-bold text-xs uppercase tracking-wider rounded-xl transition-all">
                Become a Host
              </Button>
            </Link>
          </div>
        </div>

      </section>

      {/* 2. EDITORIAL INTRO SECTION */}
      <section className="max-w-4xl mx-auto text-center py-4 flex flex-col items-center gap-6">
        <span className="text-accent text-xs font-bold tracking-widest uppercase">Travel Differently</span>
        <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-dark leading-snug tracking-tight">
          StayNest brings together places with character.
        </h2>
        <p className="text-sm sm:text-base text-muted font-light leading-relaxed max-w-2xl">
          We curate properties with distinctive architectural style and geographic elegance. From high-altitude alpine log cabins to sun-drenched coastal villas and royal Rajasthani heritage estates.
        </p>
      </section>

      {/* 3. EDITORIAL DESTINATIONS COMPOSITION */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold tracking-wider text-brand uppercase">Curated Portfolios</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark tracking-tight">
            Sanctuaries of character
          </h2>
          <p className="text-xs sm:text-sm text-muted max-w-lg">
            Discover destinations defined by unique architectural heritage, coastal breezes, and alpine solace.
          </p>
        </div>

        {/* Custom Editorial Magazine Layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Main Large Feature */}
          <Link 
            href="/explore?location=Goa" 
            className="md:col-span-2 md:row-span-2 relative rounded-3xl overflow-hidden aspect-[4/3] md:aspect-square group bg-zinc-100 shadow-sm border border-border-gray/30 flex flex-col justify-end p-8"
          >
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80" 
              alt="Goa" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-[6000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1.5 text-white">
              <span className="text-accent text-[10px] font-bold uppercase tracking-widest">Featured Coastline</span>
              <h3 className="font-serif text-3xl font-extrabold tracking-tight">Goa</h3>
              <p className="text-xs text-white/80 font-light max-w-xs">Slow mornings by the sea. Palm-fringed golden sands and private tropical villas.</p>
            </div>
          </Link>

          {/* Column 2 Smaller Dest 1 */}
          <Link 
            href="/explore?location=Kerala" 
            className="relative rounded-3xl overflow-hidden aspect-[16/10] md:aspect-auto md:h-full group bg-zinc-100 shadow-sm border border-border-gray/30 flex flex-col justify-end p-6"
          >
            <img 
              src="https://images.unsplash.com/photo-1593693397690-362cb9666fc2?auto=format&fit=crop&w=500&q=80" 
              alt="Kerala" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-[6000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1 text-white">
              <span className="text-accent text-[9px] font-bold uppercase tracking-wider">Misty Tropics</span>
              <h4 className="font-serif text-xl font-bold">Kerala</h4>
              <p className="text-[10px] text-white/70 font-light">Waterfront sanctuaries and backwater lagoons.</p>
            </div>
          </Link>

          {/* Column 2 Smaller Dest 2 */}
          <Link 
            href="/explore?location=Jaipur" 
            className="relative rounded-3xl overflow-hidden aspect-[16/10] md:aspect-auto md:h-full group bg-zinc-100 shadow-sm border border-border-gray/30 flex flex-col justify-end p-6"
          >
            <img 
              src="https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=500&q=80" 
              alt="Jaipur" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-[6000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1 text-white">
              <span className="text-accent text-[9px] font-bold uppercase tracking-wider">Royal Heritage</span>
              <h4 className="font-serif text-xl font-bold">Jaipur</h4>
              <p className="text-[10px] text-white/70 font-light">Rajasthani terracotta arches and historic havelis.</p>
            </div>
          </Link>

          {/* Bottom Columns */}
          <Link 
            href="/explore?location=Manali" 
            className="relative rounded-3xl overflow-hidden aspect-[16/10] md:aspect-auto group bg-zinc-100 shadow-sm border border-border-gray/30 flex flex-col justify-end p-6"
          >
            <img 
              src="https://images.unsplash.com/photo-1605649487212-47bdab064df7?auto=format&fit=crop&w=500&q=80" 
              alt="Manali" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-[6000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1 text-white">
              <span className="text-accent text-[9px] font-bold uppercase tracking-wider">Mountain Solace</span>
              <h4 className="font-serif text-xl font-bold">Manali</h4>
              <p className="text-[10px] text-white/70 font-light">Alpine cabins amidst snow-capped peaks.</p>
            </div>
          </Link>

          <Link 
            href="/explore?location=Srinagar" 
            className="relative rounded-3xl overflow-hidden aspect-[16/10] md:aspect-auto group bg-zinc-100 shadow-sm border border-border-gray/30 flex flex-col justify-end p-6"
          >
            <img 
              src="https://images.unsplash.com/photo-1566228015668-4c45dbc4e2f5?auto=format&fit=crop&w=500&q=80" 
              alt="Srinagar" 
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-103 transition-transform duration-[6000ms] ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0 pointer-events-none" />
            <div className="relative z-10 flex flex-col gap-1 text-white">
              <span className="text-accent text-[9px] font-bold uppercase tracking-wider">Himalayan Escapes</span>
              <h4 className="font-serif text-xl font-bold">Srinagar</h4>
              <p className="text-[10px] text-white/70 font-light">Wooden houseboats floating on tranquil lakes.</p>
            </div>
          </Link>
        </div>
      </section>

      {/* 4. DISCOVER INDIA SLIDESHOW SECTION */}
      <DiscoverIndiaSlideshow />

      {/* 5. CURATED FEATURED STAYS */}
      <section className="flex flex-col gap-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold tracking-wider text-brand uppercase">Curated Escapes</span>
            <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark tracking-tight">
              Places with a story
            </h2>
            <p className="text-xs sm:text-sm text-muted">
              A few handpicked stays worth building an entire journey around.
            </p>
          </div>
          <Link href="/explore" className="text-xs font-bold text-brand hover:underline inline-flex items-center gap-1.5 active-press">
            Browse All Stays <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex flex-col gap-4 animate-pulse">
                <div className="aspect-[4/3] w-full bg-zinc-150 rounded-2xl" />
                <div className="h-4 w-2/3 bg-zinc-150 rounded" />
                <div className="h-3 w-1/2 bg-zinc-150 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredStays.map((stay) => (
              <div key={stay.id} className="relative transition-all hover:scale-[1.01]">
                <ListingCard listing={stay} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 6. WHY STAYNEST SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-6 border-t border-border-gray/50 items-start">
        <div className="lg:col-span-5 flex flex-col gap-4">
          <span className="text-accent text-xs font-bold tracking-widest uppercase">The Sanctuary Standard</span>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-brand leading-[1.15] tracking-tight">
            Not just somewhere <br />to sleep.
          </h2>
          <p className="text-xs sm:text-sm text-muted leading-relaxed max-w-sm mt-2">
            Every listing under our domain passes manual verification protocols to match our high architectural design guidelines.
          </p>
        </div>

        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-8 lg:pl-8">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Curated Stays
            </h3>
            <p className="text-xs text-muted leading-relaxed font-light">
              We vet every layout, check natural light, verify private paths, and ensure authentic interior curation.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Transparent booking
            </h3>
            <p className="text-xs text-muted leading-relaxed font-light">
              Interactive block systems prevent calendar collision. Dynamic pricing details render with zero surprise commissions.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Hosts with character
            </h3>
            <p className="text-xs text-muted leading-relaxed font-light">
              Connect with owners who maintain beautiful domains, offer local insights, and support premium hospitality.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Verified Reviews
            </h3>
            <p className="text-xs text-muted leading-relaxed font-light">
              Zero fake accounts. Comments can only be posted by verified users who have completed their transaction checkouts.
            </p>
          </div>
        </div>
      </section>

      {/* 7. HOW IT WORKS SECTION */}
      <section className="flex flex-col gap-12 bg-white/80 border border-border-gray/50 rounded-3xl p-8 sm:p-12 shadow-xs">
        <div className="text-center max-w-2xl mx-auto flex flex-col gap-2">
          <span className="text-xs font-bold tracking-wider text-brand uppercase">Step by Step</span>
          <h2 className="font-serif text-2xl sm:text-4xl font-extrabold text-dark tracking-tight">
            How StayNest works
          </h2>
          <p className="text-xs sm:text-sm text-muted">
            Your journey from initial inspiration to check-in, made completely seamless.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex flex-col gap-2 px-4 border-l border-border-gray/60 relative">
            <span className="font-serif text-5xl font-extrabold text-brand/15 leading-none">01</span>
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider mt-1">Discover</h3>
            <p className="text-xs text-muted leading-relaxed font-light mt-1">
              Find a stay that feels right. Filter stays by architectural collections or search for specific Indian and global destinations.
            </p>
          </div>

          <div className="flex flex-col gap-2 px-4 border-l border-border-gray/60 relative">
            <span className="font-serif text-5xl font-extrabold text-brand/15 leading-none">02</span>
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider mt-1">Plan</h3>
            <p className="text-xs text-muted leading-relaxed font-light mt-1">
              Verify calendar dates and lock in your selection. Check fee calculations before proceeding to our secure verification panel.
            </p>
          </div>

          <div className="flex flex-col gap-2 px-4 border-l border-border-gray/60 relative">
            <span className="font-serif text-5xl font-extrabold text-brand/15 leading-none">03</span>
            <h3 className="text-sm font-extrabold text-dark uppercase tracking-wider mt-1">Go</h3>
            <p className="text-xs text-muted leading-relaxed font-light mt-1">
              Check in to your sanctuary. Access secure host directions and enjoy verified, premium boutique experiences.
            </p>
          </div>
        </div>
      </section>

      {/* 8. HORIZONTAL TRUST BAND */}
      <section className="border-y border-border-gray/50 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-3xl font-extrabold text-brand">28+</span>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Curated Stays</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-3xl font-extrabold text-brand">6+</span>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Countries</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-3xl font-extrabold text-brand">4.9/5</span>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Guest Experience</span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="font-serif text-3xl font-extrabold text-brand">100%</span>
          <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Verified Booking Flow</span>
        </div>
      </section>

      {/* 9. PREMIUM HOST CTA SECTION */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center bg-[#1E3F20] text-[#FAF9F6] rounded-3xl overflow-hidden shadow-premium">
        
        {/* Left Side: Editorial Image */}
        <div className="lg:col-span-6 relative aspect-[4/3] lg:aspect-square bg-zinc-800 overflow-hidden w-full h-full min-h-[300px]">
          <img 
            src="https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80" 
            alt="Premium Interior hosting design" 
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right Side: Copy & CTA */}
        <div className="lg:col-span-6 flex flex-col gap-6 p-8 sm:p-12">
          <span className="text-accent text-xs font-bold tracking-widest uppercase flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-accent rounded-full" /> Host Community
          </span>
          <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#FAF9F6] leading-[1.1] tracking-tight">
            Your space could be someone's next escape.
          </h2>
          <p className="text-xs sm:text-sm text-[#FAF9F6]/80 leading-relaxed font-light">
            List your luxury cottages, modern apartments, or beachfront villas. Coordinate reservations on a secure interface and log revenue details transparently.
          </p>
          <Link href="/register?role=host" className="self-start mt-2">
            <Button variant="brand" className="bg-[#FAF9F6] text-[#1E3F20] hover:bg-[#FAF9F6]/90 border-none py-3.5 px-8 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md">
              Start Hosting
            </Button>
          </Link>
        </div>
      </section>

      {/* 10. FINAL INSPIRATION CTA */}
      <section className="rounded-3xl bg-[#FAF9F6] border border-border-gray/40 text-dark p-8 sm:p-16 flex flex-col items-center text-center gap-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <span className="text-brand text-xs font-bold tracking-widest uppercase">Start your escape</span>
        <h2 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight max-w-xl text-dark leading-tight">
          Ready to experience the extraordinary?
        </h2>
        <p className="text-xs sm:text-sm text-muted max-w-md font-light leading-relaxed">
          Book your confirmed escape now and explore curated cabins, mansions, domes, and beach villas around the globe.
        </p>
        <Link href="/explore">
          <Button variant="brand" className="bg-brand text-[#FAF9F6] hover:bg-brand-dark border-none py-3.5 px-8 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md mt-2">
            Browse All Stays
          </Button>
        </Link>
      </section>

    </div>
  );
}
