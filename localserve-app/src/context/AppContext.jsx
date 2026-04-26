import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AppProvider({ children }) {
  const { token, user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [serverRecommendations, setServerRecommendations] = useState([]);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, label }

  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localserve_wishlist") || "[]"); }
    catch { return []; }
  });

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentSearches, setRecentSearches] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localserve_recent_searches") || "[]"); }
    catch { return []; }
  });

  // Simple ordered stack: index 0 = most recently interacted category
  const [categoryStack, setCategoryStack] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localserve_cat_stack") || "[]"); }
    catch { return []; }
  });

  // Push a category to the FRONT of the stack (deduplicated, keep last 10)
  const pushCategory = useCallback((cat) => {
    if (!cat) return;
    const c = cat.toLowerCase().trim();
    setCategoryStack(prev => [c, ...prev.filter(x => x !== c)].slice(0, 10));
  }, []);

  // ── Fire-and-forget server affinity logger ─────────────────────────────────
  const logAffinityToServer = useCallback((category, eventType, weight = 1.0) => {
    if (!token || !category) return;
    fetch(`${API_URL}/affinity`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ category: category.toLowerCase().trim(), eventType, weight })
    }).catch(() => {}); // silent – never blocks UI
  }, [token]);

  // ── GPS Location Detection ──────────────────────────────────────────────────
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setUserLocation(prev => ({ ...prev, label: "Detecting…" }));
    navigator.geolocation.getCurrentPosition(
      pos => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude, label: "Current Location" }),
      ()  => setUserLocation(null),
      { timeout: 8000 }
    );
  }, []);

  // ── Fetch server-scored recommendations ────────────────────────────────────
  const fetchServerRecommendations = useCallback(async (availabilityFilter = "all") => {
    if (!token) return;
    try {
      // Send the local categoryStack so server sorts the same way
      const stackParam = categoryStack.length > 0 ? `&stack=${encodeURIComponent(categoryStack.join(','))}` : "";
      const res = await fetch(`${API_URL}/recommendations?limit=30${stackParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setServerRecommendations(await res.json());
    } catch (err) { console.error("Failed to fetch recommendations", err); }
  }, [token]);

  // ── Public data fetch ──────────────────────────────────────────────────────
  const fetchPublicData = useCallback(() => {
    Promise.all([
      fetch(`${API_URL}/providers`).then(r => r.ok ? r.json() : []),
      fetch(`${API_URL}/reviews`).then(r => r.ok ? r.json() : [])
    ])
    .then(([pData, rData]) => { 
      if (Array.isArray(pData)) setProviders(pData); 
      if (Array.isArray(rData)) setReviews(rData); 
    })
    .catch(err => console.error("Failed to fetch public data", err));
  }, []);

  useEffect(() => {
    fetchPublicData();
    // Poll public data every 15 seconds to keep the general catalog fresh
    const publicInterval = setInterval(fetchPublicData, 15000);
    return () => clearInterval(publicInterval);
  }, [fetchPublicData]);

  // ── Private data + polling ─────────────────────────────────────────────────
  useEffect(() => {
    if (token) {
      const fetchPrivateData = () => {
        fetch(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).then(data => { if (Array.isArray(data)) setBookings(data) }).catch(console.error);
        fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
          .then(r => r.ok ? r.json() : []).then(data => { if (Array.isArray(data)) setNotifications(data) }).catch(console.error);
        
        fetchServerRecommendations(); // Background poll for AI updating live
      };
      fetchPrivateData();
      fetchServerRecommendations(); // initial AI recs on login
      const interval = setInterval(fetchPrivateData, 5000);
      return () => clearInterval(interval);
    } else {
      setBookings([]); setNotifications([]); setServerRecommendations([]);
    }
  }, [token, fetchServerRecommendations]);

  useEffect(() => { localStorage.setItem("localserve_wishlist", JSON.stringify(wishlist)); }, [wishlist]);
  useEffect(() => { localStorage.setItem("localserve_cat_stack", JSON.stringify(categoryStack)); }, [categoryStack]);
  useEffect(() => { localStorage.setItem("localserve_recent_searches", JSON.stringify(recentSearches)); }, [recentSearches]);

  // Re-fetch server recommendations whenever the stack changes (instant updates after click/search)
  useEffect(() => {
    if (token && categoryStack.length > 0) {
      fetchServerRecommendations();
    }
  }, [categoryStack]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Affinity tracking ──────────────────────────────────────────────────────
  const logSearch = (query) => {
    if (!query) return;
    const q = query.toLowerCase().trim();
    setRecentSearches(prev => [query, ...prev.filter(s => s.toLowerCase() !== q)].slice(0, 4));
  };

  // Called when semantic search returns results — push matched categories onto the stack
  const logSemanticHit = useCallback((providerCategories) => {
    if (!providerCategories?.length) return;
    const uniqueCats = [...new Set(providerCategories.map(c => c.toLowerCase().trim()))];
    // Push all matched categories; first one lands at index 0 (top of stack)
    uniqueCats.forEach(cat => {
      pushCategory(cat);
      logAffinityToServer(cat, "search", 0.8);
    });
  }, [pushCategory, logAffinityToServer]);

  const logFilters = () => {}; // no-op

  const toggleWishlist = (providerId) => {
    setWishlist(prev => prev.includes(providerId) ? prev.filter(id => id !== providerId) : [...prev, providerId]);
  };

  // Called when user clicks any provider card — pushes that category to top of stack
  const addRecentlyViewed = (provider) => {
    const cats = provider.servicesOffered?.length > 0
      ? provider.servicesOffered.map(s => s.category.toLowerCase())
      : [provider.service?.toLowerCase() || ""];
    // Push primary category to top of stack
    if (cats[0]) pushCategory(cats[0]);
    // Also log to server DB for logged-in users
    cats.forEach(cat => logAffinityToServer(cat, "click", 2.0));
    setRecentlyViewed(prev => [provider, ...prev.filter(p => p.id !== provider.id)].slice(0, 6));
  };

  const addBooking = async (bookingData) => {
    if (!token) return null;
    try {
      const res = await fetch(`${API_URL}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(bookingData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to book");
      const newBooking = { ...data, providerName: bookingData.providerName, service: bookingData.service };
      setBookings(prev => [newBooking, ...prev]);
      setNotifications(prev => [{ id: `n_${Date.now()}`, message: "Booking requested!", read: false, time: "Just now" }, ...prev]);
      // Log booking affinity
      if (bookingData.service) logAffinityToServer(bookingData.service.toLowerCase(), "book", 3.0);
      return newBooking;
    } catch (err) { console.error(err); throw err; }
  };

  const updateBookingStatus = async (bookingId, newStatus) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      setBookings(prev => prev.map(b => b.id === bookingId ? data : b));
      return data;
    } catch (err) { console.error(err); throw err; }
  };

  const addReview = async (reviewData) => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(reviewData)
      });
      const data = await res.json();
      setReviews(prev => [data, ...prev]);
      setProviders(prev => prev.map(p => {
        if (p.id === reviewData.providerProfileId) {
          return { ...p, rating: +((p.rating * p.reviews + data.rating) / (p.reviews + 1)).toFixed(1), reviews: p.reviews + 1 };
        }
        return p;
      }));
      // Log review affinity
      if (data.providerName) logAffinityToServer(data.providerName.toLowerCase(), "review", 2.5);
    } catch (err) { console.error(err); }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/read-all`, { method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) { console.error(err); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AppContext.Provider value={{
      providers, setProviders,
      wishlist, toggleWishlist,
      recentlyViewed, addRecentlyViewed,
      bookings, addBooking, updateBookingStatus,
      reviews, addReview,
      notifications, markAllRead, unreadCount,
      categoryStack, pushCategory, logSearch, logFilters, logSemanticHit, recentSearches,
      serverRecommendations, fetchServerRecommendations,
      userLocation, detectLocation
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
