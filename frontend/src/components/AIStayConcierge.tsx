"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sparkles, X, Send, AlertCircle, RefreshCw, Compass, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";
import { Listing } from "@/types";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  isLoading?: boolean;
  isError?: boolean;
  listingsPreview?: Listing[];
  criteria?: {
    destination?: string;
    guests?: number;
    max_price?: number;
    category?: string;
    preferences?: string[];
  };
}

export const AIStayConcierge: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  
  // Hide concierge on pages where it could interfere with critical workflows
  const shouldHide = ["/checkout", "/login", "/register", "/host"].some((p) =>
    pathname.startsWith(p)
  );

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const lastPromptRef = useRef("");

  // Initialize chatbot messages when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          sender: "bot",
          text: "Hi, I'm your StayNest Concierge. Tell me what kind of escape you're looking for and I'll find matching stays.",
        },
      ]);
    }
  }, [isOpen]);

  // Scroll to the bottom of the conversation on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Handle ESC key to close the panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (shouldHide) return null;

  const handleSendMessage = async (textToSend: string) => {
    const promptText = textToSend.trim();
    if (!promptText) return;

    lastPromptRef.current = promptText;

    // 1. Append user query
    const userMsgId = Math.random().toString(36).substring(2, 9);
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: promptText,
    };
    
    // 2. Append temporary bot loader
    const botLoaderId = Math.random().toString(36).substring(2, 9);
    const botLoader: Message = {
      id: botLoaderId,
      sender: "bot",
      text: "Finding stays for you...",
      isLoading: true,
    };

    setMessages((prev) => [...prev, userMessage, botLoader]);
    setInput("");

    try {
      // 3. Call AI Concierge parser
      const res = await api.ai.queryConcierge(promptText);
      
      if (res.criteria) {
        // Fetch 1-2 preview listings matching these parameters from StayNest API
        let matchingListings: Listing[] = [];
        try {
          const rawListings = await api.listings.getListings({
            location: res.criteria.destination || undefined,
            guests: res.criteria.guests || undefined,
            max_price: res.criteria.max_price || undefined,
            category: res.criteria.category || undefined,
          });
          matchingListings = rawListings.slice(0, 2);
        } catch (fetchErr) {
          console.error("Listing previews retrieval failed", fetchErr);
        }

        const detailsText = [
          res.criteria.destination ? `📍 ${res.criteria.destination}` : null,
          res.criteria.guests ? `👥 ${res.criteria.guests} guests` : null,
          res.criteria.max_price ? `₹ Under ₹${res.criteria.max_price.toLocaleString()}/night` : null,
          res.criteria.category ? `🏠 ${res.criteria.category}` : null,
        ]
          .filter(Boolean)
          .join(" · ");

        // Build interpreted bot message
        const botResponse: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: "bot",
          text: `Got it! I am looking for stays matching your request:\n\n${detailsText || "Curated collection"}\n\nHere's what I found:`,
          listingsPreview: matchingListings,
          criteria: res.criteria,
        };

        // Remove loader and append bot response
        setMessages((prev) =>
          prev.filter((m) => m.id !== botLoaderId).concat(botResponse)
        );
      } else {
        // Response is clarification required
        const botClarification: Message = {
          id: Math.random().toString(36).substring(2, 9),
          sender: "bot",
          text: res.message,
        };
        setMessages((prev) =>
          prev.filter((m) => m.id !== botLoaderId).concat(botClarification)
        );
      }
    } catch (err: any) {
      console.error("AI Concierge backend call failed", err);
      const botError: Message = {
        id: Math.random().toString(36).substring(2, 9),
        sender: "bot",
        text: "Sorry, I couldn't process that right now.",
        isError: true,
      };
      setMessages((prev) =>
        prev.filter((m) => m.id !== botLoaderId).concat(botError)
      );
    }
  };

  const handleShortcutClick = (query: string) => {
    handleSendMessage(query);
  };

  const handleExploreRedirect = (criteria: any) => {
    const params = new URLSearchParams();
    if (criteria.destination) params.set("location", criteria.destination);
    if (criteria.guests) params.set("guests", String(criteria.guests));
    if (criteria.max_price) params.set("max_price", String(criteria.max_price));
    if (criteria.category) params.set("category", criteria.category);
    params.set("page", "1");
    
    setIsOpen(false);
    router.push(`/explore?${params.toString()}`);
  };

  return (
    <>
      {/* Floating Action Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Ask StayNest Concierge"
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-brand hover:bg-brand-dark text-white rounded-full p-4 shadow-xl z-50 transition-all duration-300 hover:scale-105 active-press flex items-center gap-2 font-serif text-sm tracking-wide"
      >
        <Sparkles size={18} className="text-accent stroke-[2.2] animate-pulse" />
        <span className="hidden sm:inline font-bold">Ask Concierge</span>
      </button>

      {/* Floating Chat Panel Container */}
      {isOpen && (
        <div 
          role="dialog"
          aria-modal="true"
          aria-label="StayNest Concierge Chat Panel"
          className="fixed bottom-20 right-4 left-4 sm:left-auto sm:right-6 w-auto sm:w-[400px] h-[70vh] sm:h-[520px] bg-white border border-border-gray/50 rounded-2xl shadow-premium z-50 flex flex-col overflow-hidden animate-success-reveal max-h-[75vh]"
        >
          {/* Header */}
          <div className="bg-brand text-[#FAF9F6] p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-accent stroke-[2.2]" />
              <div>
                <h4 className="font-serif text-sm font-extrabold tracking-wide">StayNest Concierge</h4>
                <p className="text-[10px] text-white/70 font-light">Your AI travel assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              aria-label="Close Concierge"
              className="text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 no-scrollbar bg-[#FAF9F6]/50">
            {messages.map((msg) => {
              const isBot = msg.sender === "bot";
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col max-w-[85%] ${
                    isBot ? "self-start items-start" : "self-end items-end"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl text-xs leading-relaxed ${
                      isBot
                        ? "bg-white text-dark border border-border-gray/40 rounded-tl-none font-medium"
                        : "bg-brand text-[#FAF9F6] rounded-tr-none font-semibold"
                    }`}
                  >
                    {msg.isLoading ? (
                      <div className="flex items-center gap-2 text-muted font-bold">
                        <RefreshCw size={12} className="animate-spin text-brand" />
                        <span>Finding stays for you...</span>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line">{msg.text}</div>
                    )}
                  </div>

                  {/* Stays Previews Inside Chat */}
                  {isBot && msg.listingsPreview && msg.listingsPreview.length > 0 && (
                    <div className="flex flex-col gap-2 mt-2.5 w-full min-w-[240px]">
                      {msg.listingsPreview.map((stay) => (
                        <a
                          key={stay.id}
                          href={`/listings/${stay.id}`}
                          onClick={() => setIsOpen(false)}
                          className="flex gap-2.5 p-2 bg-white border border-border-gray/30 rounded-xl hover:border-brand/40 transition-colors group"
                        >
                          <img
                            src={stay.images?.[0]?.image_url || "/placeholder-stay.jpg"}
                            alt={stay.title}
                            className="w-12 h-12 object-cover rounded-lg bg-zinc-50"
                          />
                          <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <span className="text-[10px] font-extrabold text-dark truncate group-hover:text-brand transition-colors leading-tight">
                              {stay.title}
                            </span>
                            <span className="text-[9px] text-muted truncate leading-none mt-0.5">
                              {stay.location_city}, {stay.location_country}
                            </span>
                            <span className="text-[9px] font-extrabold text-brand mt-1 leading-none">
                              ₹{stay.price_per_night.toLocaleString()} / night
                            </span>
                          </div>
                        </a>
                      ))}
                      
                      {/* Navigate to explore redirect button */}
                      {msg.criteria && (
                        <button
                          onClick={() => handleExploreRedirect(msg.criteria)}
                          className="mt-1 flex items-center justify-center gap-1.5 w-full py-2 bg-brand/5 hover:bg-brand/10 text-brand rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border border-brand/10"
                        >
                          <span>Explore all matching stays</span>
                          <ArrowRight size={12} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* Empty matching result handler */}
                  {isBot && msg.listingsPreview && msg.listingsPreview.length === 0 && (
                    <div className="flex flex-col gap-2 mt-2 w-full min-w-[240px]">
                      <div className="p-3 bg-white border border-border-gray/40 rounded-xl text-[11px] text-muted font-medium flex items-center gap-2">
                        <AlertCircle size={14} className="text-amber-600 shrink-0" />
                        <span>No stays match those preferences yet.</span>
                      </div>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/explore");
                        }}
                        className="flex items-center justify-center gap-1.5 w-full py-2 bg-brand/5 hover:bg-brand/10 text-brand rounded-xl text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer border border-brand/10"
                      >
                        <Compass size={12} />
                        <span>Explore all stays</span>
                      </button>
                    </div>
                  )}

                  {/* Error state options */}
                  {msg.isError && (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleSendMessage(lastPromptRef.current)}
                        className="bg-brand/10 text-brand px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-brand/20 transition-colors"
                      >
                        Try again
                      </button>
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          router.push("/explore");
                        }}
                        className="bg-zinc-100 text-dark border border-border-gray px-3 py-1.5 rounded-lg text-[9px] font-bold hover:bg-zinc-200 transition-colors"
                      >
                        Search manually
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            
            {/* Show templates triggers at welcome message */}
            {messages.length === 1 && (
              <div className="flex flex-col gap-2 mt-2">
                <span className="text-[9px] font-bold uppercase text-muted tracking-widest leading-none mb-1">Suggestions:</span>
                {[
                  { text: "🌿 Peaceful nature stay", query: "Peaceful Kerala stay surrounded by nature" },
                  { text: "🏔️ Mountain escape", query: "Mountain retreat near Manali for 4 guests" },
                  { text: "🏖️ Beach getaway", query: "Quiet beach escape in Goa under ₹7000" },
                  { text: "✨ Luxury weekend", query: "Luxury stay in Hyderabad for a weekend" },
                ].map((shortcut) => (
                  <button
                    key={shortcut.text}
                    onClick={() => handleShortcutClick(shortcut.query)}
                    className="text-left text-xs font-semibold text-dark hover:text-brand bg-white border border-border-gray hover:border-brand/40 py-2 px-3 rounded-xl transition-all cursor-pointer shadow-3xs hover:scale-[1.01]"
                  >
                    {shortcut.text}
                  </button>
                ))}
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input Area */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="p-3 border-t border-border-gray bg-white flex gap-2 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tell me what you're looking for..."
              maxLength={200}
              className="flex-1 border border-border-gray/70 rounded-xl px-3.5 py-2.5 text-xs font-medium text-dark bg-[#FAF9F6] focus:border-brand focus:ring-1 focus:ring-brand outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Send message"
              className="bg-brand text-[#FAF9F6] p-2.5 rounded-xl hover:bg-brand-dark transition-all disabled:opacity-40 cursor-pointer shadow-sm active-press shrink-0"
            >
              <Send size={14} className="stroke-[2.2]" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
