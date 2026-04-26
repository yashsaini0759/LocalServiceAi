import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

import FilterSidebar from "../components/services/FilterSidebar";
import ProviderCard from "../components/services/ProviderCard";
import LoadingSkeleton from "../components/ui/LoadingSkeleton";
import EmptyState from "../components/ui/EmptyState";
import BookingModal from "../components/booking/BookingModal";

const defaultFilters = {
  rating: 0, minPrice: 0, maxPrice: 5000,
  distance: 20, availability: "all",
  verifiedOnly: false, minExperience: 0
};

const parseExpYears = (exp = "") => { const m = String(exp).match(/(\d+)/); return m ? parseInt(m[1]) : 0; };

const getProviderExp = (p) => {
  if (p.servicesOffered?.length > 0) return Math.max(...p.servicesOffered.map(s => parseExpYears(s.experience)));
  return parseExpYears(p.experience);
};

export default function ServicesPage() {
  const { providers, logSearch, logFilters, logSemanticHit, categoryStack, serverRecommendations, fetchServerRecommendations, userLocation, detectLocation } = useApp();
  const { user } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryParam = params.get("q") || "";

  const [search, setSearch] = useState(queryParam);
  const [semanticResults, setSemanticResults] = useState([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [sortBy, setSortBy] = useState(params.get("sort") || "ai"); // read ?sort from URL
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [bookingProvider, setBookingProvider] = useState(null);

  useEffect(() => { if (queryParam) { setSearch(queryParam); logSearch(queryParam); } }, [queryParam]);
  useEffect(() => { const t = setTimeout(() => { if (search?.length > 2) logSearch(search); }, 1500); return () => clearTimeout(t); }, [search]);
  useEffect(() => { const t = setTimeout(() => { if (filters !== defaultFilters) logFilters(filters); }, 1500); return () => clearTimeout(t); }, [filters]);
  useEffect(() => { setLoading(true); const t = setTimeout(() => setLoading(false), 600); return () => clearTimeout(t); }, [search, filters, sortBy]);

  // Semantic Search fetcher
  useEffect(() => {
    if (search?.length > 2) {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
      fetch(`${API_URL}/search/semantic?q=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => {
          if (!Array.isArray(data)) return setSemanticResults([]);
          setSemanticResults(data);
          // ── Smart affinity: log the REAL categories of top-matching providers ──
          // This teaches the recommendation engine what "tv not working" actually
          // means in terms of real service categories (e.g. "Appliance Repair")
          const TOP_N = 5;
          const topIds = new Set(data.slice(0, TOP_N).map(r => r.id));
          const matchedCategories = [];
          providers.forEach(p => {
            if (!topIds.has(p.id)) return;
            if (p.servicesOffered?.length > 0) {
              p.servicesOffered.forEach(s => matchedCategories.push(s.category));
            } else if (p.service) {
              matchedCategories.push(p.service);
            }
          });
          if (matchedCategories.length > 0) {
            logSemanticHit(matchedCategories);
            // Wait briefly for DB write, then refresh recommendations so
            // the homepage "Recommended For You" section updates immediately
            if (user) setTimeout(() => fetchServerRecommendations(), 900);
          }
        })
        .catch(console.error);
    } else {
      setSemanticResults([]);
    }
  }, [search, providers]);

  // Re-fetch server recommendations when sort=ai or availability changes
  useEffect(() => {
    if (sortBy === "ai" && user) fetchServerRecommendations(filters.availability);
  }, [sortBy, filters.availability, user]);

  // Build a fast lookup map: providerId → { aiScore, matchReasons }
  const aiScoreMap = {};
  serverRecommendations.forEach(p => { aiScoreMap[p.id] = { aiScore: p.aiScore, matchReasons: p.matchReasons }; });

  // ── Client-side AI fallback score using categoryStack ─────────────────────
  const getClientScore = (p) => {
    const cats = p.servicesOffered?.length > 0
      ? p.servicesOffered.map(x => x.category.toLowerCase())
      : [p.service?.toLowerCase() || ""];
    // Score by stack position: index 0 = best match
    let bestIdx = Infinity;
    cats.forEach(cat => {
      const idx = categoryStack.indexOf(cat);
      if (idx !== -1 && idx < bestIdx) bestIdx = idx;
    });
    // Convert to a descending score (stack top = highest score)
    const stackScore = bestIdx === Infinity ? 0 : (10 - bestIdx) * 20;
    return stackScore + p.rating * 5 + Math.min(p.reviews, 50) * 0.4;
  };

  // ── Filtering + Sorting ────────────────────────────────────────────────────
  const filtered = providers
    .filter(p => {
      let matchQ = true;
      if (search?.length > 2 && semanticResults.length > 0) {
        const sr = semanticResults.find(r => r.id === p.id);
        // Only include those structurally relevant mechanically via context
        if (!sr || sr.score < 0.40) matchQ = false;
      } else if (search) {
        const q = search.toLowerCase();
        matchQ = !q ||
          (p.service?.toLowerCase().includes(q)) ||
          p.name.toLowerCase().includes(q) ||
          (p.servicesOffered?.some(s => s.category.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q)));
      }

      const matchRating = p.rating >= filters.rating;
      const effectivePrice = p.servicesOffered?.length > 0 ? Math.min(...p.servicesOffered.map(s => s.price)) : p.price;
      const matchPrice = effectivePrice >= filters.minPrice && effectivePrice <= filters.maxPrice;
      const matchDist = p.distance <= filters.distance;
      const matchVerified = !filters.verifiedOnly || p.verified;
      const matchExp = !filters.minExperience || getProviderExp(p) >= filters.minExperience;
      const matchAvail = filters.availability === "all" ? true : p.available;
      return matchQ && matchRating && matchPrice && matchDist && matchVerified && matchExp && matchAvail;
    })
    .sort((a, b) => {
      if (search?.length > 2 && semanticResults.length > 0) {
        const srA = semanticResults.find(r => r.id === a.id)?.score || 0;
        const srB = semanticResults.find(r => r.id === b.id)?.score || 0;
        return srB - srA;
      }

      const getPrice = p => p.servicesOffered?.length > 0 ? Math.min(...p.servicesOffered.map(s => s.price)) : p.price;
      if (sortBy === "top_rated") return b.rating - a.rating;
      if (sortBy === "lowest_price") return getPrice(a) - getPrice(b);
      if (sortBy === "nearest") return a.distance - b.distance;
      if (sortBy === "most_booked") return b.reviews - a.reviews;
      // AI sort: server score first, client fallback
      const sA = aiScoreMap[a.id]?.aiScore ?? getClientScore(a);
      const sB = aiScoreMap[b.id]?.aiScore ?? getClientScore(b);
      return sB - sA;
    })
    // Enrich each provider with AI score data for the card
    .map(p => {
      const matchScore = semanticResults.find(r => r.id === p.id)?.score;
      return {
        ...p,
        semanticScore: (search?.length > 2 && matchScore) ? Math.round(matchScore * 100) : null,
        aiScore: sortBy === "ai" ? (aiScoreMap[p.id]?.aiScore ?? null) : null,
        matchReasons: sortBy === "ai" ? (aiScoreMap[p.id]?.matchReasons ?? []) : []
      };
    });

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <div className="bg-on-background py-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-headline font-extrabold text-white mb-4">
            {search ? `Results for "${search}"` : "Browse All Services"}
          </h1>
          <div className="flex gap-3 max-w-2xl">
            <div className="flex-1 flex items-center bg-white/10 border border-white/20 rounded-xl px-4 py-3 gap-2 focus-within:bg-white/20 transition-all">
              <span className="material-symbols-outlined text-white/60">search</span>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search service or provider..." className="flex-1 bg-transparent text-white placeholder-white/50 text-sm focus:outline-none" />
            </div>
            <button onClick={() => setShowFilters(p => !p)}
              className="md:hidden flex items-center gap-2 bg-white/10 border border-white/20 px-4 rounded-xl text-white font-semibold text-sm">
              <span className="material-symbols-outlined">tune</span> Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 flex gap-7">
        {/* Sidebar */}
        <div className={`${showFilters ? "block" : "hidden"} md:block shrink-0 w-full md:w-72`}>
          <FilterSidebar
            filters={filters} onChange={setFilters}
            sortBy={sortBy} onSortChange={setSortBy}
            onDetectLocation={detectLocation} userLocation={userLocation}
          />
        </div>

        {/* Cards */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-on-surface-variant font-medium">
              {loading ? "Loading…" : `${filtered.length} provider${filtered.length !== 1 ? "s" : ""} found`}
            </p>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-sm fill-icon">auto_awesome</span>
              <span className="text-xs text-on-surface-variant font-semibold">
                {sortBy === "ai" && user ? "AI-personalised results" : "AI-sorted results"}
              </span>
            </div>
          </div>

          {loading ? (
            <LoadingSkeleton count={6} />
          ) : filtered.length === 0 ? (
            <EmptyState icon="search_off" title="No providers found"
              description="Try broadening your filters or searching for a different service."
              action={() => setFilters(defaultFilters)} actionLabel="Reset Filters" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filtered.map(p => <ProviderCard key={p.id} provider={p} onBook={setBookingProvider} />)}
            </div>
          )}
        </div>
      </div>

      {bookingProvider && <BookingModal provider={bookingProvider} onClose={() => setBookingProvider(null)} />}
    </div>
  );
}
