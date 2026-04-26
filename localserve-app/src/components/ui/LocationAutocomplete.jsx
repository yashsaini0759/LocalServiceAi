import { useState, useEffect, useRef } from "react";
import { useApp } from "../../context/AppContext";

export default function LocationAutocomplete({ 
  value, 
  onChange, 
  placeholder = "Enter your city or area", 
  className = "",
  inputClassName = "w-full bg-white border border-outline-variant/30 text-on-surface rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-primary transition-colors text-sm font-medium",
  hideIcon = false
}) {
  const { detectLocation, userLocation } = useApp();
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Use Nominatim free API for actual location suggestions
  useEffect(() => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const fetchLocations = async () => {
      setLoading(true);
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`);
        const data = await res.json();
        setSuggestions(data.map(item => item.display_name));
      } catch (err) {
        console.error("Failed to fetch location", err);
      } finally {
        setLoading(false);
      }
    };

    const debounceFn = setTimeout(fetchLocations, 500);
    return () => clearTimeout(debounceFn);
  }, [query]);

  // Handle GPS Auto detection Reverse Geocoding
  useEffect(() => {
    if (userLocation && userLocation.lat && userLocation.lng && userLocation.label !== query) {
      // Reverse geocode
      const getCity = async () => {
        try {
          setQuery("Detecting exact area...");
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLocation.lat}&lon=${userLocation.lng}`);
          const data = await res.json();
          // Construct a nice address string, using city or town
          const address = data.address;
          const label = `${address.suburb || address.neighbourhood || ""}, ${address.city || address.town || address.state || ""}`.replace(/^, /, "").trim();
          const finalLabel = label || data.display_name.split(",").slice(0, 2).join(",");
          setQuery(finalLabel);
          onChange(finalLabel);
        } catch (err) {
          console.error("Reverse geocoding failed", err);
          setQuery("Current Location");
          onChange("Current Location");
        }
      };
      getCity();
    }
  }, [userLocation]);

  const handleSelect = (loc) => {
    setQuery(loc);
    onChange(loc);
    setShowDropdown(false);
  };

  const handleUseGPS = () => {
    setShowDropdown(false);
    detectLocation();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="flex items-center relative">
        {!hideIcon && <span className="material-symbols-outlined text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2 text-xl">location_on</span>}
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={placeholder}
          className={inputClassName}
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {showDropdown && (query.length >= 1 || suggestions.length === 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-outline-variant/20 overflow-hidden z-50 animate-slideDown">
          <button
            type="button"
            onMouseDown={handleUseGPS}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-tertiary/5 text-left border-b border-outline-variant/10"
          >
            <span className="material-symbols-outlined text-tertiary text-lg">my_location</span>
            <span className="text-sm text-tertiary font-semibold">Use current GPS location</span>
          </button>
          
          {suggestions.length > 0 && (
            <div className="py-1 max-h-60 overflow-y-auto w-full">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onMouseDown={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-primary/5 text-left"
                >
                  <span className="material-symbols-outlined text-on-surface-variant text-base shrink-0">map</span>
                  <span className="text-sm text-on-surface font-medium truncate">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
