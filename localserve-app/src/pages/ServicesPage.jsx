import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

import FilterSidebar from "../components/services/FilterSidebar";
import ProviderCard from "../components/services/ProviderCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import BookingModal from "../components/booking/BookingModal";
import { useEffect } from "react";

const defaultFilters = { rating: 0, minPrice: 0, maxPrice: 5000, distance: 20, availability: "all", verifiedOnly: false };

export default function ServicesPage() {
  const { providers, logSearch, logFilters, affinityProfile } = useApp();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = params.get("q") || "";

  const [search, setSearch] = useState(queryParam);
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState("ai");
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [bookingProvider, setBookingProvider] = useState(null);

  useEffect(() => {
    if (queryParam) {
      setSearch(queryParam);
      logSearch(queryParam);
    }
  }, [queryParam]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (search && search.length > 2) logSearch(search);
    }, 1500);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (filters !== defaultFilters) logFilters(filters);
    }, 1500);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, [search, filters, sortBy]);

  useEffect(() => {
    if (queryParam) setSearch(queryParam);
  }, [queryParam]);

  const filtered = providers
    .filter((p) => {
      const q = search.toLowerCase();
      const matchQ = !q || 
        (p.service && p.service.toLowerCase().includes(q)) || 
        p.name.toLowerCase().includes(q) ||
        (p.servicesOffered && p.servicesOffered.some(s => s.category.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)));
      const matchRating = p.rating >= filters.rating;
      const matchPrice = p.price >= filters.minPrice && p.price <= filters.maxPrice;
      const matchDistance = p.distance <= filters.distance;
      const matchVerified = !filters.verifiedOnly || p.verified;
      return matchQ && matchRating && matchPrice && matchDistance && matchVerified;
    })
    .sort((a, b) => {
      const getPrice = (p) => p.servicesOffered?.length > 0 ? Math.min(...p.servicesOffered.map(s => s.price)) : p.price;
      
      if (sortBy === "top_rated") return b.rating - a.rating;
      if (sortBy === "lowest_price") return getPrice(a) - getPrice(b);
      if (sortBy === "nearest") return a.distance - b.distance;
      if (sortBy === "most_booked") return b.reviews - a.reviews;
      
      // AI MATCH ALGORITHM
      const getMatchScore = (p) => {
         let s = 0;
         // 1. Category Affinity
         const categories = p.servicesOffered && p.servicesOffered.length > 0 
            ? p.servicesOffered.map(x => x.category.toLowerCase().trim()) 
            : [p.service?.toLowerCase().trim() || ""];
            
         categories.forEach(cat => {
            if (affinityProfile?.categories?.[cat]) {
                s += affinityProfile.categories[cat] * 12; // High weight for category match
            }
         });
         
         // 2. Rating Affinity
         const avgPrefRating = affinityProfile?.ratingPreferences?.length > 0 
             ? affinityProfile.ratingPreferences.reduce((acc, val) => acc + val, 0) / affinityProfile.ratingPreferences.length 
             : 0;
         if (avgPrefRating > 0 && p.rating >= avgPrefRating) s += 15;
         
         // 3. Price Affinity
         const pPrice = getPrice(p);
         const avgPrefPrice = affinityProfile?.pricePreferences?.length > 0
             ? affinityProfile.pricePreferences.reduce((acc, val) => acc + val, 0) / affinityProfile.pricePreferences.length
             : 0;
         if (avgPrefPrice > 0 && pPrice <= avgPrefPrice) s += 15;
         
         // 4. Global Reputation Baseline
         s += p.rating * 5; 
         s += Math.min(p.reviews, 50) * 0.4;
         
         // 5. Global tag boost
         if (p.tags.includes("AI Recommended")) s += 10;
         
         return s;
      };
      
      return getMatchScore(b) - getMatchScore(a);
    });

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-on-background py-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-white mb-4">
            {search ? `Results for "${search}"` : "Browse All Services"}
          </h1>
          {/* Search Bar */}
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-3 gap-2 focus-within:bg-white/20 transition-all">
              <span className="material-symbols-outlined text-white/60">search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search service or provider..."
                className="flex-1 bg-transparent text-white placeholder-white/50 text-sm focus:outline-none"
              />
            </div>
            <button
              onClick={() => setShowFilters((p) => !p)}
              className="md:hidden flex items-center gap-2 bg-white/10 border border-white/20 px-4 rounded-xl text-white font-semibold text-sm"
            >
              <span className="material-symbols-outlined">tune</span>
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex gap-7">
        {/* Sidebar */}
        <div className={`${showFilters ? "block" : "hidden"} md:block shrink-0 w-full md:w-72`}>
          <FilterSidebar filters={filters} onChange={setFilters} sortBy={sortBy} onSortChange={setSortBy} />
        </div>

        {/* Cards */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-on-surface-variant font-medium">
              {loading ? "Loading..." : `${filtered.length} provider${filtered.length !== 1 ? "s" : ""} found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-sm fill-icon">auto_awesome</span>
              <span className="text-xs text-on-surface-variant font-semibold">AI-sorted results</span>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="search_off"
              title="No providers found"
              description="Try broadening your filters or searching for a different service."
              action={() => setFilters(defaultFilters)}
              actionLabel="Reset Filters"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map((p) => (
                <ProviderCard key={p.id} provider={p} onBook={setBookingProvider} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingProvider && (
        <BookingModal provider={bookingProvider} onClose={() => setBookingProvider(null)} />
      )}
    </div>
  );
}
