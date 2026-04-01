import { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

const AppContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export function AppProvider({ children }) {
  const { token, user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  
  const [wishlist, setWishlist] = useState(() => {
    try { return JSON.parse(localStorage.getItem("localserve_wishlist") || "[]"); }
    catch { return []; }
  });

  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [affinityProfile, setAffinityProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("localserve_affinity")) || { categories: {}, ratingPreferences: [], pricePreferences: [] };
    } catch {
      return { categories: {}, ratingPreferences: [], pricePreferences: [] };
    }
  });

  // Fetch public data
  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/providers`).then(res => res.json()),
      fetch(`${API_URL}/reviews`).then(res => res.json())
    ])
    .then(([providersData, reviewsData]) => {
      setProviders(providersData);
      setReviews(reviewsData);
    })
    .catch(err => console.error("Failed to fetch public data", err));
  }, []);

  // Fetch private data when token changes
  useEffect(() => {
    if (token) {
      const fetchPrivateData = () => {
        // Fetch bookings
        fetch(`${API_URL}/bookings/my`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => setBookings(data))
          .catch(err => console.error("Failed to fetch bookings", err));
          
        // Fetch notifications
        fetch(`${API_URL}/notifications`, { headers: { Authorization: `Bearer ${token}` } })
          .then(res => res.json())
          .then(data => setNotifications(data))
          .catch(err => console.error("Failed to fetch notifications", err));
      };

      // Initial fetch
      fetchPrivateData();

      // Poll every 5 seconds for seamless updates
      const interval = setInterval(fetchPrivateData, 5000);

      return () => clearInterval(interval);
    } else {
      setBookings([]);
      setNotifications([]);
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem("localserve_wishlist", JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    localStorage.setItem("localserve_affinity", JSON.stringify(affinityProfile));
  }, [affinityProfile]);

  const logSearch = (query) => {
    if (!query) return;
    const q = query.toLowerCase().trim();
    setAffinityProfile(prev => ({
      ...prev,
      categories: { ...prev.categories, [q]: (prev.categories[q] || 0) + 1 }
    }));
  };

  const logFilters = (filters) => {
    setAffinityProfile(prev => {
      let ratings = prev.ratingPreferences || [];
      let prices = prev.pricePreferences || [];
      if (filters.rating > 0) ratings = [...ratings, filters.rating].slice(-10);
      if (filters.maxPrice < 5000) prices = [...prices, filters.maxPrice].slice(-10);
      return { ...prev, ratingPreferences: ratings, pricePreferences: prices };
    });
  };

  const toggleWishlist = (providerId) => {
    setWishlist((prev) =>
      prev.includes(providerId) ? prev.filter((id) => id !== providerId) : [...prev, providerId]
    );
  };

  const addRecentlyViewed = (provider) => {
    // Also log this click in AI affinity engine
    setAffinityProfile(prev => {
      const newCats = { ...prev.categories };
      if (provider.servicesOffered && provider.servicesOffered.length > 0) {
        provider.servicesOffered.forEach(s => {
          const cat = s.category.toLowerCase();
          newCats[cat] = (newCats[cat] || 0) + 2; // Clicks weigh double
        });
      } else if (provider.service) {
         const cat = provider.service.toLowerCase();
         newCats[cat] = (newCats[cat] || 0) + 2;
      }
      return { ...prev, categories: newCats };
    });

    setRecentlyViewed((prev) => {
      const filtered = prev.filter((p) => p.id !== provider.id);
      return [provider, ...filtered].slice(0, 6);
    });
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
      setBookings((prev) => [newBooking, ...prev]);
      
      setNotifications((prev) => [
        { id: `n_${Date.now()}`, message: `Booking requested!`, read: false, time: "Just now" },
        ...prev,
      ]);
      return newBooking;
    } catch (err) {
      console.error(err);
      throw err;
    }
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
    } catch (err) {
      console.error(err);
      throw err;
    }
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
      
      
      // Add the real review to the top of our list
      setReviews(prev => [data, ...prev]);

      // Update global provider list optimistically
      setProviders(prev => prev.map(p => {
        if (p.id === reviewData.providerProfileId) {
          return { ...p, rating: ((p.rating * p.reviews + data.rating) / (p.reviews + 1)).toFixed(1), reviews: p.reviews + 1 };
        }
        return p;
      }));
    } catch(err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    if (!token) return;
    try {
      await fetch(`${API_URL}/notifications/read-all`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch(err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <AppContext.Provider value={{
      providers, setProviders,
      wishlist, toggleWishlist,
      recentlyViewed, addRecentlyViewed,
      bookings, addBooking, updateBookingStatus,
      reviews, addReview,
      notifications, markAllRead, unreadCount,
      affinityProfile, logSearch, logFilters
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
