import { useState } from "react";

const SORT_OPTIONS = [
  { value: "ai", label: "AI Recommended", icon: "auto_awesome" },
  { value: "top_rated", label: "Top Rated", icon: "star" },
  { value: "lowest_price", label: "Lowest Price", icon: "payments" },
  { value: "nearest", label: "Nearest First", icon: "near_me" },
  { value: "most_booked", label: "Most Booked", icon: "local_fire_department" },
];

export default function FilterSidebar({ filters, onChange, onSortChange, sortBy }) {
  const [expanded, setExpanded] = useState({ rating: true, price: true, distance: true, availability: true, sort: true });
  const toggle = (k) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  const setFilter = (key, value) => onChange({ ...filters, [key]: value });

  return (
    <div className="w-full space-y-1">
      <div className="bg-white rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-outline-variant/10 flex items-center justify-between">
          <h3 className="font-bold text-on-surface">Filters</h3>
          <button
            onClick={() => onChange({ rating: 0, minPrice: 0, maxPrice: 5000, distance: 20, availability: "all", verifiedOnly: false })}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Reset All
          </button>
        </div>

        {/* Sort By */}
        <Section label="Sort By" icon="sort" expanded={expanded.sort} onToggle={() => toggle("sort")}>
          <div className="space-y-1">
            {SORT_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-container-low cursor-pointer">
                <input
                  type="radio"
                  name="sort"
                  value={opt.value}
                  checked={sortBy === opt.value}
                  onChange={() => onSortChange(opt.value)}
                  className="accent-primary"
                />
                <span className="material-symbols-outlined text-primary text-lg">{opt.icon}</span>
                <span className="text-sm font-medium text-on-surface">{opt.label}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Rating */}
        <Section label="Minimum Rating" icon="star" expanded={expanded.rating} onToggle={() => toggle("rating")}>
          <div className="space-y-1">
            {[0, 3, 4, 4.5].map((r) => (
              <label key={r} className="flex items-center gap-2 p-2 rounded-xl hover:bg-surface-container-low cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  checked={filters.rating === r}
                  onChange={() => setFilter("rating", r)}
                  className="accent-primary"
                />
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i} className={`material-symbols-outlined text-secondary text-xs ${i < Math.ceil(r) ? "fill-icon" : ""}`}>star</span>
                  ))}
                </div>
                <span className="text-sm text-on-surface">{r === 0 ? "All" : `${r}★ & above`}</span>
              </label>
            ))}
          </div>
        </Section>

        {/* Price Range */}
        <Section label="Price Range" icon="payments" expanded={expanded.price} onToggle={() => toggle("price")}>
          <div className="px-2 space-y-3">
            <div className="flex justify-between text-xs text-on-surface-variant font-semibold">
              <span>₹{filters.minPrice}</span>
              <span>₹{filters.maxPrice}</span>
            </div>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              value={filters.maxPrice}
              onChange={(e) => setFilter("maxPrice", Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex gap-2">
              {[500, 1000, 2000, 5000].map((p) => (
                <button
                  key={p}
                  onClick={() => setFilter("maxPrice", p)}
                  className={`flex-1 py-1 text-xs font-semibold rounded-lg border transition-all ${
                    filters.maxPrice === p ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                  }`}
                >
                  ₹{p <= 999 ? p : p / 1000 + "k"}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* Distance */}
        <Section label="Distance" icon="near_me" expanded={expanded.distance} onToggle={() => toggle("distance")}>
          <div className="px-2 space-y-2">
            <p className="text-xs text-on-surface-variant">Within <span className="font-bold text-primary">{filters.distance} km</span></p>
            <input
              type="range"
              min="1"
              max="20"
              value={filters.distance}
              onChange={(e) => setFilter("distance", Number(e.target.value))}
              className="w-full accent-primary"
            />
          </div>
        </Section>

        {/* Availability */}
        <Section label="Availability" icon="calendar_month" expanded={expanded.availability} onToggle={() => toggle("availability")}>
          <div className="grid grid-cols-3 gap-2">
            {["all", "today", "tomorrow"].map((a) => (
              <button
                key={a}
                onClick={() => setFilter("availability", a)}
                className={`py-2 text-xs font-semibold rounded-xl border transition-all capitalize ${
                  filters.availability === a ? "border-primary bg-primary/10 text-primary" : "border-outline-variant/30 text-on-surface-variant hover:border-primary/40"
                }`}
              >
                {a === "all" ? "Any Time" : a.charAt(0).toUpperCase() + a.slice(1)}
              </button>
            ))}
          </div>
        </Section>

        {/* Verified Only */}
        <div className="px-5 py-4 border-t border-outline-variant/10">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-lg fill-icon">verified</span>
              <span className="text-sm font-semibold text-on-surface">Verified Providers Only</span>
            </div>
            <div
              onClick={() => setFilter("verifiedOnly", !filters.verifiedOnly)}
              className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${filters.verifiedOnly ? "bg-primary" : "bg-surface-container-high"}`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${filters.verifiedOnly ? "translate-x-5" : "translate-x-1"}`} />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

function Section({ label, icon, expanded, onToggle, children }) {
  return (
    <div className="border-t border-outline-variant/10">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-surface-container-low transition-colors">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-lg">{icon}</span>
          <span className="text-sm font-bold text-on-surface">{label}</span>
        </div>
        <span className={`material-symbols-outlined text-on-surface-variant text-sm transition-transform ${expanded ? "rotate-180" : ""}`}>expand_more</span>
      </button>
      {expanded && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}
