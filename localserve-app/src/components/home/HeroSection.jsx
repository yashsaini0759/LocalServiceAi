import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { searchSuggestions } from "../../data/mockData";
import { useApp } from "../../context/AppContext";
import LocationAutocomplete from "../ui/LocationAutocomplete";

export default function HeroSection() {
  const navigate = useNavigate();
  const { recentSearches, userLocation, detectLocation } = useApp();
  const [serviceQuery, setServiceQuery] = useState("");
  const [location, setLocation] = useState("Mumbai, MH");
  const [suggestions, setSuggestions] = useState([]);
  const [showRecent, setShowRecent] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (serviceQuery.length >= 1) {
      const filtered = searchSuggestions.filter((s) =>
        s.toLowerCase().includes(serviceQuery.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
      setShowRecent(false);
    } else {
      setSuggestions([]);
      setShowRecent(focused);
    }
  }, [serviceQuery, focused]);

  const handleSearch = (query = serviceQuery) => {
    if (!query.trim()) return;
    navigate(`/services?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(location)}`);
  };

  // UserLocation logic is now handled in LocationAutocomplete, but if we need a direct ref we could keep it.
  // We can remove the old useCurrentLocation since it's built into LocationAutocomplete.
  // The location state still holds the current string query.

  const showDropdown = suggestions.length > 0 || (showRecent && recentSearches.length > 0);

  return (
    <section className="max-w-7xl mx-auto px-6 md:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center overflow-hidden">
      {/* Left Content */}
      <motion.div 
        initial={{ opacity: 0, x: -40 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="space-y-8"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-bold">
          <span className="material-symbols-outlined text-base fill-icon">auto_awesome</span>
          AI-Powered Service Marketplace
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-headline font-extrabold text-on-surface tracking-tight leading-[1.1]">
          Find Trusted Local{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Experts</span>{" "}
          Near You
        </h1>

        <p className="text-lg text-on-surface-variant max-w-lg leading-relaxed">
          Search, compare, and book verified professionals powered by smart AI recommendations. Experience the future of local services.
        </p>

        {/* Smart Search Bar */}
        <div className="relative">
          <div className={`bg-white rounded-2xl shadow-xl flex items-center overflow-visible border transition-all ${focused ? "border-primary ring-4 ring-primary/10" : "border-outline-variant/20"}`}>
            {/* Location */}
            <div className="flex items-center px-4 py-3 gap-2 border-r border-outline-variant/20 min-w-0 shrink-0">
              <span className="material-symbols-outlined text-primary text-xl fill-icon">location_on</span>
              <LocationAutocomplete 
                value={location}
                onChange={setLocation}
                placeholder="Where?"
                hideIcon={true}
                className="max-w-[140px]"
                inputClassName="w-full bg-transparent border-none text-sm font-semibold text-on-surface focus:outline-none placeholder-on-surface-variant/70 cursor-pointer"
              />
            </div>

            {/* Service Input */}
            <div className="flex-1 flex items-center px-4 py-3">
              <span className="material-symbols-outlined text-on-surface-variant mr-2 text-xl">search</span>
              <input
                ref={inputRef}
                type="text"
                value={serviceQuery}
                onChange={(e) => setServiceQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setTimeout(() => { setFocused(false); setShowRecent(false); }, 150)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="What service do you need?"
                className="w-full bg-transparent border-none text-sm text-on-surface placeholder-on-surface-variant/50 focus:outline-none"
              />
              {serviceQuery && (
                <button onClick={() => setServiceQuery("")} className="ml-1 text-on-surface-variant hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            <button
              onClick={() => handleSearch()}
              className="bg-primary text-on-primary px-6 py-3 m-1.5 rounded-xl font-bold text-sm hover:bg-primary-dim transition-all hover:scale-95 shrink-0 flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span className="hidden sm:block">Search</span>
            </button>
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden z-40 animate-slideDown">
              {suggestions.length > 0 ? (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-bold text-on-surface-variant uppercase tracking-wide">Suggestions</p>
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => { setServiceQuery(s); handleSearch(s); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 text-left"
                    >
                      <span className="material-symbols-outlined text-primary text-lg">search</span>
                      <span className="text-sm text-on-surface font-medium">{s}</span>
                    </button>
                  ))}
                </>
              ) : (
                <>
                  <p className="px-4 pt-3 pb-1 text-xs font-bold text-on-surface-variant uppercase tracking-wide">Recent Searches</p>
                  {recentSearches.map((s) => (
                    <button
                      key={s}
                      onMouseDown={() => { setServiceQuery(s); handleSearch(s); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-primary/5 text-left"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-lg">history</span>
                      <span className="text-sm text-on-surface">{s}</span>
                    </button>
                  ))}

                </>
              )}
            </div>
          )}
        </div>

        {/* Feature Badges */}
        <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-tertiary fill-icon">verified</span> Verified Pros
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-secondary fill-icon">auto_awesome</span> AI-Powered
          </span>
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-primary fill-icon">shield</span> Secure Booking
          </span>
        </div>
      </motion.div>

      {/* Right Image */}
      <motion.div 
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
        className="relative"
      >
        <div className="rounded-2xl overflow-hidden bg-surface-container-high aspect-[4/5] relative shadow-2xl">
          <img
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCW9QQjUZhxBtRHjHSlD2F53T5ZVg6ZUKtFUPe5AAropbTMMzVFgObO32JhawQ_tRAhqHb7ph_y9bQs6ySH4mAtxs_KNJL3NuwshURxfhkAYGmHMQMdGNuAij8RqCHDjt5bVfvWtUXaxquMafkoD1MXvSTD73nm1WCABEK8H3ZhoJKYsIY6ScK5H2SLbFwTxY2UZ--8RCXjDpeZjYSZSopLfqtmK8zw8cAakX5_8VYSqWKBlUTGNl-r1hxjaHYbLDhwBAsRMBDk4KaI"
            alt="Professional electrician working"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
        </div>

        {/* Floating Cards */}
        <div className="absolute -bottom-6 -left-6 right-4 flex gap-3 overflow-x-auto scrollbar-hide pb-2">
          {[
            { icon: "electric_bolt", bg: "bg-tertiary-container", text: "text-on-tertiary-container", label: "AI Recommended", title: "Top Rated Electricians", rating: "4.8" },
            { icon: "cleaning_services", bg: "bg-primary-container", text: "text-on-primary-container", label: "Most Popular", title: "Home Cleaning", rating: "4.9" },
          ].map((card, idx) => (
            <motion.div 
              key={card.title} 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 + idx * 0.15, ease: "easeOut" }}
              whileHover={{ scale: 1.05 }}
              className="min-w-[210px] bg-white/90 backdrop-blur-xl p-3.5 rounded-xl shadow-xl border border-white/30 flex items-center gap-3 cursor-pointer"
            >
              <div className={`h-11 w-11 rounded-full ${card.bg} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${card.text}`}>{card.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">{card.label}</p>
                <h4 className="font-bold text-on-surface text-sm">{card.title}</h4>
                <div className="flex items-center gap-1 text-sm font-semibold">
                  <span className="material-symbols-outlined text-secondary text-sm fill-icon">star</span>
                  <span>{card.rating}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
