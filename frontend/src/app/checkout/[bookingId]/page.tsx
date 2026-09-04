"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, CreditCard, ShieldCheck, CheckCircle2, Calendar, Users, DollarSign, Sparkles, Building, MapPin, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { Booking } from "@/types";
import { Button } from "@/components/Button";
import { Loading } from "@/components/Loading";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/context/ToastContext";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default function CheckoutPage({ params }: PageProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const resolvedParams = use(params);
  const bookingId = Number(resolvedParams.bookingId);

  // States
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // Validation error states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Checkout transaction states
  const [processing, setProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [revealStep, setRevealStep] = useState(0);

  const fetchBooking = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.bookings.getBooking(bookingId);
      setBooking(data);
    } catch (err: any) {
      console.error("Failed to load checkout booking", err);
      setError(err.message || "Failed to retrieve booking information.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  // Reveal step sequence trigger
  useEffect(() => {
    if (confirmed) {
      setRevealStep(1);
      const t1 = setTimeout(() => setRevealStep(2), 200);
      const t2 = setTimeout(() => setRevealStep(3), 450);
      const t3 = setTimeout(() => setRevealStep(4), 700);
      
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [confirmed]);

  // Card formatting helpers
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = rawVal.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(" "));
    } else {
      setCardNumber(rawVal);
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/\//g, "").replace(/[^0-9]/gi, "");
    if (rawVal.length >= 2) {
      setCardExpiry(`${rawVal.substring(0, 2)}/${rawVal.substring(2, 4)}`);
    } else {
      setCardExpiry(rawVal);
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!cardName.trim()) {
      errors.cardName = "Cardholder name is required";
    }

    const cleanCard = cardNumber.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleanCard)) {
      errors.cardNumber = "Card number must be exactly 16 digits";
    }

    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardExpiry)) {
      errors.cardExpiry = "Expiry date must be in MM/YY format";
    } else {
      const [month, year] = cardExpiry.split("/");
      const expDate = new Date(Number(`20${year}`), Number(month) - 1, 1);
      const today = new Date();
      if (expDate < new Date(today.getFullYear(), today.getMonth(), 1)) {
        errors.cardExpiry = "Card has expired";
      }
    }

    if (!/^\d{3,4}$/.test(cardCvv)) {
      errors.cardCvv = "CVV must be 3 or 4 digits";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please check card form error highlights.", "error");
      return;
    }

    setProcessing(true);
    // Simulate transaction delay
    setTimeout(() => {
      setProcessing(false);
      setConfirmed(true);
      showToast("Payment processed successfully! Enjoy your stay.", "success");
    }, 2000);
  };

  if (loading) {
    return <Loading fullPage />;
  }

  if (error || !booking) {
    return (
      <div className="py-12 max-w-lg mx-auto px-4">
        <ErrorState
          title="Booking Not Found"
          message={error || "The checkout session you are trying to access is invalid or expired."}
          onRetry={fetchBooking}
        />
        <div className="text-center mt-6">
          <Link href="/explore" className="text-brand font-bold hover:underline inline-flex items-center gap-1.5 text-sm">
            <ChevronLeft size={16} />
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  if (booking.status === "cancelled") {
    return (
      <div className="py-16 max-w-lg mx-auto px-4 text-center flex flex-col gap-6 items-center bg-white border border-border-gray/40 rounded-3xl p-8 shadow-card my-12 animate-fade-in">
        <div className="p-4 bg-red-50 text-red-500 rounded-full border border-red-100">
          <AlertTriangle size={36} />
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="font-serif text-2xl font-extrabold text-dark tracking-tight">Booking Cancelled</h1>
          <p className="text-xs text-muted max-w-xs font-light leading-relaxed">
            You cannot complete checkout because this booking reservation has already been cancelled.
          </p>
        </div>
        <Link href="/explore" className="w-full">
          <Button variant="brand" className="w-full py-3 font-bold text-xs uppercase tracking-wider rounded-xl shadow-md active-press">
            Return to Explore
          </Button>
        </Link>
      </div>
    );
  }

  const { listing } = booking;
  const imageUrl = listing.images && listing.images.length > 0
    ? listing.images[0].image_url
    : "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=800&q=80";

  // RENDER CONFIRMATION REVEAL STATE
  if (confirmed) {
    return (
      <div className="w-full max-w-xl mx-auto py-10 px-4 sm:px-6 flex flex-col items-center text-center gap-6 bg-[#FAF9F6] select-none">
        
        {revealStep >= 1 && (
          <div className="p-4 bg-brand-light text-brand rounded-full border border-brand/10 shadow-xs animate-success-icon">
            <CheckCircle2 size={56} className="stroke-[1.8]" />
          </div>
        )}
        
        {revealStep >= 2 && (
          <div className="flex flex-col gap-2 animate-success-reveal">
            <span className="inline-flex items-center justify-center gap-1.5 px-3 py-1 text-xs font-semibold text-brand bg-brand-light border border-brand/20 rounded-full mx-auto">
              <Sparkles size={12} className="text-accent" />
              Reservation Verified Successfully
            </span>
            <h1 className="font-serif text-3xl sm:text-5xl font-extrabold tracking-tight text-dark mt-2 leading-tight">
              Your stay is confirmed
            </h1>
            <p className="text-xs text-muted">
              Booking Reference ID: <span className="font-bold text-dark">{booking.id}</span>
            </p>
          </div>
        )}

        {/* Confirmation Details Card */}
        {revealStep >= 3 && (
          <div className="w-full border border-border-gray/40 rounded-3xl overflow-hidden shadow-card bg-white text-left mt-2 animate-success-reveal">
            <img src={imageUrl} alt={listing.title} className="w-full h-48 object-cover" />
            <div className="p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-bold text-brand uppercase tracking-wider">{listing.category}</span>
                <h3 className="font-serif text-lg font-extrabold text-dark truncate mt-0.5">{listing.title}</h3>
                <p className="text-xs text-muted mt-0.5">{listing.location_city}, {listing.location_country}</p>
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

              <div className="border-t border-border-gray/40 pt-4 flex items-center justify-between font-bold text-dark text-base">
                <span>Total Paid (Mock)</span>
                <span className="font-serif text-lg text-brand">₹{booking.total_price.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {revealStep >= 4 && (
          <div className="grid grid-cols-2 gap-4 w-full mt-4 animate-success-reveal">
            <Button variant="secondary" onClick={() => router.push("/explore")} className="py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active-press">
              Explore Stays
            </Button>
            <Button variant="brand" onClick={() => router.push("/trips")} className="py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active-press">
              View My Trips
            </Button>
          </div>
        )}
      </div>
    );
  }

  // RENDER CHECKOUT PAYMENT FORM
  return (
    <div className="w-full max-w-6xl mx-auto py-2 px-4 sm:px-6 bg-[#FAF9F6]">
      
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-bold text-dark hover:underline mb-6 cursor-pointer"
      >
        <ChevronLeft size={16} />
        Back to details
      </button>

      {/* Progress Indicator */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between text-xs font-semibold text-muted mb-8 border-b border-border-gray/30 pb-4">
        <div className="flex items-center gap-1.5 text-brand">
          <span className="w-5 h-5 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-[10px] border border-brand/10">1</span>
          <span>Stay Selected</span>
        </div>
        <div className="h-px bg-border-gray/60 flex-1 mx-4" />
        <div className="flex items-center gap-1.5 text-brand">
          <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center font-bold text-[10px] border border-brand/10">2</span>
          <span>Payment Info</span>
        </div>
        <div className="h-px bg-border-gray/60 flex-1 mx-4" />
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-full bg-light-gray text-muted flex items-center justify-center font-bold text-[10px] border border-border-gray/50">3</span>
          <span>Confirmation</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Mock Card payment Form */}
        <div className="lg:col-span-7 bg-white border border-border-gray/40 rounded-3xl p-6 shadow-card flex flex-col gap-6">
          <div className="flex flex-col gap-1 border-b border-border-gray/40 pb-4">
            <h2 className="font-serif text-xl sm:text-2xl font-extrabold text-dark flex items-center gap-2">
              <CreditCard className="text-brand shrink-0" size={24} />
              Payment Information
            </h2>
            <p className="text-xs text-muted">Complete payment to finalize your booking reservation.</p>
          </div>

          <div className="p-4 bg-amber-50 text-amber-800 rounded-2xl border border-amber-100 flex items-start gap-3 text-xs leading-relaxed font-semibold">
            <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-dark font-extrabold">StayNest Secure Checkout Sandbox Mode</strong>
              <p className="font-normal font-light text-muted-dark mt-0.5">
                This is a secure billing checkout simulation. Use any valid mock card numbers (e.g. 16 digits) to trigger successful booking reservations. Real currency is not transacted.
              </p>
            </div>
          </div>

          <form onSubmit={handlePaySubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-dark uppercase tracking-wider">Cardholder Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={cardName}
                onChange={(e) => setCardName(e.target.value)}
                disabled={processing}
                className={`w-full border ${formErrors.cardName ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-border-gray/60 focus:border-brand focus:ring-brand"} rounded-xl p-3.5 text-xs transition-all focus:outline-none focus:ring-1 bg-white text-dark`}
                required
              />
              {formErrors.cardName && (
                <span className="text-[10px] text-red-500 font-semibold">{formErrors.cardName}</span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-dark uppercase tracking-wider">Card Number</label>
              <input
                type="text"
                placeholder="0000 0000 0000 0000"
                value={cardNumber}
                onChange={handleCardNumberChange}
                maxLength={19}
                disabled={processing}
                className={`w-full border ${formErrors.cardNumber ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-border-gray/60 focus:border-brand focus:ring-brand"} rounded-xl p-3.5 text-xs transition-all focus:outline-none focus:ring-1 bg-white text-dark`}
                required
              />
              {formErrors.cardNumber && (
                <span className="text-[10px] text-red-500 font-semibold">{formErrors.cardNumber}</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-dark uppercase tracking-wider">Expiration Date</label>
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  maxLength={5}
                  disabled={processing}
                  className={`w-full border ${formErrors.cardExpiry ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-border-gray/60 focus:border-brand focus:ring-brand"} rounded-xl p-3.5 text-xs transition-all focus:outline-none focus:ring-1 bg-white text-dark`}
                  required
                />
                {formErrors.cardExpiry && (
                  <span className="text-[10px] text-red-500 font-semibold">{formErrors.cardExpiry}</span>
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-bold text-dark uppercase tracking-wider">CVV / CVC</label>
                <input
                  type="password"
                  placeholder="000"
                  value={cardCvv}
                  onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/gi, ""))}
                  maxLength={4}
                  disabled={processing}
                  className={`w-full border ${formErrors.cardCvv ? "border-red-500 focus:ring-red-500 focus:border-red-500" : "border-border-gray/60 focus:border-brand focus:ring-brand"} rounded-xl p-3.5 text-xs transition-all focus:outline-none focus:ring-1 bg-white text-dark`}
                  required
                />
                {formErrors.cardCvv && (
                  <span className="text-[10px] text-red-500 font-semibold">{formErrors.cardCvv}</span>
                )}
              </div>
            </div>

            <Button type="submit" variant="brand" fullWidth isLoading={processing} className="mt-4 py-3.5 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md active-press">
              {processing ? "Confirming your reservation..." : "Confirm and Pay"}
            </Button>
          </form>

        </div>

        {/* Right Side: Booking pricing Summary Card */}
        <div className="lg:col-span-5 bg-white border border-border-gray/40 rounded-3xl p-6 shadow-card flex flex-col gap-5 lg:sticky lg:top-28">
          
          {/* Card Header listing info */}
          <div className="flex gap-4 items-start border-b border-border-gray/40 pb-4">
            <img src={imageUrl} alt={listing.title} className="w-24 h-20 object-cover rounded-2xl shrink-0" />
            <div className="flex flex-col justify-center min-h-[5rem] overflow-hidden">
              <span className="text-[9px] font-bold text-brand uppercase tracking-wider">{listing.category}</span>
              <h4 className="font-serif text-base font-extrabold text-dark truncate mt-0.5 leading-tight">{listing.title}</h4>
              <p className="text-xs text-muted truncate mt-0.5 flex items-center gap-1">
                <MapPin size={10} className="text-brand" />
                <span>{listing.location_city}, {listing.location_country}</span>
              </p>
            </div>
          </div>

          {/* Booking Parameters details list */}
          <div className="flex flex-col gap-3.5 border-b border-border-gray/40 pb-4 text-xs font-semibold text-dark">
            <h4 className="font-serif text-xs font-bold text-dark tracking-wider uppercase">Trip details</h4>
            <div className="flex justify-between items-center mt-1">
              <span className="text-muted font-normal">Dates</span>
              <span>{booking.check_in} – {booking.check_out}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted font-normal">Guests</span>
              <span>{booking.guests_count} guest{booking.guests_count !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted font-normal">Stay duration</span>
              <span>{booking.number_of_nights} night{booking.number_of_nights !== 1 ? "s" : ""}</span>
            </div>
          </div>

          {/* Pricing calculations breakdown */}
          <div className="flex flex-col gap-3 text-xs font-semibold">
            <h4 className="font-serif text-xs font-bold text-dark tracking-wider uppercase mb-1">Price details</h4>
            <div className="flex justify-between items-center text-dark">
              <span className="text-muted font-normal">₹{booking.nightly_price.toLocaleString("en-IN")} x {booking.number_of_nights} nights</span>
              <span>₹{(booking.nightly_price * booking.number_of_nights).toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-dark">
              <span className="text-muted font-normal">Cleaning fee (15%)</span>
              <span>₹{booking.cleaning_fee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center text-dark">
              <span className="text-muted font-normal">Service fee (10%)</span>
              <span>₹{booking.service_fee.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between items-center border-t border-border-gray/40 pt-3 font-bold text-dark text-base">
              <span>Total Paid (Mock)</span>
              <span className="font-serif text-lg text-brand">₹{booking.total_price.toLocaleString("en-IN")}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
